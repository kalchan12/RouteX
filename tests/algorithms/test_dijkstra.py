"""Dijkstra routing tests: correctness, closed roads, dynamic weights."""

from __future__ import annotations

import pytest

from engine.network.edge import Road, RoadStatus
from engine.network.graph import RoadNetwork
from engine.network.node import Node
from engine.routing.dijkstra import Dijkstra


def make_network() -> RoadNetwork:
    net = RoadNetwork()
    coords = {
        "a": (0.0, 0.0),
        "b": (100.0, 0.0),
        "c": (200.0, 0.0),
        "d": (100.0, 100.0),
        "e": (0.0, 100.0),
    }
    for node_id, (x, y) in coords.items():
        net.add_node(Node(id=node_id, x=x, y=y))

    def road(rid: str, src: str, dst: str, distance: float, speed: float) -> None:
        net.add_road(
            Road(
                id=rid,
                source=src,
                destination=dst,
                distance=distance,
                speed_limit=speed,
                capacity=50,
            )
        )

    # a -> b -> c is short; a -> c direct is long
    road("ab", "a", "b", 100.0, 10.0)
    road("bc", "b", "c", 100.0, 10.0)
    road("ac", "a", "c", 1000.0, 10.0)
    # loop through d and e
    road("ad", "a", "d", 100.0, 10.0)
    road("dc", "d", "c", 100.0, 10.0)
    road("ec", "e", "c", 100.0, 10.0)
    road("be", "b", "e", 100.0, 10.0)
    return net


def test_dijkstra_finds_shortest_path() -> None:
    net = make_network()
    route = Dijkstra().find_route(net, "a", "c")
    assert route is not None
    assert route.nodes[0] == "a"
    assert route.nodes[-1] == "c"
    # a->b->c (200) beats a->c (1000)
    assert route.nodes == ["a", "b", "c"]
    assert route.total_cost == pytest.approx(20.0)
    assert route.is_valid(net)


def test_dijkstra_no_route() -> None:
    net = make_network()
    net.add_node(Node(id="z", x=50.0, y=50.0))
    assert Dijkstra().find_route(net, "a", "z") is None


def test_dijkstra_handles_closed_road() -> None:
    net = make_network()
    # close ab so a->c must go via ad/dc
    net.edges["ab"].status = RoadStatus.CLOSED
    route = Dijkstra().find_route(net, "a", "c")
    assert route is not None
    assert "ab" not in route.edges
    assert route.nodes == ["a", "d", "c"]


def test_dijkstra_all_paths_closed_returns_none() -> None:
    net = make_network()
    for road in net.edges.values():
        road.status = RoadStatus.CLOSED
    assert Dijkstra().find_route(net, "a", "c") is None


def test_dijkstra_respects_dynamic_weights() -> None:
    net = make_network()
    dijkstra = Dijkstra()
    # baseline: a->b->c
    assert dijkstra.find_route(net, "a", "c").nodes == ["a", "b", "c"]
    # heavy congestion on ab pushes traffic onto the d loop
    net.edges["ab"].congestion = 10.0
    net.edges["ab"].current_travel_time = 110.0
    route = dijkstra.find_route(net, "a", "c")
    assert route.nodes == ["a", "d", "c"]


def test_dijkstra_raises_on_unknown_nodes() -> None:
    net = make_network()
    with pytest.raises(KeyError):
        Dijkstra().find_route(net, "a", "zzz")


def test_dijkstra_cost_function_override() -> None:
    net = make_network()
    # distance-only cost: a->c (1000) still longer than a->b->c
    route = Dijkstra().find_route(net, "a", "c", cost=lambda road: road.distance)
    assert route.nodes == ["a", "b", "c"]
    assert route.total_cost == pytest.approx(200.0)
