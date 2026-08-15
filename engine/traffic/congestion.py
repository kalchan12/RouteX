"""Congestion calculation and level classification.

Documented assumption (transparent teaching model, not calibrated):
``congestion = vehicle_count / capacity``. A congestion value >= 1 means the
road is at or over capacity.
"""

from __future__ import annotations

from enum import StrEnum


class CongestionLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


def compute_congestion(vehicle_count: int, capacity: int) -> float:
    if capacity <= 0:
        return 1.0
    return vehicle_count / capacity


def congestion_level(congestion: float) -> CongestionLevel:
    if congestion >= 1.0:
        return CongestionLevel.CRITICAL
    if congestion >= 0.6:
        return CongestionLevel.HIGH
    if congestion >= 0.3:
        return CongestionLevel.MEDIUM
    return CongestionLevel.LOW
