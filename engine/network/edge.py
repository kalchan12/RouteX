"""Road network edges (road segments) with dynamic traffic state."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class RoadType(StrEnum):
    STREET = "street"
    AVENUE = "avenue"
    HIGHWAY = "highway"


class RoadStatus(StrEnum):
    OPEN = "open"
    CLOSED = "closed"
    ACCIDENT = "accident"
    CONSTRUCTION = "construction"


@dataclass
class Road:
    """A directed road segment between two nodes.

    Units: ``distance`` is in metres, ``speed_limit`` in metres/second
    (scenario files express limits in km/h; the builder converts them).

    Dynamic state (``current_vehicle_count``, ``congestion``,
    ``current_travel_time``) is recomputed each simulation tick.
    """

    id: str
    source: str
    destination: str
    distance: float
    speed_limit: float
    capacity: int
    lanes: int = 1
    road_type: RoadType = RoadType.STREET
    status: RoadStatus = RoadStatus.OPEN
    priority: float = 0.0
    current_vehicle_count: int = 0
    congestion: float = 0.0
    base_travel_time: float = 0.0
    current_travel_time: float = 0.0

    def __post_init__(self) -> None:
        if self.distance <= 0:
            raise ValueError(f"road {self.id}: distance must be positive")
        if self.speed_limit <= 0:
            raise ValueError(f"road {self.id}: speed_limit must be positive")
        if self.capacity <= 0:
            raise ValueError(f"road {self.id}: capacity must be positive")
        self.base_travel_time = self.distance / self.speed_limit
        self.current_travel_time = self.base_travel_time

    @property
    def is_traversable(self) -> bool:
        return self.status is RoadStatus.OPEN

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "source": self.source,
            "destination": self.destination,
            "distance": self.distance,
            "speed_limit": self.speed_limit,
            "capacity": self.capacity,
            "lanes": self.lanes,
            "road_type": self.road_type.value,
            "status": self.status.value,
            "current_vehicle_count": self.current_vehicle_count,
            "congestion": self.congestion,
            "base_travel_time": self.base_travel_time,
            "current_travel_time": self.current_travel_time,
        }
