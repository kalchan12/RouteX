"""Road network nodes (intersections, origins, destinations, special sites)."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class NodeType(StrEnum):
    INTERSECTION = "intersection"
    ORIGIN = "origin"
    DESTINATION = "destination"
    HOSPITAL = "hospital"


@dataclass(frozen=True)
class Node:
    """A vertex of the road network.

    ``x`` / ``y`` are coordinates in simulated metres used for visualization.
    Nodes are immutable; dynamic state lives on roads and vehicles.
    """

    id: str
    x: float
    y: float
    type: NodeType = NodeType.INTERSECTION
    traffic_light_id: str | None = None

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "x": self.x,
            "y": self.y,
            "type": self.type.value,
            "traffic_light_id": self.traffic_light_id,
        }
