"""Serializable simulation snapshots published over WebSocket.

Snapshots contain everything the frontend needs to render one simulation
tick. They are cheap to build and are never persisted to PostgreSQL.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class SimulationState:
    tick: int
    time: float
    status: str
    algorithm: str
    nodes: list[dict[str, Any]]
    roads: list[dict[str, Any]]
    vehicles: list[dict[str, Any]]
    lights: list[dict[str, Any]]
    metrics: dict[str, Any]
    summary: dict[str, Any]
    events: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "tick": self.tick,
            "time": self.time,
            "status": self.status,
            "algorithm": self.algorithm,
            "nodes": self.nodes,
            "roads": self.roads,
            "vehicles": self.vehicles,
            "lights": self.lights,
            "metrics": self.metrics,
            "summary": self.summary,
            "events": self.events,
        }


def _vehicle_geometry(vehicle: Any, network: Any) -> tuple[float, float]:
    """Interpolate a vehicle's map position from its current edge or node."""
    if vehicle.current_edge and vehicle.current_edge in network.edges:
        road = network.edges[vehicle.current_edge]
        source = network.node(road.source)
        destination = network.node(road.destination)
        t = 0.0 if road.distance <= 0 else vehicle.position / road.distance
        t = max(0.0, min(1.0, t))
        return (
            source.x + (destination.x - source.x) * t,
            source.y + (destination.y - source.y) * t,
        )
    node = network.node(vehicle.current_node)
    return node.x, node.y


def build_snapshot(engine: Any) -> SimulationState:
    """Build a full snapshot of the current engine state.

    ``engine`` is duck-typed to avoid a circular import.
    """
    network = engine.network

    vehicles: list[dict[str, Any]] = []
    for vehicle in engine.manager.vehicles.values():
        data = vehicle.to_dict()
        x, y = _vehicle_geometry(vehicle, network)
        data["x"] = round(x, 2)
        data["y"] = round(y, 2)
        vehicles.append(data)

    lights = engine.lights.to_dicts() if engine.lights is not None else []

    return SimulationState(
        tick=engine.clock.tick,
        time=engine.clock.time,
        status=engine.status.value,
        algorithm=engine.config.algorithm,
        nodes=[node.to_dict() for node in network.nodes.values()],
        roads=[road.to_dict() for road in network.edges.values()],
        vehicles=vehicles,
        lights=lights,
        metrics=engine.metrics.summary(engine.manager),
        summary=network.road_summary(),
        events=list(engine.tick_events),
    )
