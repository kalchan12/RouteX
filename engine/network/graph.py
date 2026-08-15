"""The road network graph: nodes + directed edges + adjacency indexes."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

from engine.network.edge import Road
from engine.network.node import Node, NodeType
from engine.traffic.traffic_model import congestion_factor


@dataclass
class RoadNetwork:
    """Holds every node and road plus fast lookup indexes.

    ``adjacency[node_id]`` -> outgoing edge ids
    ``incoming[node_id]``  -> incoming edge ids
    """

    nodes: dict[str, Node] = field(default_factory=dict)
    edges: dict[str, Road] = field(default_factory=dict)
    adjacency: dict[str, list[str]] = field(default_factory=dict)
    incoming: dict[str, list[str]] = field(default_factory=dict)

    # ------------------------------------------------------------------ #
    # Builders
    # ------------------------------------------------------------------ #
    def add_node(self, node: Node) -> None:
        if node.id in self.nodes:
            raise ValueError(f"node {node.id} already exists")
        self.nodes[node.id] = node
        self.adjacency.setdefault(node.id, [])
        self.incoming.setdefault(node.id, [])

    def add_road(self, road: Road) -> None:
        if road.id in self.edges:
            raise ValueError(f"road {road.id} already exists")
        if road.source not in self.nodes or road.destination not in self.nodes:
            raise ValueError(
                f"road {road.id}: source/destination nodes must exist"
            )
        self.edges[road.id] = road
        self.adjacency[road.source].append(road.id)
        self.incoming[road.destination].append(road.id)

    # ------------------------------------------------------------------ #
    # Lookups
    # ------------------------------------------------------------------ #
    def node(self, node_id: str) -> Node:
        return self.nodes[node_id]

    def edge(self, edge_id: str) -> Road:
        return self.edges[edge_id]

    def node_count(self) -> int:
        return len(self.nodes)

    def edge_count(self) -> int:
        return len(self.edges)

    def outgoing_edges(self, node_id: str) -> list[str]:
        return self.adjacency.get(node_id, [])

    def incoming_edges(self, node_id: str) -> list[str]:
        return self.incoming.get(node_id, [])

    def neighbors(self, node_id: str) -> Iterable[tuple[str, str]]:
        """Yield ``(neighbor_id, edge_id)`` pairs for traversable roads."""
        for edge_id in self.adjacency.get(node_id, []):
            road = self.edges[edge_id]
            if road.is_traversable:
                yield road.destination, edge_id

    def edge_between(self, source: str, destination: str) -> Road | None:
        for edge_id in self.adjacency.get(source, []):
            if self.edges[edge_id].destination == destination:
                return self.edges[edge_id]
        return None

    def nodes_of_type(self, node_type: NodeType) -> list[Node]:
        return [n for n in self.nodes.values() if n.type is node_type]

    def road_summary(self) -> dict[str, object]:
        return {
            "nodes": self.node_count(),
            "edges": self.edge_count(),
            "closed": sum(
                1 for r in self.edges.values() if not r.is_traversable
            ),
        }

    def refresh_dynamic_state(self) -> None:
        """Recompute occupancy, congestion and dynamic travel times.

        Occupancy is derived from vehicles currently on each road; a single
        vehicle may occupy a road even while it is "between" it during a tick,
        so this is applied once per tick by the engine.
        """
        for road in self.edges.values():
            road.congestion = self._congestion(road)
            road.current_travel_time = road.base_travel_time * congestion_factor(
                road.congestion
            )

    @staticmethod
    def _congestion(road: Road) -> float:
        if road.capacity <= 0:
            return 1.0
        return road.current_vehicle_count / road.capacity
