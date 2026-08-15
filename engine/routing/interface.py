"""Routing algorithm contracts and the route result type.

Routing algorithms operate only on the road network (never on the frontend).
A cost function maps a road to a routing cost; returning ``inf`` makes a road
unusable (e.g. closed, accident, construction).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

from engine.network.edge import Road
from engine.network.graph import RoadNetwork

CostFunction = Callable[[Road], float]


def default_cost(road: Road) -> float:
    """Default routing cost: current dynamic travel time (seconds)."""
    if not road.is_traversable:
        return float("inf")
    return road.current_travel_time


@dataclass
class Route:
    """A computed path through the network."""

    nodes: list[str]
    edges: list[str]
    total_cost: float
    computation_ms: float
    algorithm: str

    def is_valid(self, network: RoadNetwork) -> bool:
        if len(self.nodes) < 2:
            return False
        for edge_id in self.edges:
            if edge_id not in network.edges:
                return False
        return True

    def to_dict(self) -> dict[str, object]:
        return {
            "nodes": self.nodes,
            "edges": self.edges,
            "total_cost": round(self.total_cost, 4),
            "computation_ms": round(self.computation_ms, 4),
            "algorithm": self.algorithm,
        }


class RoutingAlgorithm(Protocol):
    """Implementations must be stateless and deterministic."""

    name: str
    description: str

    def find_route(
        self,
        network: RoadNetwork,
        origin: str,
        destination: str,
        cost: CostFunction | None = None,
    ) -> Route | None:
        """Return a route or ``None`` when no route exists."""
        ...
