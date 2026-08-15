"""Simulation clock tests."""

from __future__ import annotations

from engine.simulation.clock import SimulationClock


def test_clock_steps() -> None:
    clock = SimulationClock()
    assert clock.tick == 0
    assert clock.time == 0.0
    clock.step()
    clock.step()
    assert clock.tick == 2
    assert clock.time == 2.0


def test_clock_tick_duration() -> None:
    clock = SimulationClock(tick_duration=2.5)
    clock.step()
    assert clock.time == 2.5


def test_clock_reset() -> None:
    clock = SimulationClock()
    clock.step()
    clock.reset()
    assert clock.tick == 0
