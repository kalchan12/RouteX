"""A* routing tests: correctness, optimality vs Dijkstra, closed roads."""

from __future__ import annotations

import pytest

from engine.network.edge import Road, RoadStatus
from engine.network.graph import RoadNetwork
from engine.network.node import Node
from engine.routing.astar import AStar
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

    road("ab", "a", "b", 100.0, 10.0)
    road("bc", "b", "c", 100.0, 10.0)
    road("ac", "a", "c", 1000.0, 10.0)
    road("ad", "a", "d", 100.0, 10.0)
    road("dc", "d", "c", 100.0, 10.0)
    road("ec", "e", "c", 100.0, 10.0)
    road("be", "b", "e", 100.0, 10.0)
    return net


def test_astar_finds_shortest_path() -> None:
    net = make_network()
    route = AStar().find_route(net, "a", "c")
    assert route is not None
    assert route.nodes[0] == "a"
    assert route.nodes[-1] == "c"
    assert route.nodes == ["a", "b", "c"]
    assert route.total_cost == pytest.approx(20.0)
    assert route.is_valid(net)
    assert route.algorithm == "astar"


def test_astar_matches_dijkstra() -> None:
    net = make_network()
    astar = AStar().find_route(net, "a", "c")
    dijkstra = Dijkstra().find_route(net, "a", "c")
    assert astar is not None and dijkstra is not None
    assert astar.nodes == dijkstra.nodes
    assert astar.total_cost == pytest.approx(dijkstra.total_cost)


def test_astar_no_route() -> None:
    net = make_network()
    net.add_node(Node(id="z", x=50.0, y=50.0))
    assert AStar().find_route(net, "a", "z") is None


def test_astar_handles_closed_road() -> None:
    net = make_network()
    net.edges["ab"].status = RoadStatus.CLOSED
    route = AStar().find_route(net, "a", "c")
    assert route is not None
    assert "ab" not in route.edges
    assert route.nodes == ["a", "d", "c"]


def test_astar_all_paths_closed_returns_none() -> None:
    net = make_network()
    for road in net.edges.values():
        road.status = RoadStatus.CLOSED
    assert AStar().find_route(net, "a", "c") is None


def test_astar_respects_dynamic_weights() -> None:
    net = make_network()
    astar = AStar()
    assert astar.find_route(net, "a", "c").nodes == ["a", "b", "c"]
    net.edges["ab"].congestion = 10.0
    net.edges["ab"].current_travel_time = 110.0
    route = astar.find_route(net, "a", "c")
    assert route.nodes == ["a", "d", "c"]


def test_astar_raises_on_unknown_nodes() -> None:
    net = make_network()
    with pytest.raises(KeyError):
        AStar().find_route(net, "a", "zzz")


def test_astar_cost_function_override() -> None:
    net = make_network()
    route = AStar().find_route(net, "a", "c", cost=lambda road: road.distance)
    assert route.nodes == ["a", "b", "c"]
    assert route.total_cost == pytest.approx(200.0)


def test_astar_is_deterministic() -> None:
    net = make_network()
    first = AStar().find_route(net, "a", "c")
    second = AStar().find_route(net, "a", "c")
    assert first is not None and second is not None
    assert first.nodes == second.nodes
    assert first.edges == second.edges


def test_astar_prefers_straight_ahead_when_cheaper() -> None:
    net = make_network()
    # make the direct a->c edge fast enough to beat the detour
    direct = net.edges["ac"]
    direct.distance = 150.0
    direct.base_travel_time = 15.0
    direct.current_travel_time = 15.0
    route = AStar().find_route(net, "a", "c")
    assert route is not None
    assert route.nodes == ["a", "c"]
    assert route.total_cost == pytest.approx(15.0)
