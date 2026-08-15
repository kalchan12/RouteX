"""Fixed-cycle traffic light controller.

Simplified model (documented): each light alternates between two phases of
equal duration. Incoming edges at a node are sorted; in phase 0 the even group
is green and in phase 1 the odd group is green. This provides deterministic,
alternating intersection control. Emergency vehicles ignore lights (handled by
the caller). This is NOT a calibrated signal-timing model.
"""

from __future__ import annotations

from dataclasses import dataclass

from engine.config import TrafficLightConfig
from engine.network.graph import RoadNetwork


@dataclass
class TrafficLight:
    id: str
    node_id: str
    green_duration: float = 15.0
    red_duration: float = 15.0
    offset: float = 0.0

    def phase(self, time: float) -> int:
        period = self.green_duration + self.red_duration
        if period <= 0:
            return 0
        return int((time + self.offset) // period) % 2

    def is_green(self, edge_id: str, group: int, time: float) -> bool:
        return (group % 2) == self.phase(time)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "node_id": self.node_id,
            "green_duration": self.green_duration,
            "red_duration": self.red_duration,
            "phase": self.phase(0.0),
        }


class TrafficLightController:
    """Resolves whether an incoming edge is green at a given node/time."""

    def __init__(
        self, lights: list[TrafficLight], network: RoadNetwork
    ) -> None:
        self._network = network
        self.lights: dict[str, TrafficLight] = {}
        self._by_node: dict[str, TrafficLight] = {}
        for light in lights:
            self.lights[light.id] = light
            self._by_node[light.node_id] = light

    def light_for_node(self, node_id: str) -> TrafficLight | None:
        return self._by_node.get(node_id)

    def is_green(self, node_id: str, edge_id: str, time: float) -> bool:
        light = self._by_node.get(node_id)
        if light is None:
            return True
        incoming = sorted(self._network.incoming_edges(node_id))
        group = incoming.index(edge_id) if edge_id in incoming else 0
        return light.is_green(edge_id, group, time)

    def to_dicts(self) -> list[dict[str, object]]:
        return [light.to_dict() for light in self.lights.values()]


def build_lights(
    network: RoadNetwork, config: TrafficLightConfig | None
) -> TrafficLightController | None:
    """Attach fixed-cycle lights to nodes with 2+ incoming roads."""
    if config is None:
        return None
    lights: list[TrafficLight] = []
    for node in network.nodes.values():
        if len(network.incoming_edges(node.id)) >= 2:
            lights.append(
                TrafficLight(
                    id=f"tl_{node.id}",
                    node_id=node.id,
                    green_duration=config.green_duration,
                    red_duration=config.red_duration,
                )
            )
    if not lights:
        return None
    return TrafficLightController(lights, network)
