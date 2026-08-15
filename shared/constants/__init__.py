"""Shared constants used across RouteX packages.

These values are the single source of truth for cross-package configuration
shared by the engine, API and (eventually) frontend schemas.
"""

from __future__ import annotations

# Speed unit conversion (km/h -> m/s)
KMH_TO_MS = 1.0 / 3.6

# Vehicle-following stop distance (meters ahead to decelerate)
STOP_DISTANCE_M = 25.0

# Default simulation parameters
DEFAULT_TICK_DURATION_S = 1.0
DEFAULT_SEED = 42
DEFAULT_SPEED = 1.0

# Congestion model bounds
MAX_CONGESTION = 1.0

# Registered algorithm ids (see engine.routing.registry)
ROUTING_ALGORITHMS = ("dijkstra", "astar")
