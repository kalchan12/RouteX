import { SimulationEngine } from './engine';
import { SimulationSnapshot, Vehicle, Node, Road } from '../../shared/types';
export type { SimulationSnapshot };

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
  
  const networkData = engine.getNetwork();
  const nodes = Array.from(networkData.nodes.values());
  const edges = Array.from(networkData.edges.values());

  return {
    tick: engine.getTick(),
    time: engine.getTime(),
    status: engine.getStatus(),
    vehicles,
    vehicleCount: vehicles.length,
    arrivedCount: arrived,
    networkSummary,
    network: { nodes, edges },
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