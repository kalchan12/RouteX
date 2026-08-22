import { Vehicle, VehicleType, Route, RoadNetwork, Road, Node } from '../../types';
import { getRoad, isTraversable } from '../network';

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

  step(tick: number): void {
    this.tick = tick;
    this.spawnVehicles();
    this.moveVehicles();
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
    
    return {
      id: `veh_${this.nextVehicleId++}`,
      type,
      origin,
      destination,
      currentEdge: route.edges[0],
      progress: 0,
      route,
      speed: speedLimit,
      spawnTick: this.tick,
      arrived: false,
      arrivalTick: null,
    };
  }

  private findRoute(origin: string, destination: string): Route | null {
    if (this.algorithm === 'astar') {
      return this.aStar(origin, destination);
    }
    return this.dijkstra(origin, destination);
  }

  private dijkstra(origin: string, destination: string): Route | null {
    const start = performance.now();
    const dist = new Map<string, number>([[origin, 0]]);
    const prev = new Map<string, { node: string; edge: string }>();
    const heap: Array<[number, string]> = [[0, origin]];
    const visited = new Set<string>();

    while (heap.length > 0) {
      heap.sort((a, b) => a[0] - b[0]);
      const [currentDist, nodeId] = heap.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      if (nodeId === destination) break;

      for (const [neighborId, edgeId] of neighbors(this.network, nodeId)) {
        const edge = getRoad(this.network, edgeId);
        const edgeCost = defaultCost(edge);
        if (edgeCost === Infinity) continue;
        
        const candidate = currentDist + edgeCost;
        if (candidate < (dist.get(neighborId) ?? Infinity)) {
          dist.set(neighborId, candidate);
          prev.set(neighborId, { node: nodeId, edge: edgeId });
          heap.push([candidate, neighborId]);
        }
      }
    }

    if (!dist.has(destination)) return null;

    const nodes: string[] = [destination];
    const edges: string[] = [];
    let current = destination;
    
    while (current !== origin) {
      const { node, edge } = prev.get(current)!;
      edges.push(edge);
      nodes.push(node);
      current = node;
    }
    
    nodes.reverse();
    edges.reverse();

    return {
      nodes,
      edges,
      totalCost: dist.get(destination)!,
      computationMs: performance.now() - start,
      algorithm: 'dijkstra',
    };
  }

  private aStar(origin: string, destination: string): Route | null {
    const start = performance.now();
    const destNode = this.network.nodes.get(destination)!;
    
    const gScore = new Map<string, number>([[origin, 0]]);
    const fScore = new Map<string, number>([[origin, heuristic(origin, destination, this.network)]]);
    const prev = new Map<string, { node: string; edge: string }>();
    
    const openSet = new Set<string>([origin]);
    const closedSet = new Set<string>();

    while (openSet.size > 0) {
      let current: string | null = null;
      let lowestF = Infinity;
      
      for (const nodeId of openSet) {
        const f = fScore.get(nodeId) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = nodeId;
        }
      }

      if (!current) break;
      if (current === destination) break;

      openSet.delete(current);
      closedSet.add(current);

      for (const [neighborId, edgeId] of neighbors(this.network, current)) {
        if (closedSet.has(neighborId)) continue;

        const edge = getRoad(this.network, edgeId);
        const edgeCost = defaultCost(edge);
        if (edgeCost === Infinity) continue;

        const tentativeG = (gScore.get(current) ?? Infinity) + edgeCost;
        
        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          prev.set(neighborId, { node: current, edge: edgeId });
          gScore.set(neighborId, tentativeG);
          fScore.set(neighborId, tentativeG + heuristic(neighborId, destination, this.network));
          openSet.add(neighborId);
        }
      }
    }

    if (!gScore.has(destination)) return null;

    const nodes: string[] = [destination];
    const edges: string[] = [];
    let current = destination;
    
    while (current !== origin) {
      const { node, edge } = prev.get(current)!;
      edges.push(edge);
      nodes.push(node);
      current = node;
    }
    
    nodes.reverse();
    edges.reverse();

    return {
      nodes,
      edges,
      totalCost: gScore.get(destination)!,
      computationMs: performance.now() - start,
      algorithm: 'astar',
    };
  }

  private moveVehicles(): void {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.arrived) continue;
      
      if (!vehicle.currentEdge) continue;
      
      const edge = getRoad(this.network, vehicle.currentEdge);
      const travelTime = edge.currentTravelTime;
      
      vehicle.progress += 1 / travelTime;
      
      if (vehicle.progress >= 1) {
        this.advanceVehicle(vehicle);
      }
    }
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

function heuristic(nodeId: string, destination: string, network: RoadNetwork): number {
  const node = network.nodes.get(nodeId);
  const dest = network.nodes.get(destination);
  if (!node || !dest) return 0;
  
  const dx = node.x - dest.x;
  const dy = node.y - dest.y;
  return Math.sqrt(dx * dx + dy * dy) / 15;
}

function neighbors(network: RoadNetwork, nodeId: string): Iterable<[string, string]> {
  const result: [string, string][] = [];
  for (const edgeId of network.adjacency.get(nodeId) ?? []) {
    const road = network.edges.get(edgeId)!;
    if (isTraversable(road)) {
      result.push([road.destination, edgeId]);
    }
  }
  return result;
}

function defaultCost(road: Road): number {
  if (!isTraversable(road)) return Infinity;
  return road.currentTravelTime;
}