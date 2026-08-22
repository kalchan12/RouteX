export enum NodeType {
  INTERSECTION = 'intersection',
  ORIGIN = 'origin',
  DESTINATION = 'destination',
  HOSPITAL = 'hospital',
}

export interface Node {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  trafficLightId: string | null;
}

export enum RoadType {
  STREET = 'street',
  AVENUE = 'avenue',
  HIGHWAY = 'highway',
}

export enum RoadStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  ACCIDENT = 'accident',
  CONSTRUCTION = 'construction',
}

export interface Road {
  id: string;
  source: string;
  destination: string;
  distance: number;
  speedLimit: number;
  capacity: number;
  lanes: number;
  roadType: RoadType;
  status: RoadStatus;
  priority: number;
  currentVehicleCount: number;
  congestion: number;
  baseTravelTime: number;
  currentTravelTime: number;
}

export interface RoadNetwork {
  nodes: Map<string, Node>;
  edges: Map<string, Road>;
  adjacency: Map<string, string[]>;
  incoming: Map<string, string[]>;
}

export interface Route {
  nodes: string[];
  edges: string[];
  totalCost: number;
  computationMs: number;
  algorithm: string;
}

export type CostFunction = (road: Road) => number;

export enum VehicleType {
  NORMAL = 'normal',
  EMERGENCY = 'emergency',
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  origin: string;
  destination: string;
  currentEdge: string | null;
  progress: number;
  route: Route | null;
  speed: number;
  spawnTick: number;
  arrived: boolean;
  arrivalTick: number | null;
}

export enum EventType {
  ROAD_CLOSURE = 'road_closure',
  ROAD_REOPENING = 'road_reopening',
  ACCIDENT = 'accident',
  VEHICLE_SPAWN = 'vehicle_spawn',
  TRAFFIC_SPIKE = 'traffic_spike',
  EMERGENCY_VEHICLE = 'emergency_vehicle',
  TRAFFIC_LIGHT_CHANGE = 'traffic_light_change',
}

export interface SimulationEvent {
  id: string;
  type: EventType;
  tick: number;
  duration: number;
  roadId: string | null;
  nodeId: string | null;
  payload: Record<string, unknown>;
}

export enum SimulationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export interface SimulationSnapshot {
  tick: number;
  time: number;
  status: SimulationStatus | string;
  vehicles: Vehicle[];
  vehicleCount: number;
  arrivedCount: number;
  networkSummary: { nodes: number; edges: number; closed: number };
  network: { nodes: Node[]; edges: Road[] };
  metrics: {
    avgTravelTime: number;
    avgSpeed: number;
    totalThroughput: number;
    avgCongestion: number;
    totalWaitingTime: number;
    emergencyResponseTime: number | null;
  };
}

export interface SimulationConfig {
  scenarioId: string;
  algorithm: string;
  seed: number;
  maxTicks: number;
  speed: number;
}

export interface ScenarioNetwork {
  nodes: Node[];
  edges: Omit<Road, 'currentVehicleCount' | 'congestion' | 'baseTravelTime' | 'currentTravelTime'>[];
}

export interface ScenarioTrafficLight {
  nodeId: string;
  greenDuration: number;
  redDuration: number;
  offset: number;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  duration: number;
  network: ScenarioNetwork;
  trafficLights: ScenarioTrafficLight[];
  events: Omit<SimulationEvent, 'id'>[];
  vehicleSpawnRate: number;
  vehicleTypes: VehicleType[];
}