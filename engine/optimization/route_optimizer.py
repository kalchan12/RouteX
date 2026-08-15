"""Route optimization strategy (planned for a later milestone)."""

from __future__ import annotations

from typing import Any

from engine.optimization.interface import OptimizationResult, Optimizer


class RouteOptimizer(Optimizer):
    name = "route_optimizer"
    description = "Optimizes route distribution to balance road load. Not yet implemented."

    def optimize(self, context: Any) -> OptimizationResult:
        raise NotImplementedError("Route optimization is scheduled for a later milestone")
