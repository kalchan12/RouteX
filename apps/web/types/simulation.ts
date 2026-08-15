export type NodeType =
  | "intersection"
  | "origin"
  | "destination"
  | "hospital";

export type RoadStatus = "open" | "closed" | "accident" | "construction";

export type VehicleType = "normal" | "bus" | "truck" | "emergency";

export type VehicleStatus = "waiting" | "active" | "completed";

export type SimulationStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "stopped"
  | "error";

export interface NetworkNode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  traffic_light_id?: string | null;
}

export interface RoadState {
  id: string;
  source: string;
  destination: string;
  distance: number;
  speed_limit: number;
  capacity: number;
  lanes: number;
  road_type: string;
  status: RoadStatus;
  current_vehicle_count: number;
  congestion: number;
  base_travel_time: number;
  current_travel_time: number;
}

export interface VehicleState {
  id: string;
  origin: string;
  destination: string;
  type: VehicleType;
  max_speed: number;
  current_node: string;
  current_edge: string | null;
  position: number;
  speed: number;
  route: string[];
  route_index: number;
  status: VehicleStatus;
  distance_traveled: number;
  travel_time: number;
  waiting_time: number;
  spawned_at: number;
  completed_at: number | null;
  x: number;
  y: number;
}

export interface TrafficLightState {
  id: string;
  node_id: string;
  green_duration: number;
  red_duration: number;
  phase: number;
}

export interface MetricsSummary {
  total_vehicles: number;
  active_vehicles: number;
  waiting_vehicles: number;
  completed_vehicles: number;
  total_travel_time: number;
  avg_travel_time: number;
  total_waiting_time: number;
  avg_speed: number;
  max_congestion: number;
  throughput: number;
  emergency_response_time: number;
  route_computation_ms: number;
  elapsed: number;
}

export interface SimulationSnapshot {
  tick: number;
  time: number;
  status: SimulationStatus;
  algorithm: string;
  nodes: NetworkNode[];
  roads: RoadState[];
  vehicles: VehicleState[];
  lights: TrafficLightState[];
  metrics: MetricsSummary;
  summary: { nodes: number; edges: number; closed: number };
  events: Array<{
    type: string;
    timestamp: number;
    duration: number;
    road_id?: string | null;
    node_id?: string | null;
    payload: Record<string, unknown>;
  }>;
}

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
}

export interface AlgorithmSummary {
  id: string;
  name: string;
  description: string;
}

export interface SimulationSummary {
  id: string;
  scenario_id: string;
  algorithm: string;
  status: SimulationStatus;
  seed: number;
  speed: number;
  metrics_summary: MetricsSummary | null;
  created_at: string;
}

export interface BenchmarkSummary {
  id: string;
  scenario_id: string;
  created_at: string;
  results: BenchmarkResult[];
}

export interface BenchmarkResult {
  algorithm: string;
  run: number;
  seed: number;
  tick: number;
  metrics: MetricsSummary;
}
