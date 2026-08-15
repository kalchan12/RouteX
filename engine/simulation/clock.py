"""Discrete simulation clock.

Each tick advances the clock by ``tick_duration`` simulated seconds. The
clock is deterministic: the same number of ticks always produces the same
time, which is required for reproducible experiments.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class SimulationClock:
    tick: int = 0
    tick_duration: float = 1.0

    @property
    def time(self) -> float:
        return self.tick * self.tick_duration

    def step(self) -> int:
        self.tick += 1
        return self.tick

    def reset(self) -> None:
        self.tick = 0
