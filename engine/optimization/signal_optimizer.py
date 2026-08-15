"""Traffic-signal optimization strategy (planned for a later milestone)."""

from __future__ import annotations

from typing import Any

from engine.optimization.interface import OptimizationResult, Optimizer


class SignalOptimizer(Optimizer):
    name = "signal_optimizer"
    description = "Optimizes traffic-light timing. Not yet implemented."

    def optimize(self, context: Any) -> OptimizationResult:
        raise NotImplementedError("Signal optimization is scheduled for a later milestone")
