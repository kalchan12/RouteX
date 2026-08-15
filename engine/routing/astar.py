"""A* pathfinding — best-first search with an admissible Euclidean heuristic.

A* expands nodes in order of ``f(n) = g(n) + h(n)`` where ``g`` is the actual
cost so far and ``h`` is a heuristic lower bound on the remaining cost. For
travel-time cost functions the straight-line distance divided by the maximum
road speed is both admissible (never overestimates) and consistent (monotone),
so the first time the destination is popped the path is optimal — while
typically expanding fewer nodes than Dijkstra on large networks.
"""

from __future__ import annotations

import heapq
import math
import time

from engine.network.graph import RoadNetwork
from engine.routing.interface import CostFunction, Route, RoutingAlgorithm, default_cost


class AStar(RoutingAlgorithm):
    name = "astar"
    description = (
        "A* search — shortest path with an admissible straight-line heuristic "
        "(distance / max speed). Optimal for travel-time cost functions."
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

        max_speed = max(
            (road.speed_limit for road in network.edges.values()), default=1.0
        )
        if max_speed <= 0.0:
            max_speed = 1.0

        dest_x = network.node(destination).x
        dest_y = network.node(destination).y

        def heuristic(node_id: str) -> float:
            node = network.node(node_id)
            return math.hypot(node.x - dest_x, node.y - dest_y) / max_speed

        g_score: dict[str, float] = {origin: 0.0}
        prev: dict[str, tuple[str, str]] = {}
        # heap entries (f, g, node) — the node id breaks ties deterministically
        open_heap: list[tuple[float, float, str]] = [
            (heuristic(origin), 0.0, origin)
        ]
        closed: set[str] = set()

        while open_heap:
            f_score, g_current, node_id = heapq.heappop(open_heap)
            if node_id in closed:
                continue
            closed.add(node_id)
            if node_id == destination:
                break

            for neighbor_id, edge_id in network.neighbors(node_id):
                edge_cost = cost(network.edge(edge_id))
                if edge_cost == float("inf"):
                    continue
                tentative_g = g_current + edge_cost
                if tentative_g < g_score.get(neighbor_id, float("inf")):
                    g_score[neighbor_id] = tentative_g
                    prev[neighbor_id] = (node_id, edge_id)
                    heapq.heappush(
                        open_heap,
                        (tentative_g + heuristic(neighbor_id), tentative_g, neighbor_id),
                    )

        elapsed_ms = (time.perf_counter() - start) * 1000.0

        if destination not in g_score:
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
            total_cost=g_score[destination],
            computation_ms=elapsed_ms,
            algorithm=self.name,
        )
