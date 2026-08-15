"""Optimization engine contracts.

Only the interfaces are defined during the Foundation milestone. Concrete
strategies (signal timing, route distribution, genetic / simulated annealing /
RL) will be added in later milestones behind these contracts.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass
class OptimizationResult:
    name: str
    objective_value: float
    details: dict[str, Any]


class Optimizer(Protocol):
    """Any strategy that improves some simulation objective."""

    name: str
    description: str

    def optimize(self, context: Any) -> OptimizationResult:
        """Return the optimized configuration and its objective value."""
        ...
