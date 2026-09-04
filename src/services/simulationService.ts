import { SimulationEngine } from '../core/simulation3d/SimulationEngine';
import { getScenario3D } from '../core/simulation3d/scenarios';
import { useSimulationStore } from '../stores';
import { SimulationStatus, SimulationSnapshot, VehicleType } from '../types';

let engineInstance: SimulationEngine | null = null;
let tickerId: number | null = null;
let lastTickTime = performance.now();

export function getSimulationEngine(): SimulationEngine {
  if (!engineInstance) {
    engineInstance = new SimulationEngine();
    const initialScenario = getScenario3D('normal');
    engineInstance.load(initialScenario);
    startEngineTicker();
  }
  return engineInstance;
}

function startEngineTicker(): void {
  if (tickerId !== null) return;

  const tick = () => {
    const now = performance.now();
    const dt = Math.min((now - lastTickTime) / 1000, 0.1);
    lastTickTime = now;

    if (engineInstance) {
      engineInstance.update(dt);
      broadcastSnapshot();
    }

    tickerId = requestAnimationFrame(tick);
  };

  tickerId = requestAnimationFrame(tick);
}

let lastBroadcastTime = 0;

function broadcastSnapshot(): void {
  if (!engineInstance) return;

  const now = performance.now();
  // Broadcast snapshot to Zustand store ~10-15 times a second to prevent UI thrashing
  if (now - lastBroadcastTime < 70) return;
  lastBroadcastTime = now;

  const snap3d = engineInstance.getSnapshot();
  const store = useSimulationStore.getState();

  // Convert 3D vehicles to types matching RouteX store requirements
  const vehicles = snap3d.vehicles.map((v) => ({
    id: v.id,
    type: v.type === 'emergency' 
      ? VehicleType.EMERGENCY 
      : v.type === 'truck' 
      ? VehicleType.TRUCK 
      : v.type === 'bus' 
      ? VehicleType.BUS 
      : VehicleType.NORMAL,
    state: v.state as any,
    origin: v.laneId,
    destination: v.destination || 'exit',
    currentEdge: v.laneId,
    progress: (v.progress ?? 0) / 100,
    route: null,
    speed: v.speed,
    maxSpeed: v.maxSpeed || 15,
    acceleration: v.acceleration,
    deceleration: 2.0,
    spawnTick: 0,
    arrived: false,
    arrivalTick: null,
  }));

  const snapshot: SimulationSnapshot = {
    tick: snap3d.tick,
    time: snap3d.simTime,
    status: snap3d.isRunning ? SimulationStatus.RUNNING : SimulationStatus.PAUSED,
    vehicles,
    vehicleCount: snap3d.vehicleCount,
    arrivedCount: snap3d.metrics.totalThroughput,
    incidents: [],
    pedestrians: [],
    networkSummary: {
      nodes: 8,
      edges: 12,
      closed: snap3d.blockedLanes ? snap3d.blockedLanes.length : 0,
    },
    network: {
      nodes: [],
      edges: [],
    },
    metrics: {
      avgTravelTime: snap3d.metrics.avgTravelTime,
      avgSpeed: snap3d.metrics.avgSpeed,
      totalThroughput: snap3d.metrics.totalThroughput,
      avgCongestion: snap3d.metrics.avgCongestion,
      totalWaitingTime: snap3d.metrics.totalWaitingTime,
      emergencyResponseTime: snap3d.metrics.emergencyResponseTime ?? 4.2,
    },
  };

  store.setSnapshot(snapshot);
  store.setStatus(snap3d.isRunning ? SimulationStatus.RUNNING : SimulationStatus.PAUSED);
}

export function startSimulation(): void {
  const engine = getSimulationEngine();
  engine.start();
  useSimulationStore.getState().setStatus(SimulationStatus.RUNNING);
}

export function pauseSimulation(): void {
  const engine = getSimulationEngine();
  engine.pause();
  useSimulationStore.getState().setStatus(SimulationStatus.PAUSED);
}

export function resetSimulation(): void {
  const engine = getSimulationEngine();
  const currentScenarioId = useSimulationStore.getState().selectedScenarioId || 'normal';
  engine.reset();
  engine.load(getScenario3D(currentScenarioId));
  useSimulationStore.getState().clearTimeSeriesData();
  useSimulationStore.getState().setStatus(SimulationStatus.PENDING);
}

export function stepSimulation(): void {
  const engine = getSimulationEngine();
  engine.stepOnce();
  broadcastSnapshot();
}

export function setSimulationSpeed(speed: number): void {
  const engine = getSimulationEngine();
  engine.setSpeed(speed);
  useSimulationStore.getState().setSimSpeed(speed);
}

export function loadSimulationScenario(scenarioId: string): void {
  const engine = getSimulationEngine();
  const scenario = getScenario3D(scenarioId);
  engine.reset();
  engine.load(scenario);
  useSimulationStore.getState().setSelectedScenarioId(scenarioId);
  useSimulationStore.getState().clearTimeSeriesData();
}

export function blockRoadLane(laneId?: string): void {
  const engine = getSimulationEngine();
  engine.blockRoad(laneId);
  broadcastSnapshot();
}

export function spawnEmergencyUnits(count = 1): void {
  const engine = getSimulationEngine();
  engine.spawnEmergency(count);
  broadcastSnapshot();
}

export function triggerTrafficSurge(multiplier = 2.5, durationSec = 15): void {
  const engine = getSimulationEngine();
  engine.triggerTrafficSpike(multiplier, durationSec);
}

export function clearAllIncidents(): void {
  const engine = getSimulationEngine();
  engine.clearIncidents();
  broadcastSnapshot();
}
