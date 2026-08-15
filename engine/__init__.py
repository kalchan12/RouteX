"""RouteX — graph-based traffic simulation and route optimization engine.

The engine is intentionally dependency-free and framework-agnostic. It owns
the road network, the simulation clock, vehicle movement, congestion, routing
algorithms and metrics. The FastAPI backend drives the engine and publishes
state to the frontend over WebSockets; the engine itself knows nothing about
the UI.
"""

from engine.config import NetworkConfig, ScenarioConfig, TrafficLightConfig
from engine.network.graph import RoadNetwork
from engine.routing.registry import get_algorithm, list_algorithms
from engine.simulation.engine import (
    SimulationConfig,
    SimulationEngine,
    SimulationStatus,
)

__version__ = "0.1.0"

__all__ = [
    "NetworkConfig",
    "ScenarioConfig",
    "TrafficLightConfig",
    "SimulationConfig",
    "SimulationEngine",
    "SimulationStatus",
    "RoadNetwork",
    "get_algorithm",
    "list_algorithms",
]
