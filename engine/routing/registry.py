"""Registry of implemented routing algorithms.

Only fully implemented algorithms are registered; dynamic routing is not yet
available and therefore intentionally absent here.
"""

from __future__ import annotations

from engine.routing.astar import AStar
from engine.routing.dijkstra import Dijkstra
from engine.routing.interface import RoutingAlgorithm

_REGISTRY: dict[str, RoutingAlgorithm] = {
    Dijkstra.name: Dijkstra(),
    AStar.name: AStar(),
}


def get_algorithm(name: str) -> RoutingAlgorithm:
    try:
        return _REGISTRY[name]
    except KeyError:
        raise ValueError(f"unknown routing algorithm: {name!r}") from None


def list_algorithms() -> list[dict[str, str]]:
    return [
        {"id": name, "name": algo.name, "description": algo.description}
        for name, algo in _REGISTRY.items()
    ]
