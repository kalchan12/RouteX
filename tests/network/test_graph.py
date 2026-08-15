"""Road network graph tests."""

from __future__ import annotations

import pytest

from engine.network.edge import Road, RoadStatus
from engine.network.graph import RoadNetwork
from engine.network.node import Node, NodeType


def make_network() -> RoadNetwork:
    net = RoadNetwork()
    net.add_node(Node(id="a", x=0, y=0, type=NodeType.ORIGIN))
    net.add_node(Node(id="b", x=10, y=0))
    net.add_node(Node(id="c", x=20, y=0, type=NodeType.DESTINATION))
    net.add_road(
        Road(id="ab", source="a", destination="b", distance=10, speed_limit=10, capacity=10)
    )
    net.add_road(
        Road(id="bc", source="b", destination="c", distance=10, speed_limit=10, capacity=10)
    )
    return net


def test_add_duplicate_node_raises() -> None:
    net = make_network()
    with pytest.raises(ValueError):
        net.add_node(Node(id="a", x=0, y=0))


def test_add_road_with_missing_node_raises() -> None:
    net = make_network()
    with pytest.raises(ValueError):
        net.add_road(
            Road(id="zz", source="a", destination="q", distance=1, speed_limit=1, capacity=1)
        )


def test_neighbors_skip_closed_roads() -> None:
    net = make_network()
    net.edges["ab"].status = RoadStatus.CLOSED
    neighbors = list(net.neighbors("a"))
    assert neighbors == []


def test_edge_between() -> None:
    net = make_network()
    road = net.edge_between("a", "b")
    assert road is not None and road.id == "ab"
    assert net.edge_between("b", "a") is None


def test_dynamic_state_refresh() -> None:
    net = make_network()
    road = net.edges["ab"]
    road.current_vehicle_count = 5
    net.refresh_dynamic_state()
    assert road.congestion == 0.5
    # base_travel_time = 10 / 10 = 1.0s; congestion factor 1.5
    assert road.current_travel_time == 1.5
