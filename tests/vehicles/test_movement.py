"""Vehicle movement helper tests."""

from __future__ import annotations

from engine.network.edge import Road
from engine.vehicles.movement import advance_position, target_speed_ms
from engine.vehicles.vehicle import Vehicle, VehicleType


def make_vehicle(**overrides) -> Vehicle:
    data = dict(
        id="v1",
        origin="a",
        destination="c",
        vehicle_type=VehicleType.NORMAL,
        max_speed=15.0,
        current_node="a",
    )
    data.update(overrides)
    return Vehicle(**data)


def make_road(congestion: float = 0.0, speed_limit: float = 10.0) -> Road:
    return Road(
        id="ab",
        source="a",
        destination="b",
        distance=100.0,
        speed_limit=speed_limit,
        capacity=10,
        congestion=congestion,
    )


def test_target_speed_limited_by_road() -> None:
    road = make_road(speed_limit=8.0)
    vehicle = make_vehicle(max_speed=15.0)
    assert target_speed_ms(road, vehicle) == 8.0


def test_target_speed_limited_by_vehicle() -> None:
    road = make_road(speed_limit=20.0)
    vehicle = make_vehicle(max_speed=10.0)
    assert target_speed_ms(road, vehicle) == 10.0


def test_target_speed_reduced_by_congestion() -> None:
    road = make_road(speed_limit=10.0, congestion=1.0)
    vehicle = make_vehicle(max_speed=15.0)
    # factor = 1 + 1 = 2 -> 5 m/s
    assert target_speed_ms(road, vehicle) == 5.0


def test_emergency_ignores_congestion() -> None:
    road = make_road(speed_limit=10.0, congestion=3.0)
    vehicle = make_vehicle(vehicle_type=VehicleType.EMERGENCY, max_speed=20.0)
    assert target_speed_ms(road, vehicle, ignore_congestion=True) == 10.0


def test_advance_arrives_at_end() -> None:
    position, speed, arrived = advance_position(50.0, 10.0, 1.0, 100.0, False, 50.0)
    assert position == 60.0
    assert speed == 10.0
    assert not arrived


def test_advance_reaches_edge_end() -> None:
    position, speed, arrived = advance_position(95.0, 10.0, 1.0, 100.0, False, 5.0)
    assert position == 100.0
    assert arrived


def test_advance_decelerates_before_blockage() -> None:
    position, speed, arrived = advance_position(
        90.0, 10.0, 1.0, 100.0, True, 10.0
    )
    # deceleration ramp: speed = 10 * (10 / 25) = 4
    assert speed == 4.0
    assert position == 94.0
