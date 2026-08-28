import { Vehicle, VehicleType, VehicleState, Route, RoadNetwork, Road, Node } from '../../types';
import { getRoad, isTraversable } from '../network';
import { updateVehicleKinematics } from './movement';
import { TrafficLight } from '../traffic/trafficLights';
import { createDijkstra, createAStar } from '../routing/algorithms';

export interface VehicleManagerConfig {
  network: RoadNetwork;
  rng: () => number;
  algorithm: string;
}

export function createVehicleManager(config: VehicleManagerConfig): VehicleManager {
  return new VehicleManager(config);
}

export class VehicleManager {
  private network: RoadNetwork;
  private rng: () => number;
  private algorithm: string;
  private vehicles: Map<string, Vehicle> = new Map();
  private nextVehicleId = 1;
  private spawnRate = 0;
  private tick = 0;

  constructor(config: VehicleManagerConfig) {
    this.network = config.network;
    this.rng = config.rng;
    this.algorithm = config.algorithm;
  }

  get vehiclesList(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }

  setSpawnRate(rate: number): void {
    this.spawnRate = rate;
  }

  step(tick: number, lights: Map<string, TrafficLight> = new Map()): void {
    this.tick = tick;
    this.spawnVehicles();
    this.moveVehicles(lights);
  }

  private spawnVehicles(): void {
    for (let i = 0; i < this.spawnRate; i++) {
      this.spawnRandomVehicle();
    }
  }

  private spawnRandomVehicle(): void {
    const origins = Array.from(this.network.nodes.values()).filter((n: Node) => n.type === 'origin');
    const destinations = Array.from(this.network.nodes.values()).filter((n: Node) => n.type === 'destination');
    
    if (origins.length === 0 || destinations.length === 0) return;

    const origin = origins[Math.floor(this.rng() * origins.length)];
    const destination = destinations[Math.floor(this.rng() * destinations.length)];
    
    if (origin.id === destination.id) return;

    const vehicle = this.createVehicle(origin.id, destination.id);
    if (vehicle) {
      this.vehicles.set(vehicle.id, vehicle);
    }
  }

  spawnExtra(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnRandomVehicle();
    }
  }

  spawnEmergency(count: number): void {
    const origins = Array.from(this.network.nodes.values()).filter((n: Node) => n.type === 'origin');
    const hospitals = Array.from(this.network.nodes.values()).filter((n: Node) => n.type === 'hospital');
    
    if (origins.length === 0 || hospitals.length === 0) return;

    for (let i = 0; i < count; i++) {
      const origin = origins[Math.floor(this.rng() * origins.length)];
      const destination = hospitals[Math.floor(this.rng() * hospitals.length)];
      
      const vehicle = this.createVehicle(origin.id, destination.id, VehicleType.EMERGENCY);
      if (vehicle) {
        this.vehicles.set(vehicle.id, vehicle);
      }
    }
  }

  private createVehicle(origin: string, destination: string, type: VehicleType = VehicleType.NORMAL): Vehicle | null {
    const route = this.findRoute(origin, destination);
    if (!route || route.edges.length === 0) return null;

    const firstEdge = getRoad(this.network, route.edges[0]);
    const speedLimit = firstEdge.speedLimit;
    
    const maxSpeed = type === VehicleType.EMERGENCY ? speedLimit * 1.3 : speedLimit;
    
    return {
      id: `veh_${this.nextVehicleId++}`,
      type,
      state: VehicleState.MOVING,
      origin,
      destination,
      currentEdge: route.edges[0],
      progress: 0,
      route,
      speed: speedLimit,
      maxSpeed,
      acceleration: maxSpeed * 0.1,
      deceleration: maxSpeed * 0.2,
      spawnTick: this.tick,
      arrived: false,
      arrivalTick: null,
    };
  }

  private findRoute(origin: string, destination: string): Route | null {
    if (this.algorithm === 'astar') {
      return createAStar().findRoute(this.network, origin, destination);
    }
    return createDijkstra().findRoute(this.network, origin, destination);
  }

  private moveVehicles(lights: Map<string, TrafficLight>): void {
    updateVehicleKinematics(
      Array.from(this.vehicles.values()),
      this.network,
      lights,
      (vehicle) => this.advanceVehicle(vehicle)
    );
  }

  private advanceVehicle(vehicle: Vehicle): void {
    if (!vehicle.route) {
      vehicle.arrived = true;
      vehicle.arrivalTick = this.tick;
      return;
    }

    const currentEdgeIndex = vehicle.route.edges.indexOf(vehicle.currentEdge!);
    const nextEdgeIndex = currentEdgeIndex + 1;

    if (nextEdgeIndex >= vehicle.route.edges.length) {
      vehicle.arrived = true;
      vehicle.arrivalTick = this.tick;
      vehicle.currentEdge = null;
      vehicle.progress = 0;
      return;
    }

    const nextEdgeId = vehicle.route.edges[nextEdgeIndex];
    const nextEdge = getRoad(this.network, nextEdgeId);

    if (!isTraversable(nextEdge)) {
      this.rerouteVehicle(vehicle);
      return;
    }

    vehicle.currentEdge = nextEdgeId;
    vehicle.progress = 0;
    vehicle.speed = nextEdge.speedLimit;
  }

  rerouteVehicle(vehicle: Vehicle): void {
    if (!vehicle.currentEdge) return;
    
    const currentNode = getRoad(this.network, vehicle.currentEdge).destination;
    const route = this.findRoute(currentNode, vehicle.destination);
    
    if (route && route.edges.length > 0) {
      vehicle.route = route;
      vehicle.currentEdge = route.edges[0];
      vehicle.progress = 0;
      const edge = getRoad(this.network, vehicle.currentEdge);
      vehicle.speed = edge.speedLimit;
    }
  }

  rerouteVehiclesAvoiding(roadId: string): void {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.arrived) continue;
      if (vehicle.route?.edges.includes(roadId)) {
        this.rerouteVehicle(vehicle);
      }
    }
  }

  removeArrived(): number {
    let removed = 0;
    for (const [id, vehicle] of this.vehicles) {
      if (vehicle.arrived) {
        this.vehicles.delete(id);
        removed++;
      }
    }
    return removed;
  }
}

