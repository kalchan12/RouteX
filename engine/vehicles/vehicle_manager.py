"""Vehicle lifecycle management: spawning, movement and routing.

The manager owns all vehicles, decides when they spawn, moves them along
their current edge, and re-plans routes when roads change state. It depends
only on the network, the clock, the traffic-light controller and a routing
algorithm — never on any UI.
"""

from __future__ import annotations

import random

from engine.config import ScenarioConfig
from engine.network.edge import Road
from engine.network.graph import RoadNetwork
from engine.network.node import NodeType
from engine.routing.interface import default_cost
from engine.routing.registry import get_algorithm
from engine.simulation.clock import SimulationClock
from engine.traffic.traffic_lights import TrafficLightController
from engine.vehicles.movement import advance_position, target_speed_ms
from engine.vehicles.vehicle import Vehicle, VehicleStatus, VehicleType

_TYPE_MAX_SPEED = {
    VehicleType.NORMAL: 15.0,
    VehicleType.BUS: 12.0,
    VehicleType.TRUCK: 10.0,
    VehicleType.EMERGENCY: 18.0,
}


class VehicleManager:
    def __init__(
        self,
        network: RoadNetwork,
        scenario: ScenarioConfig,
        rng: random.Random,
        clock: SimulationClock,
        lights: TrafficLightController | None,
        algorithm_name: str = "dijkstra",
    ) -> None:
        self.network = network
        self.scenario = scenario
        self.rng = rng
        self.clock = clock
        self.lights = lights
        self.algorithm = get_algorithm(algorithm_name)

        self.vehicles: dict[str, Vehicle] = {}
        self._spawn_schedule: list[tuple[int, Vehicle]] = []
        self._spawn_cursor = 0
        self._manual_counter = 0
        self.route_computation_ms = 0.0
        self._build_spawn_schedule(scenario)

    # ------------------------------------------------------------------ #
    # Setup
    # ------------------------------------------------------------------ #
    def _build_spawn_schedule(self, scenario: ScenarioConfig) -> None:
        origins = [n.id for n in self.network.nodes_of_type(NodeType.ORIGIN)]
        destinations = [n.id for n in self.network.nodes_of_type(NodeType.DESTINATION)]
        if not origins or not destinations:
            raise ValueError("scenario network needs at least one origin and destination")

        type_ids = list(scenario.vehicle_types.keys())
        type_weights = list(scenario.vehicle_types.values())
        count = scenario.vehicle_count
        duration = max(1, scenario.duration)
        interval = max(1, duration // max(1, count))

        for i in range(count):
            spawn_tick = i * interval + self.rng.randint(0, max(1, interval - 1))
            spawn_tick = min(spawn_tick, duration - 1)
            origin = self.rng.choice(origins)
            destination = self.rng.choice(destinations)
            while destination == origin:
                destination = self.rng.choice(destinations)
            vtype = VehicleType(
                self.rng.choices(type_ids, weights=type_weights, k=1)[0]
            )
            vehicle = Vehicle(
                id=f"v{i}",
                origin=origin,
                destination=destination,
                vehicle_type=vtype,
                max_speed=_TYPE_MAX_SPEED[vtype],
                current_node=origin,
                spawned_at=spawn_tick,
            )
            self._spawn_schedule.append((spawn_tick, vehicle))
        self._spawn_schedule.sort(key=lambda item: item[0])

    # ------------------------------------------------------------------ #
    # Route planning
    # ------------------------------------------------------------------ #
    def plan_route(self, vehicle: Vehicle) -> bool:
        """Compute a route from the vehicle's current node to its destination."""
        route = self.algorithm.find_route(
            self.network, vehicle.current_node, vehicle.destination, cost=default_cost
        )
        self.route_computation_ms += route.computation_ms if route is not None else 0.0
        if route is None:
            vehicle.route = []
            vehicle.route_edges = []
            vehicle.route_index = 1
            return False
        vehicle.route = route.nodes
        vehicle.route_edges = route.edges
        vehicle.route_index = 1
        return True

    def reroute_vehicles_avoiding(self, road_id: str) -> int:
        """Re-plan routes for active vehicles whose route uses ``road_id``."""
        affected = 0
        for vehicle in self.vehicles.values():
            if vehicle.status is not VehicleStatus.ACTIVE:
                continue
            if road_id in vehicle.route_edges:
                if self.plan_route(vehicle):
                    affected += 1
        return affected

    # ------------------------------------------------------------------ #
    # Per-tick logic
    # ------------------------------------------------------------------ #
    def step(self) -> None:
        self._spawn_due()
        for vehicle in list(self.vehicles.values()):
            if vehicle.status is VehicleStatus.ACTIVE:
                self._move(vehicle)

    def _spawn_due(self) -> None:
        while (
            self._spawn_cursor < len(self._spawn_schedule)
            and self._spawn_schedule[self._spawn_cursor][0] <= self.clock.tick
        ):
            _, vehicle = self._spawn_schedule[self._spawn_cursor]
            self._spawn_cursor += 1
            self.vehicles[vehicle.id] = vehicle
            vehicle.status = (
                VehicleStatus.ACTIVE if self.plan_route(vehicle) else VehicleStatus.WAITING
            )

    def _move(self, vehicle: Vehicle) -> None:
        dt = self.clock.tick_duration

        if vehicle.current_edge is None:
            self._try_enter_next_edge(vehicle, dt)
            return

        road = self.network.edge(vehicle.current_edge)
        blocked = self._approach_blocked(vehicle, road)
        remaining = road.distance - vehicle.position
        speed = target_speed_ms(road, vehicle, ignore_congestion=vehicle.is_emergency)

        old_position = vehicle.position
        position, actual_speed, arrived = advance_position(
            old_position, speed, dt, road.distance, blocked, remaining
        )
        vehicle.position = position
        vehicle.speed = actual_speed
        vehicle.distance_traveled += position - old_position
        vehicle.travel_time += dt
        if actual_speed < 0.05:
            vehicle.waiting_time += dt

        if not arrived:
            return

        vehicle.current_edge = None
        vehicle.position = 0.0
        vehicle.speed = 0.0
        vehicle.current_node = road.destination
        vehicle.route_index += 1
        if vehicle.route_index >= len(vehicle.route):
            self._complete(vehicle)
        else:
            self._try_enter_next_edge(vehicle, dt)

    def _try_enter_next_edge(self, vehicle: Vehicle, dt: float) -> None:
        next_node = vehicle.next_node
        if next_node is None:
            if vehicle.current_node == vehicle.destination:
                self._complete(vehicle)
            return

        edge = self.network.edge_between(vehicle.current_node, next_node)
        if edge is None or not edge.is_traversable:
            if not self.plan_route(vehicle):
                vehicle.status = VehicleStatus.WAITING
            return

        if (
            self.lights is not None
            and not vehicle.is_emergency
            and not self.lights.is_green(vehicle.current_node, edge.id, self.clock.time)
        ):
            vehicle.speed = 0.0
            vehicle.waiting_time += dt
            return

        vehicle.current_edge = edge.id
        vehicle.position = 0.0

    def _approach_blocked(self, vehicle: Vehicle, road: Road) -> bool:
        """True when the vehicle must decelerate before the road's end node."""
        next_node = vehicle.next_node
        if next_node is None:
            return False
        if self.lights is not None and not vehicle.is_emergency:
            if not self.lights.is_green(road.destination, road.id, self.clock.time):
                return True
        next_road = self.network.edge_between(road.destination, next_node)
        if next_road is not None and not next_road.is_traversable:
            return True
        return False

    def _complete(self, vehicle: Vehicle) -> None:
        vehicle.status = VehicleStatus.COMPLETED
        vehicle.completed_at = self.clock.tick
        vehicle.current_edge = None
        vehicle.position = 0.0
        vehicle.speed = 0.0

    # ------------------------------------------------------------------ #
    # Counts / state
    # ------------------------------------------------------------------ #
    def spawn_extra(self, count: int, vtype: VehicleType = VehicleType.NORMAL) -> int:
        """Spawn ``count`` vehicles immediately (used by dynamic events)."""
        origins = [n.id for n in self.network.nodes_of_type(NodeType.ORIGIN)]
        destinations = [n.id for n in self.network.nodes_of_type(NodeType.DESTINATION)]
        spawned = 0
        batch = self._manual_counter
        self._manual_counter += 1
        for i in range(count):
            origin = self.rng.choice(origins)
            destination = self.rng.choice(destinations)
            while destination == origin:
                destination = self.rng.choice(destinations)
            vehicle = Vehicle(
                id=f"extra_{batch}_{i}",
                origin=origin,
                destination=destination,
                vehicle_type=vtype,
                max_speed=_TYPE_MAX_SPEED[vtype],
                current_node=origin,
                spawned_at=self.clock.tick,
            )
            self.vehicles[vehicle.id] = vehicle
            vehicle.status = (
                VehicleStatus.ACTIVE if self.plan_route(vehicle) else VehicleStatus.WAITING
            )
            spawned += 1
        return spawned

    def spawn_emergency(self, count: int = 1) -> int:
        """Spawn emergency vehicles (from a hospital node when present)."""
        hospitals = [n.id for n in self.network.nodes_of_type(NodeType.HOSPITAL)]
        origins = [n.id for n in self.network.nodes_of_type(NodeType.ORIGIN)]
        destinations = [n.id for n in self.network.nodes_of_type(NodeType.DESTINATION)]
        spawned = 0
        batch = self._manual_counter
        self._manual_counter += 1
        for i in range(count):
            origin = self.rng.choice(hospitals) if hospitals else self.rng.choice(origins)
            destination = self.rng.choice(destinations)
            while destination == origin:
                destination = self.rng.choice(destinations)
            vehicle = Vehicle(
                id=f"emergency_{batch}_{i}",
                origin=origin,
                destination=destination,
                vehicle_type=VehicleType.EMERGENCY,
                max_speed=_TYPE_MAX_SPEED[VehicleType.EMERGENCY],
                current_node=origin,
                spawned_at=self.clock.tick,
            )
            self.vehicles[vehicle.id] = vehicle
            vehicle.status = (
                VehicleStatus.ACTIVE if self.plan_route(vehicle) else VehicleStatus.WAITING
            )
            spawned += 1
        return spawned

    @property
    def active_count(self) -> int:
        return sum(1 for v in self.vehicles.values() if v.status is VehicleStatus.ACTIVE)

    @property
    def waiting_count(self) -> int:
        return sum(1 for v in self.vehicles.values() if v.status is VehicleStatus.WAITING)

    @property
    def completed_count(self) -> int:
        return sum(1 for v in self.vehicles.values() if v.status is VehicleStatus.COMPLETED)

    @property
    def spawned_count(self) -> int:
        return self._spawn_cursor
