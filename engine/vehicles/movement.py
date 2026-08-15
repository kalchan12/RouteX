"""Pure vehicle-movement helpers.

Mathematical assumptions (documented, intentionally simple — NOT a
real-world calibrated traffic model):

* A vehicle travels at ``min(road speed limit, vehicle max speed)`` m/s.
* Congestion slows traffic by a linear factor ``(1 + congestion)``:
  ``effective_speed = base_speed / (1 + congestion)``.
* Emergency vehicles ignore congestion and red lights (priority routing).
* A vehicle decelerates linearly over the final ``STOP_DISTANCE_M`` metres
  before a blocked intersection instead of stopping instantly.
"""

from __future__ import annotations

from engine.network.edge import Road
from engine.vehicles.vehicle import Vehicle

STOP_DISTANCE_M = 25.0


def target_speed_ms(road: Road, vehicle: Vehicle, ignore_congestion: bool = False) -> float:
    """Speed (m/s) a vehicle would reach on ``road`` absent a stop signal."""
    speed = min(road.speed_limit, vehicle.max_speed)
    if ignore_congestion:
        return speed
    factor = 1.0 + max(0.0, road.congestion)
    return speed / factor


def advance_position(
    position: float,
    speed_ms: float,
    dt: float,
    edge_distance: float,
    blocked_ahead: bool,
    distance_remaining: float,
) -> tuple[float, float, bool]:
    """Move ``position`` by ``speed_ms * dt``, decelerating near a blockage.

    Returns ``(new_position, actual_speed_used, arrived)`` where ``arrived``
    is True when the vehicle reaches the end of the edge.
    """
    if blocked_ahead and distance_remaining <= STOP_DISTANCE_M:
        speed = speed_ms * (distance_remaining / STOP_DISTANCE_M)
    else:
        speed = speed_ms

    new_position = position + speed * dt
    if new_position >= edge_distance:
        return edge_distance, speed, True
    return new_position, speed, False
