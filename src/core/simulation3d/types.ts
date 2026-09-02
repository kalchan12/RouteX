/**
 * Core type definitions for the traffic simulation engine.
 * All units are SI: meters (m), seconds (s), m/s, m/s².
 */

// ─── Geometry ──────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

// ─── Vehicle ───────────────────────────────────────────────

export interface VehicleState {
  id: string;
  /** 1D position along lane center-line (m from lane start) */
  position: number;
  speed: number;            // m/s
  acceleration: number;     // m/s²
  length: number;           // m
  width: number;            // m
  laneId: string;
  roadId: string;
  desiredSpeed: number;     // m/s
  maxAcceleration: number;  // m/s²
  comfortDecel: number;     // m/s²
  minGap: number;           // m (standstill gap)
  timeHeadway: number;      // s
  color: string;
  type: VehicleType;
  route: string[];
  routeIndex: number;
  /** Snapshot for render interpolation */
  prevPosition: number;
  prevSpeed: number;
}

export enum VehicleType {
  Car   = 'car',
  Truck = 'truck',
  Bus   = 'bus',
}

export interface IDMParams {
  desiredSpeed: number;
  maxAccel: number;
  comfortDecel: number;
  minGap: number;
  timeHeadway: number;
  delta: number;            // acceleration exponent (typically 4)
}

// ─── Road network ──────────────────────────────────────────

export interface Lane {
  id: string;
  roadId: string;
  index: number;
  length: number;           // m
  speedLimit: number;       // m/s
  direction: 'forward' | 'backward';
  /** Polyline defining the lane center in world coords */
  waypoints: Vec2[];
  connections: LaneConnection[];
}

export interface LaneConnection {
  toLaneId: string;
  toRoadId: string;
  turnType: 'straight' | 'left' | 'right';
}

export interface Road {
  id: string;
  lanes: Lane[];
  speedLimit: number;
  startIntersectionId: string | null;
  endIntersectionId: string | null;
}

// ─── Traffic lights ────────────────────────────────────────

export enum LightState {
  Red    = 'red',
  Yellow = 'yellow',
  Green  = 'green',
}

export interface TrafficLight {
  id: string;
  intersectionId: string;
  controlledLaneIds: string[];
  state: LightState;
  /** 1D position on the lane where vehicles stop */
  stopPosition: number;
}

export interface Phase {
  greenGroups: string[][];   // each group is a list of lane IDs
  duration: number;          // s
  yellowDuration: number;    // s
}

export interface Intersection {
  id: string;
  position: Vec2;
  size: number;              // square side length (m)
  phases: Phase[];
  currentPhase: number;
  phaseTimer: number;
  inYellow: boolean;
  lights: TrafficLight[];
}

// ─── Scenario ──────────────────────────────────────────────

export interface VehicleSpawner {
  laneId: string;
  rate: number;              // vehicles/minute
  routes: string[][];
  typeWeights: { type: VehicleType; weight: number }[];
}

export interface Scenario {
  name: string;
  description: string;
  roads: Road[];
  intersections: Intersection[];
  spawners: VehicleSpawner[];
  pedestrians?: PedestrianState[];
  seed: number;
}

// ─── Simulation state (for UI) ─────────────────────────────

export interface SimulationSnapshot {
  vehicleCount: number;
  avgSpeed: number;
  simTime: number;
  isRunning: boolean;
}

// ─── Pedestrians ───────────────────────────────────────────

export interface PedestrianState {
  id: string;
  position: Vec2;
  velocity: Vec2;
  radius: number;
  desiredSpeed: number;
  destination: Vec2;
}
