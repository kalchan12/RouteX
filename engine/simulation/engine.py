"""Discrete-time simulation engine — the heart of RouteX.

Each tick performs, in order:

1. advance the simulation clock
2. process scheduled events (road closure, accident, traffic spike, ...)
3. spawn due vehicles and move all active vehicles
4. update road occupancy, congestion and dynamic travel times
5. re-route vehicles whose roads changed state
6. update metrics

The engine is deterministic: the same scenario + seed + configuration always
produces the same behaviour.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from engine.analytics.metrics import MetricsTracker
from engine.config import ScenarioConfig
from engine.network.edge import RoadStatus
from engine.network.network_builder import build_network
from engine.simulation.clock import SimulationClock
from engine.simulation.events import EventQueue, EventType, SimulationEvent
from engine.simulation.state import build_snapshot
from engine.traffic.traffic_lights import build_lights
from engine.vehicles.vehicle_manager import VehicleManager


class SimulationStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class SimulationConfig:
    scenario_id: str = ""
    algorithm: str = "dijkstra"
    seed: int = 42
    max_ticks: int = 0
    speed: float = 1.0


class SimulationEngine:
    def __init__(
        self, scenario: ScenarioConfig, config: SimulationConfig | None = None
    ) -> None:
        self.scenario = scenario
        self.config = config or SimulationConfig(scenario_id=scenario.id)
        if self.config.max_ticks <= 0:
            self.config.max_ticks = scenario.duration
        self._rebuild()

    # ------------------------------------------------------------------ #
    # Lifecycle
    # ------------------------------------------------------------------ #
    def _rebuild(self) -> None:
        self.rng = random.Random(self.config.seed)
        self.clock = SimulationClock(tick_duration=1.0)
        self.network = build_network(self.scenario.network, self.rng)
        self.lights = build_lights(self.network, self.scenario.traffic_lights)
        self.manager = VehicleManager(
            self.network,
            self.scenario,
            self.rng,
            self.clock,
            self.lights,
            self.config.algorithm,
        )
        self.events = EventQueue()
        self.metrics = MetricsTracker()
        self.status = SimulationStatus.PENDING
        self.tick_events: list[dict[str, Any]] = []
        self._spike_ticks_left = 0
        self._spike_rate = 0
        self._schedule_events(self.scenario.events)

    def _schedule_events(self, raw_events: list[dict[str, Any]]) -> None:
        for raw in raw_events:
            self.events.schedule(SimulationEvent.from_dict(raw))

    def start(self) -> None:
        if self.status in (SimulationStatus.PENDING, SimulationStatus.PAUSED):
            self.status = SimulationStatus.RUNNING

    def pause(self) -> None:
        if self.status is SimulationStatus.RUNNING:
            self.status = SimulationStatus.PAUSED

    def stop(self) -> None:
        self.status = SimulationStatus.STOPPED

    def complete(self) -> None:
        if self.status is SimulationStatus.RUNNING:
            self.status = SimulationStatus.COMPLETED

    def reset(self) -> None:
        """Rebuild the simulation from scratch (deterministic replay)."""
        self._rebuild()

    # ------------------------------------------------------------------ #
    # Stepping
    # ------------------------------------------------------------------ #
    def step(self) -> None:
        if self.status is not SimulationStatus.RUNNING:
            return
        if self.clock.tick >= self.config.max_ticks:
            self.complete()
            return

        self.tick_events = []
        self.clock.step()
        self._process_events()
        self._process_traffic_spike()
        self.manager.step()
        self._refresh_network_state()
        self.metrics.update(self.clock.tick, self.clock.time, self.manager, self.network)

        if self.clock.tick >= self.config.max_ticks:
            self.complete()

    def run(self, steps: int) -> None:
        self.start()
        for _ in range(steps):
            if self.status is not SimulationStatus.RUNNING:
                break
            self.step()

    def snapshot(self) -> dict[str, Any]:
        return build_snapshot(self).to_dict()

    # ------------------------------------------------------------------ #
    # Internals
    # ------------------------------------------------------------------ #
    def _process_events(self) -> None:
        for event in self.events.pending(self.clock.tick):
            self.events.mark_applied(event)
            self.tick_events.append(event.to_dict())
            self._apply_event(event)

    def _apply_event(self, event: SimulationEvent) -> None:
        if event.type is EventType.ROAD_CLOSURE:
            self._set_road_status(event.road_id, RoadStatus.CLOSED)
        elif event.type is EventType.ROAD_REOPENING:
            self._set_road_status(event.road_id, RoadStatus.OPEN)
        elif event.type is EventType.ACCIDENT:
            self._set_road_status(event.road_id, RoadStatus.ACCIDENT)
        elif event.type is EventType.VEHICLE_SPAWN:
            self.manager.spawn_extra(int(event.payload.get("count", 1)))
        elif event.type is EventType.TRAFFIC_SPIKE:
            self._spike_rate = int(event.payload.get("count", 2))
            self._spike_ticks_left = max(1, event.duration)
        elif event.type is EventType.EMERGENCY_VEHICLE:
            self.manager.spawn_emergency(int(event.payload.get("count", 1)))
        elif event.type is EventType.TRAFFIC_LIGHT_CHANGE:
            self._change_light(event)

    def _set_road_status(self, road_id: str | None, status: RoadStatus) -> None:
        if road_id is None or road_id not in self.network.edges:
            return
        road = self.network.edges[road_id]
        road.status = status
        if status is not RoadStatus.OPEN:
            self.manager.reroute_vehicles_avoiding(road_id)

    def _change_light(self, event: SimulationEvent) -> None:
        if self.lights is None:
            return
        light = None
        if event.node_id:
            light = self.lights.light_for_node(event.node_id)
        if light is None and event.payload.get("light_id"):
            light = self.lights.lights.get(event.payload["light_id"])
        if light is None:
            return
        if "green_duration" in event.payload:
            light.green_duration = float(event.payload["green_duration"])
        if "red_duration" in event.payload:
            light.red_duration = float(event.payload["red_duration"])

    def _process_traffic_spike(self) -> None:
        if self._spike_ticks_left > 0:
            self.manager.spawn_extra(self._spike_rate)
            self._spike_ticks_left -= 1

    def _refresh_network_state(self) -> None:
        counts = {road_id: 0 for road_id in self.network.edges}
        for vehicle in self.manager.vehicles.values():
            if vehicle.current_edge in counts:
                counts[vehicle.current_edge] += 1
        for road_id, road in self.network.edges.items():
            road.current_vehicle_count = counts[road_id]
        self.network.refresh_dynamic_state()
