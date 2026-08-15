"""Typed configuration models for RouteX scenarios and simulations.

These are plain dataclasses with no third-party dependencies so the engine
stays usable anywhere Python runs. Validation is explicit and raises
``ValueError`` on invalid input. The JSON scenario files under ``scenarios/``
are loaded into these models by the ``scenarios`` package.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


def _pick(data: dict[str, Any], cls: type, **defaults: Any) -> dict[str, Any]:
    known = set(cls.__dataclass_fields__)
    merged = {**defaults}
    merged.update({k: v for k, v in data.items() if k in known})
    return merged


@dataclass
class NetworkConfig:
    """Configuration describing how the mock road network is generated."""

    type: str = "grid"
    cols: int = 8
    rows: int = 6
    block: float = 500.0
    seed: int = 42
    speed_kmh_range: tuple[float, float] = (30.0, 60.0)
    capacity_range: tuple[int, int] = (20, 60)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> NetworkConfig:
        return cls(**_pick(data, cls))

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": self.type,
            "cols": self.cols,
            "rows": self.rows,
            "block": self.block,
            "seed": self.seed,
            "speed_kmh_range": list(self.speed_kmh_range),
            "capacity_range": list(self.capacity_range),
        }


@dataclass
class TrafficLightConfig:
    """Configuration for fixed-cycle traffic lights."""

    green_duration: float = 15.0
    red_duration: float = 15.0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> TrafficLightConfig:
        return cls(**_pick(data, cls))

    def to_dict(self) -> dict[str, Any]:
        return {
            "green_duration": self.green_duration,
            "red_duration": self.red_duration,
        }


@dataclass
class ScenarioConfig:
    """A full simulation scenario (network + vehicles + events + seed)."""

    id: str
    name: str
    description: str = ""
    network: NetworkConfig = field(default_factory=NetworkConfig)
    vehicle_count: int = 100
    spawn_rate: float = 2.0
    duration: int = 600
    seed: int = 42
    vehicle_types: dict[str, float] = field(
        default_factory=lambda: {"normal": 0.85, "bus": 0.05, "truck": 0.10}
    )
    traffic_lights: TrafficLightConfig | None = None
    events: list[dict[str, Any]] = field(default_factory=list)
    congestion_model: str = "linear"

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ScenarioConfig:
        data = dict(data)
        if not data.get("id") or not data.get("name"):
            raise ValueError("scenario requires non-empty 'id' and 'name'")
        network = NetworkConfig.from_dict(data.get("network", {}))
        lights_raw = data.get("traffic_lights")
        lights = (
            TrafficLightConfig.from_dict(lights_raw) if lights_raw else None
        )
        data["network"] = network
        data["traffic_lights"] = lights
        return cls(**_pick(data, cls))

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "network": self.network.to_dict(),
            "vehicle_count": self.vehicle_count,
            "spawn_rate": self.spawn_rate,
            "duration": self.duration,
            "seed": self.seed,
            "vehicle_types": dict(self.vehicle_types),
            "traffic_lights": (
                self.traffic_lights.to_dict() if self.traffic_lights else None
            ),
            "events": list(self.events),
            "congestion_model": self.congestion_model,
        }
