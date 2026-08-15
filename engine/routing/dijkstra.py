"""Dijkstra's shortest path algorithm (binary-heap implementation)."""

from __future__ import annotations

import heapq
import time

from engine.network.graph import RoadNetwork
from engine.routing.interface import CostFunction, Route, RoutingAlgorithm, default_cost


class Dijkstra(RoutingAlgorithm):
    name = "dijkstra"
    description = (
        "Dijkstra's algorithm — classic non-heuristic shortest path using "
        "current dynamic travel times as edge costs."
    )

    def find_route(
        self,
        network: RoadNetwork,
        origin: str,
        destination: str,
        cost: CostFunction | None = None,
    ) -> Route | None:
        if origin not in network.nodes or destination not in network.nodes:
            raise KeyError(f"unknown node in route request: {origin!r} -> {destination!r}")

        cost = cost or default_cost
        start = time.perf_counter()

        dist: dict[str, float] = {origin: 0.0}
        prev: dict[str, tuple[str, str]] = {}
        heap: list[tuple[float, str]] = [(0.0, origin)]
        visited: set[str] = set()

        while heap:
            current_dist, node_id = heapq.heappop(heap)
            if node_id in visited:
                continue
            visited.add(node_id)
            if node_id == destination:
                break

            for neighbor_id, edge_id in network.neighbors(node_id):
                edge_cost = cost(network.edge(edge_id))
                if edge_cost == float("inf"):
                    continue
                candidate = current_dist + edge_cost
                if candidate < dist.get(neighbor_id, float("inf")):
                    dist[neighbor_id] = candidate
                    prev[neighbor_id] = (node_id, edge_id)
                    heapq.heappush(heap, (candidate, neighbor_id))

        elapsed_ms = (time.perf_counter() - start) * 1000.0

        if destination not in dist:
            return None

        nodes: list[str] = [destination]
        edges: list[str] = []
        current = destination
        while current != origin:
            parent, edge_id = prev[current]
            edges.append(edge_id)
            nodes.append(parent)
            current = parent
        nodes.reverse()
        edges.reverse()

        return Route(
            nodes=nodes,
            edges=edges,
            total_cost=dist[destination],
            computation_ms=elapsed_ms,
            algorithm=self.name,
        )
