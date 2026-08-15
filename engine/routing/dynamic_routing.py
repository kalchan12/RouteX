"""Dynamic / adaptive routing (planned for a later milestone)."""

from __future__ import annotations

from engine.network.graph import RoadNetwork
from engine.routing.interface import CostFunction, Route, RoutingAlgorithm


class DynamicRouting(RoutingAlgorithm):
    name = "dynamic"
    description = (
        "Dynamic routing — periodically re-evaluates routes against live "
        "congestion. Not yet implemented (Phase 12 of the roadmap)."
    )

    def find_route(
        self,
        network: RoadNetwork,
        origin: str,
        destination: str,
        cost: CostFunction | None = None,
    ) -> Route | None:
        raise NotImplementedError("Dynamic routing is scheduled for a later milestone")
