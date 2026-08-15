"""Vehicle model used throughout the simulation."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum


class VehicleType(StrEnum):
    NORMAL = "normal"
    BUS = "bus"
    TRUCK = "truck"
    EMERGENCY = "emergency"


class VehicleStatus(StrEnum):
    WAITING = "waiting"
    ACTIVE = "active"
    COMPLETED = "completed"


@dataclass
class Vehicle:
    """A simulated vehicle travelling along a computed route.

    ``route`` is a list of node ids (origin first, destination last).
    ``route_index`` points at the *next* node the vehicle will travel to.
    ``position`` is distance in metres along ``current_edge``.
    """

    id: str
    origin: str
    destination: str
    vehicle_type: VehicleType
    max_speed: float
    current_node: str
    current_edge: str | None = None
    position: float = 0.0
    speed: float = 0.0
    route: list[str] = field(default_factory=list)
    route_edges: list[str] = field(default_factory=list)
    route_index: int = 1
    status: VehicleStatus = VehicleStatus.WAITING
    distance_traveled: float = 0.0
    travel_time: float = 0.0
    waiting_time: float = 0.0
    spawned_at: int = 0
    completed_at: int | None = None

    @property
    def next_node(self) -> str | None:
        if self.route_index < len(self.route):
            return self.route[self.route_index]
        return None

    @property
    def is_emergency(self) -> bool:
        return self.vehicle_type is VehicleType.EMERGENCY

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "origin": self.origin,
            "destination": self.destination,
            "type": self.vehicle_type.value,
            "max_speed": self.max_speed,
            "current_node": self.current_node,
            "current_edge": self.current_edge,
            "position": round(self.position, 2),
            "speed": round(self.speed, 2),
            "route": self.route,
            "route_index": self.route_index,
            "status": self.status.value,
            "distance_traveled": round(self.distance_traveled, 2),
            "travel_time": round(self.travel_time, 2),
            "waiting_time": round(self.waiting_time, 2),
            "spawned_at": self.spawned_at,
            "completed_at": self.completed_at,
        }
