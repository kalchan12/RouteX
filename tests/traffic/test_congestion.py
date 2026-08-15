"""Congestion and traffic model tests."""

from __future__ import annotations

from engine.traffic.congestion import CongestionLevel, compute_congestion, congestion_level
from engine.traffic.traffic_model import congestion_factor, effective_speed_ms


def test_compute_congestion() -> None:
    assert compute_congestion(5, 10) == 0.5
    assert compute_congestion(0, 10) == 0.0


def test_compute_congestion_zero_capacity() -> None:
    assert compute_congestion(3, 0) == 1.0


def test_congestion_levels() -> None:
    assert congestion_level(0.1) is CongestionLevel.LOW
    assert congestion_level(0.4) is CongestionLevel.MEDIUM
    assert congestion_level(0.7) is CongestionLevel.HIGH
    assert congestion_level(1.2) is CongestionLevel.CRITICAL


def test_congestion_factor() -> None:
    assert congestion_factor(0.0) == 1.0
    assert congestion_factor(1.0) == 2.0
    assert congestion_factor(-1.0) == 1.0


def test_effective_speed() -> None:
    assert effective_speed_ms(10.0, 1.0) == 5.0
    assert effective_speed_ms(10.0, 0.0) == 10.0
