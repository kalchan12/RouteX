import { 
  ScenarioConfig, 
  ScenarioNetwork, 
  ScenarioTrafficLight, 
  RoadNetwork, 
  Road, 
  Vehicle, 
  VehicleType, 
  SimulationEvent, 
  EventType, 
  RoadStatus,
  SimulationStatus,
  SimulationConfig as SimConfig 
} from '../../shared/types';
import { SimulationClock } from './clock';
import { EventQueue, createEvent } from './events';
import { buildNetwork } from '../network/networkBuilder';
import { VehicleManager, createVehicleManager } from '../vehicles/vehicleManager';
import { refreshNetworkDynamicState } from '../traffic/trafficModel';
import { buildLights, stepLights, isGreen, getLightForNode } from '../traffic/trafficLights';
import { buildSnapshot, SimulationSnapshot } from './state';
import { createDijkstra, createAStar, defaultCost } from '../routing/algorithms';

export interface SimulationEngineConfig {
  scenario: ScenarioConfig;
  scenarioId?: string;
  algorithm?: string;
  seed?: number;
  maxTicks?: number;
  speed?: number;
}

export class SimulationEngine {
  private scenario: ScenarioConfig;
  private config: SimConfig;
  
  private clock!: SimulationClock;
  private network!: ReturnType<typeof buildNetwork>['network'];
  private lights!: Map<string, ReturnType<typeof buildLights> extends Map<string, infer T> ? T : never>;
  private manager!: VehicleManager;
  private events!: EventQueue;
  private status: SimulationStatus = SimulationStatus.PENDING;
  private tickEvents: SimulationEvent[] = [];
  
  private spikeTicksLeft = 0;
  private spikeRate = 0;
  
  private dijkstra = createDijkstra();
  private astar = createAStar();

  constructor(config: SimulationEngineConfig) {
    this.scenario = config.scenario;
    this.config = {
      scenarioId: config.scenarioId || config.scenario.id,
      algorithm: config.algorithm || 'dijkstra',
      seed: config.seed || 42,
      maxTicks: config.maxTicks || config.scenario.duration,
      speed: config.speed || 1.0,
    };
    this.rebuild();
  }

  rebuild(): void {
    const rng = this.createRNG(this.config.seed);
    
    this.clock = new SimulationClock(1.0);
    const { network } = buildNetwork(this.scenario.network);
    this.network = network;
    this.lights = buildLights(this.scenario.trafficLights);
    this.manager = createVehicleManager({
      network: this.network as RoadNetwork,
      rng,
      algorithm: this.config.algorithm,
    });
    this.manager.setSpawnRate(this.scenario.vehicleSpawnRate);
    this.events = new EventQueue();
    this.status = SimulationStatus.PENDING;
    this.tickEvents = [];
    this.spikeTicksLeft = 0;
    this.spikeRate = 0;
    this.scheduleEvents(this.scenario.events);
  }

  private createRNG(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private scheduleEvents(rawEvents: Omit<SimulationEvent, 'id'>[]): void {
    for (const raw of rawEvents) {
      this.events.schedule(createEvent(
        raw.type,
        raw.tick,
        raw.duration,
        raw.roadId,
        raw.nodeId,
        raw.payload
      ));
    }
  }

  start(): void {
    if (this.status === SimulationStatus.PENDING || this.status === SimulationStatus.PAUSED) {
      this.status = SimulationStatus.RUNNING;
    }
  }

  pause(): void {
    if (this.status === SimulationStatus.RUNNING) {
      this.status = SimulationStatus.PAUSED;
    }
  }

  stop(): void {
    this.status = SimulationStatus.STOPPED;
  }

  step(): void {
    if (this.status !== SimulationStatus.RUNNING) return;
    if (this.clock.tick >= this.config.maxTicks) {
      this.complete();
      return;
    }

    this.tickEvents = [];
    this.clock.step();
    this.processEvents();
    this.processTrafficSpike();
    this.manager.step(this.clock.tick);
    this.updateNetworkState();
    this.stepTrafficLights();
    this.checkCompletion();
  }

  run(steps: number): void {
    this.start();
    for (let i = 0; i < steps; i++) {
      if (this.status !== SimulationStatus.RUNNING) break;
      this.step();
    }
  }

  snapshot(): SimulationSnapshot {
    return buildSnapshot(this);
  }

  getTick(): number {
    return this.clock.tick;
  }

  getTime(): number {
    return this.clock.time;
  }

  getStatus(): SimulationStatus {
    return this.status;
  }

  getVehicles(): Vehicle[] {
    return this.manager.vehiclesList;
  }

  getNetwork(): RoadNetwork {
    return this.network as RoadNetwork;
  }

  getNetworkSummary(): { nodes: number; edges: number; closed: number } {
    let closed = 0;
    for (const road of this.network.edges.values()) {
      if (road.status !== RoadStatus.OPEN) closed++;
    }
    return { nodes: this.network.nodes.size, edges: this.network.edges.size, closed };
  }

  getAverageCongestion(): number {
    let total = 0;
    let count = 0;
    for (const road of this.network.edges.values()) {
      total += road.congestion;
      count++;
    }
    return count > 0 ? total / count : 0;
  }

  getTotalWaitingTime(): number {
    let total = 0;
    for (const vehicle of this.manager.vehiclesList) {
      if (!vehicle.arrived && vehicle.currentEdge) {
        const road = this.network.edges.get(vehicle.currentEdge);
        if (road && road.congestion > 0.5) {
          total += 1;
        }
      }
    }
    return total;
  }

  getEmergencyResponseTime(): number | null {
    const emergencies = this.manager.vehiclesList.filter(v => v.type === VehicleType.EMERGENCY && v.arrived);
    if (emergencies.length === 0) return null;
    let total = 0;
    for (const v of emergencies) {
      if (v.arrivalTick !== null) {
        total += v.arrivalTick - v.spawnTick;
      }
    }
    return total / emergencies.length;
  }

  private processEvents(): void {
    for (const event of this.events.pending(this.clock.tick)) {
      this.events.markApplied(event);
      this.tickEvents.push(event);
      this.applyEvent(event);
    }
  }

  private applyEvent(event: SimulationEvent): void {
    switch (event.type) {
      case EventType.ROAD_CLOSURE:
        this.setRoadStatus(event.roadId, RoadStatus.CLOSED);
        break;
      case EventType.ROAD_REOPENING:
        this.setRoadStatus(event.roadId, RoadStatus.OPEN);
        break;
      case EventType.ACCIDENT:
        this.setRoadStatus(event.roadId, RoadStatus.ACCIDENT);
        break;
      case EventType.VEHICLE_SPAWN:
        this.manager.spawnExtra(event.payload.count as number || 1);
        break;
      case EventType.TRAFFIC_SPIKE:
        this.spikeRate = (event.payload.count as number) || 2;
        this.spikeTicksLeft = Math.max(1, event.duration);
        break;
      case EventType.EMERGENCY_VEHICLE:
        this.manager.spawnEmergency(event.payload.count as number || 1);
        break;
      case EventType.TRAFFIC_LIGHT_CHANGE:
        this.changeLight(event);
        break;
    }
  }

  private setRoadStatus(roadId: string | null, status: RoadStatus): void {
    if (!roadId || !this.network.edges.has(roadId)) return;
    const road = this.network.edges.get(roadId)!;
    road.status = status;
    if (status !== RoadStatus.OPEN) {
      this.manager.rerouteVehiclesAvoiding(roadId);
    }
  }

  private changeLight(event: SimulationEvent): void {
    const light = event.nodeId 
      ? getLightForNode(this.lights, event.nodeId)
      : this.lights.get(event.payload.lightId as string);
    if (!light) return;
    if ('green_duration' in event.payload) {
      light.greenDuration = event.payload.green_duration as number;
    }
    if ('red_duration' in event.payload) {
      light.redDuration = event.payload.red_duration as number;
    }
  }

  private processTrafficSpike(): void {
    if (this.spikeTicksLeft > 0) {
      this.manager.spawnExtra(this.spikeRate);
      this.spikeTicksLeft--;
    }
  }

  private updateNetworkState(): void {
    const vehicleCounts = new Map<string, number>();
    for (const vehicle of this.manager.vehiclesList) {
      if (vehicle.currentEdge) {
        vehicleCounts.set(vehicle.currentEdge, (vehicleCounts.get(vehicle.currentEdge) || 0) + 1);
      }
    }
    refreshNetworkDynamicState(this.network.edges, vehicleCounts);
  }

  private stepTrafficLights(): void {
    stepLights(this.lights);
  }

  private checkCompletion(): void {
    if (this.clock.tick >= this.config.maxTicks) {
      this.complete();
    }
  }

  private complete(): void {
    if (this.status === SimulationStatus.RUNNING) {
      this.status = SimulationStatus.COMPLETED;
    }
  }
}

export function createSimulationEngine(config: SimulationEngineConfig): SimulationEngine {
  return new SimulationEngine(config);
}