"""Aggregate + time-series metric tracking for a simulation run."""

from __future__ import annotations

from dataclasses import dataclass, field

from engine.network.graph import RoadNetwork
from engine.vehicles.vehicle_manager import VehicleManager


@dataclass
class MetricsTracker:
    """Collects per-tick samples and rolling aggregates for a single run.

    A bounded in-memory time series is kept for charts; the API layer decides
    what (if anything) to persist to PostgreSQL — individual ticks are NOT
    written to the database.
    """

    max_history: int = 1000
    history: list[dict[str, float]] = field(default_factory=list)

    total_travel_time: float = 0.0
    total_waiting_time: float = 0.0
    max_congestion: float = 0.0
    emergency_response_times: list[float] = field(default_factory=list)
    elapsed: float = 0.0

    def update(self, tick: int, time: float, manager: VehicleManager, network: RoadNetwork) -> None:
        self.elapsed = time

        active_speeds = [
            v.speed for v in manager.vehicles.values() if v.speed > 0.0
        ]
        avg_speed = sum(active_speeds) / len(active_speeds) if active_speeds else 0.0

        congestions = [r.congestion for r in network.edges.values()]
        avg_congestion = sum(congestions) / len(congestions) if congestions else 0.0
        max_congestion_now = max(congestions) if congestions else 0.0
        self.max_congestion = max(self.max_congestion, max_congestion_now)

        self.total_waiting_time = sum(
            v.waiting_time for v in manager.vehicles.values()
        )

        for vehicle in manager.vehicles.values():
            if vehicle.status.value == "completed" and vehicle.completed_at == tick:
                self.total_travel_time += vehicle.travel_time
                if vehicle.is_emergency:
                    self.emergency_response_times.append(vehicle.travel_time)

        self.history.append(
            {
                "tick": tick,
                "time": time,
                "avg_congestion": round(avg_congestion, 4),
                "max_congestion": round(max_congestion_now, 4),
                "avg_speed": round(avg_speed, 4),
                "active": float(manager.active_count),
                "waiting": float(manager.waiting_count),
                "completed": float(manager.completed_count),
            }
        )
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]

    def summary(self, manager: VehicleManager) -> dict[str, object]:
        completed = manager.completed_count
        avg_travel_time = (
            self.total_travel_time / completed if completed else 0.0
        )
        throughput = (
            completed / self.elapsed if self.elapsed > 0 else 0.0
        )
        emergency_avg = (
            sum(self.emergency_response_times) / len(self.emergency_response_times)
            if self.emergency_response_times
            else 0.0
        )
        return {
            "total_vehicles": len(manager.vehicles),
            "active_vehicles": manager.active_count,
            "waiting_vehicles": manager.waiting_count,
            "completed_vehicles": completed,
            "total_travel_time": round(self.total_travel_time, 2),
            "avg_travel_time": round(avg_travel_time, 2),
            "total_waiting_time": round(self.total_waiting_time, 2),
            "avg_speed": round(
                sum(s["avg_speed"] for s in self.history) / len(self.history), 2
            )
            if self.history
            else 0.0,
            "max_congestion": round(self.max_congestion, 4),
            "throughput": round(throughput, 4),
            "emergency_response_time": round(emergency_avg, 2),
            "route_computation_ms": round(manager.route_computation_ms, 2),
            "elapsed": round(self.elapsed, 2),
        }
