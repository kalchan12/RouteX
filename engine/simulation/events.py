"""Simulation event system.

Events are scheduled against a simulation tick and applied by the engine.
With a fixed random seed the same scenario always schedules and fires the same
events, keeping experiments reproducible.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class EventType(StrEnum):
    VEHICLE_SPAWN = "vehicle_spawn"
    ACCIDENT = "accident"
    ROAD_CLOSURE = "road_closure"
    ROAD_REOPENING = "road_reopening"
    TRAFFIC_SPIKE = "traffic_spike"
    EMERGENCY_VEHICLE = "emergency_vehicle"
    TRAFFIC_LIGHT_CHANGE = "traffic_light_change"


@dataclass
class SimulationEvent:
    type: EventType
    timestamp: int
    duration: int = 0
    road_id: str | None = None
    node_id: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)
    applied: bool = False

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SimulationEvent:
        etype = data.get("type")
        if etype is None:
            raise ValueError("event requires a 'type'")
        if "timestamp" not in data:
            raise ValueError("event requires a 'timestamp'")
        timestamp = int(data["timestamp"])
        if timestamp < 0:
            raise ValueError("event timestamp must be >= 0")
        return cls(
            type=EventType(etype),
            timestamp=timestamp,
            duration=int(data.get("duration", 0)),
            road_id=data.get("road_id"),
            node_id=data.get("node_id"),
            payload=dict(data.get("payload", {})),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": self.type.value,
            "timestamp": self.timestamp,
            "duration": self.duration,
            "road_id": self.road_id,
            "node_id": self.node_id,
            "payload": self.payload,
        }


class EventQueue:
    """Time-ordered collection of pending events."""

    def __init__(self) -> None:
        self._events: list[SimulationEvent] = []

    def schedule(self, event: SimulationEvent) -> None:
        self._events.append(event)
        self._events.sort(key=lambda e: e.timestamp)

    def pending(self, tick: int) -> list[SimulationEvent]:
        return [e for e in self._events if not e.applied and e.timestamp <= tick]

    def mark_applied(self, event: SimulationEvent) -> None:
        event.applied = True

    def clear(self) -> None:
        self._events.clear()
