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
  BUS = 'bus',
  TRUCK = 'truck',
}

export enum VehicleState {
  MOVING = 'moving',
  SLOWING = 'slowing',
  STOPPED = 'stopped',
  WAITING = 'waiting',
  TURNING = 'turning',
  ARRIVED = 'arrived',
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  state: VehicleState;
  origin: string;
  destination: string;
  currentEdge: string | null;
  progress: number;
  route: Route | null;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
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
  INCIDENT_CREATED = 'incident_created',
  INCIDENT_CLEARED = 'incident_cleared',
  PEDESTRIAN_SPAWN = 'pedestrian_spawn',
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

export enum IncidentType {
  ACCIDENT = 'accident',
  CONSTRUCTION = 'construction',
  ROAD_CLOSURE = 'road_closure',
  DEBRIS = 'debris',
  WEATHER = 'weather',
}

export enum IncidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  roadId: string | null;
  nodeId: string | null;
  position: { x: number; y: number } | null;
  description: string;
  startTick: number;
  endTick: number | null;
  affectedLanes: number[];
  estimatedClearanceTick: number | null;
}

export interface Pedestrian {
  id: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  speed: number;
  state: 'walking' | 'waiting' | 'crossing';
  spawnTick: number;
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
  incidents: Incident[];
  pedestrians: Pedestrian[];
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
  incidents: Omit<Incident, 'id' | 'startTick' | 'endTick'>[];
  pedestrians: Omit<Pedestrian, 'id' | 'spawnTick'>[];
  vehicleSpawnRate: number;
  vehicleTypes: VehicleType[];
}
export interface ActiveIncident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  lat: number;
  lng: number;
  description: string;
  reportedAt: number;
  assignedUnits: string[];
  roadId: string | null;
  estimatedClearanceMinutes: number | null;
}

export type SimulationMode = 'dashboard' | 'transitioning_in' | 'simulation' | 'transitioning_out';
