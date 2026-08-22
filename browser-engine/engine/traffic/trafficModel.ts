import { Road } from '../shared/types';
import { congestionFactor, calculateCongestion } from './congestion';
import { updateRoadDynamicState } from '../network/edge';

export function refreshNetworkDynamicState(
  edges: Map<string, Road>,
  vehicleCounts: Map<string, number>
): void {
  for (const [roadId, road] of edges) {
    const count = vehicleCounts.get(roadId) ?? 0;
    updateRoadDynamicState(road, count);
  }
}

export { congestionFactor, calculateCongestion };