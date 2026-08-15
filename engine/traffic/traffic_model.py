"""Simplified, transparent traffic model.

Mathematical assumption (documented — intentionally a teaching model, NOT a
calibrated real-world traffic model):

* Congestion is ``vehicles / capacity``.
* The congestion factor is ``1 + congestion`` (linear).
* Dynamic travel time = ``base_travel_time * (1 + congestion)``.
* Effective speed = ``base_speed / (1 + congestion)``.

The model is deliberately a single function so it can be replaced by a more
sophisticated traffic model later without changing the rest of the engine.
"""

from __future__ import annotations


def congestion_factor(congestion: float) -> float:
    return 1.0 + max(0.0, congestion)


def effective_speed_ms(base_speed_ms: float, congestion: float) -> float:
    return base_speed_ms / congestion_factor(congestion)
