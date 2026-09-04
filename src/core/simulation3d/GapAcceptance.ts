/**
 * Gap Acceptance model for turns.
 */

import type { VehicleState, Lane } from './types';
import { VehicleType } from './types';
import { RoadNetwork } from './RoadNetwork';

export const GAP_PARAMS: Record<VehicleType, { criticalGap: number; followUp: number }> = {
  [VehicleType.Car]: { criticalGap: 4.5, followUp: 2.5 },
  [VehicleType.Truck]: { criticalGap: 6.5, followUp: 3.5 },
  [VehicleType.Bus]: { criticalGap: 6.0, followUp: 3.0 },
  [VehicleType.Emergency]: { criticalGap: 2.5, followUp: 1.5 },
};

export function canSafelyTurn(
  turner: VehicleState,
  currentLane: Lane,
  _targetLane: Lane,
  network: RoadNetwork,
  turnType: 'straight' | 'left' | 'right'
): boolean {
  if (turnType === 'straight') return true;

  const params = GAP_PARAMS[turner.type] || GAP_PARAMS[VehicleType.Car];
  
  // Conflicting vehicles are ones heading towards the intersection.
  // We'll scan all lanes that end at this intersection and check time-to-collision (TTC).
  const road = network.getRoad(currentLane.roadId);
  if (!road || !road.endIntersectionId) return true;

  const ix = network.getIntersection(road.endIntersectionId);
  if (!ix) return true;

  const allRoads = network.getAllRoads();
  for (const r of allRoads) {
    if (r.endIntersectionId === ix.id && r.id !== road.id) {
      // This road approaches the same intersection
      for (const l of r.lanes) {
        const vehs = network.laneVehicles(l.id);
        for (const v of vehs) {
          const distToIx = l.length - v.position;
          if (distToIx > 0 && distToIx < 50) {
            const ttc = distToIx / Math.max(v.speed, 0.1);
            if (ttc < params.criticalGap) {
              return false; // Conflicting vehicle too close
            }
          }
        }
      }
    }
  }

  return true;
}
