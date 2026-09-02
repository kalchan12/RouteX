/**
 * Social Force Model for Pedestrians
 * (Helbing & Molnar 1995)
 */

import type { PedestrianState, VehicleState, Vec2 } from './types';
import { RoadNetwork } from './RoadNetwork';

export const SF_PARAMS = {
  relaxationTime: 0.5,
  pedRepulsionA: 2.0,
  pedRepulsionB: 0.3,
  vehRepulsionA: 5.0,
  vehRepulsionB: 1.0,
};

function normalize(v: Vec2): { dir: Vec2; len: number } {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-6) return { dir: { x: 0, y: 0 }, len: 0 };
  return { dir: { x: v.x / len, y: v.y / len }, len };
}

export function computePedestrianForces(
  ped: PedestrianState,
  allPeds: PedestrianState[],
  allVehs: VehicleState[],
  network: RoadNetwork
): Vec2 {
  let fx = 0;
  let fy = 0;

  // 1. Destination attraction (driving force)
  const toDest = { x: ped.destination.x - ped.position.x, y: ped.destination.y - ped.position.y };
  const { dir, len } = normalize(toDest);
  if (len > 0.1) {
    fx += (dir.x * ped.desiredSpeed - ped.velocity.x) / SF_PARAMS.relaxationTime;
    fy += (dir.y * ped.desiredSpeed - ped.velocity.y) / SF_PARAMS.relaxationTime;
  } else {
    // Reached destination, slow down
    fx += (-ped.velocity.x) / SF_PARAMS.relaxationTime;
    fy += (-ped.velocity.y) / SF_PARAMS.relaxationTime;
  }

  // 2. Pedestrian repulsion
  for (const other of allPeds) {
    if (other === ped) continue;
    const dx = ped.position.x - other.position.x;
    const dy = ped.position.y - other.position.y;
    const dLen = Math.sqrt(dx * dx + dy * dy);
    if (dLen < 1e-6) continue;
    
    const d = dLen - ped.radius - other.radius;
    const force = SF_PARAMS.pedRepulsionA * Math.exp(-d / SF_PARAMS.pedRepulsionB);
    fx += force * (dx / dLen);
    fy += force * (dy / dLen);
  }

  // 3. Vehicle repulsion
  for (const veh of allVehs) {
    const vPos = network.toWorld(veh.laneId, veh.position);
    if (!vPos) continue;
    const dx = ped.position.x - vPos.x;
    const dy = ped.position.y - vPos.y;
    const dLen = Math.sqrt(dx * dx + dy * dy);
    if (dLen < 1e-6) continue;

    // Approx distance to vehicle surface (vehicle is a rectangle, we approximate with a bounding circle for simplicity here)
    const vehRadius = veh.length / 2; 
    const d = dLen - ped.radius - vehRadius;
    const force = SF_PARAMS.vehRepulsionA * Math.exp(-d / SF_PARAMS.vehRepulsionB);
    fx += force * (dx / dLen);
    fy += force * (dy / dLen);
  }

  return { x: fx, y: fy };
}
