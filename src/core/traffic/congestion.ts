import { congestionFactor } from '../network/edge';

export function calculateCongestion(vehicleCount: number, capacity: number): number {
  if (capacity <= 0) return 1.0;
  return vehicleCount / capacity;
}