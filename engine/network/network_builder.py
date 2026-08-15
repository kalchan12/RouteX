"""Deterministic mock city network generator.

The same ``NetworkConfig`` always produces the same road network, which is a
requirement for reproducible experiments.
"""

from __future__ import annotations

import random

from engine.config import NetworkConfig
from engine.network.edge import Road, RoadType
from engine.network.graph import RoadNetwork
from engine.network.node import Node, NodeType

KMH_TO_MS = 1.0 / 3.6


def build_network(config: NetworkConfig, rng: random.Random | None = None) -> RoadNetwork:
    """Build a rectangular grid city from ``config``.

    Nodes on the left column are origins, nodes on the right column are
    destinations, and the centre node is a hospital. All other nodes are
    intersections. Roads connect orthogonal neighbours.
    """
    net = RoadNetwork()
    rng = rng or random.Random(config.seed)

    cols, rows, block = config.cols, config.rows, config.block
    speed_lo, speed_hi = config.speed_kmh_range
    cap_lo, cap_hi = config.capacity_range

    centre_c = cols // 2
    centre_r = rows // 2

    for r in range(rows):
        for c in range(cols):
            nid = f"n{c}_{r}"
            if c == 0:
                ntype = NodeType.ORIGIN
            elif c == cols - 1:
                ntype = NodeType.DESTINATION
            elif c == centre_c and r == centre_r:
                ntype = NodeType.HOSPITAL
            else:
                ntype = NodeType.INTERSECTION
            net.add_node(Node(id=nid, x=float(c * block), y=float(r * block), type=ntype))

    for r in range(rows):
        for c in range(cols - 1):
            speed = rng.uniform(speed_lo, speed_hi) * KMH_TO_MS
            capacity = rng.randint(cap_lo, cap_hi)
            rtype = RoadType.AVENUE if r % 2 == 0 else RoadType.STREET
            net.add_road(
                Road(
                    id=f"h_{c}_{r}",
                    source=f"n{c}_{r}",
                    destination=f"n{c + 1}_{r}",
                    distance=block,
                    speed_limit=speed,
                    capacity=capacity,
                    lanes=2 if rtype is RoadType.AVENUE else 1,
                    road_type=rtype,
                )
            )

    for c in range(cols):
        for r in range(rows - 1):
            speed = rng.uniform(speed_lo, speed_hi) * KMH_TO_MS
            capacity = rng.randint(cap_lo, cap_hi)
            rtype = RoadType.AVENUE if c % 2 == 0 else RoadType.STREET
            net.add_road(
                Road(
                    id=f"v_{c}_{r}",
                    source=f"n{c}_{r}",
                    destination=f"n{c}_{r + 1}",
                    distance=block,
                    speed_limit=speed,
                    capacity=capacity,
                    lanes=2 if rtype is RoadType.AVENUE else 1,
                    road_type=rtype,
                )
            )

    return net
