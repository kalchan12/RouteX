import { SimulationEngine } from './engine';
import { Vehicle } from '../shared/types';

export interface SimulationSnapshot {
  tick: number;
  time: number;
  status: string;
  vehicles: Vehicle[];
  vehicleCount: number;
  arrivedCount: number;
  networkSummary: { nodes: number; edges: number; closed: number };
  metrics: {
    avgTravelTime: number;
    avgSpeed: number;
    totalThroughput: number;
    avgCongestion: number;
    totalWaitingTime: number;
    emergencyResponseTime: number | null;
  };
}

export function buildSnapshot(engine: SimulationEngine): SimulationSnapshot {
  const vehicles = engine.getVehicles();
  const arrived = vehicles.filter(v => v.arrived).length;
  
  let totalTravelTime = 0;
  let totalSpeed = 0;
  let movingCount = 0;
  
  for (const v of vehicles) {
    if (!v.arrived && v.currentEdge) {
      totalSpeed += v.speed;
      movingCount++;
    }
    if (v.arrived && v.arrivalTick !== null) {
      totalTravelTime += v.arrivalTick - v.spawnTick;
    }
  }
  
  const networkSummary = engine.getNetworkSummary();
  
  return {
    tick: engine.getTick(),
    time: engine.getTime(),
    status: engine.getStatus(),
    vehicles,
    vehicleCount: vehicles.length,
    arrivedCount: arrived,
    networkSummary,
    metrics: {
      avgTravelTime: arrived > 0 ? totalTravelTime / arrived : 0,
      avgSpeed: movingCount > 0 ? totalSpeed / movingCount : 0,
      totalThroughput: arrived,
      avgCongestion: engine.getAverageCongestion(),
      totalWaitingTime: engine.getTotalWaitingTime(),
      emergencyResponseTime: engine.getEmergencyResponseTime(),
    },
  };
}