/**
 * Vehicle factory — creates vehicles with personality variation.
 * Each vehicle gets slightly different IDM params via Box-Muller
 * normal distribution, producing realistic heterogeneous traffic.
 */

import type { VehicleState, IDMParams } from './types';
import { VehicleType } from './types';
import { CAR_PARAMS, TRUCK_PARAMS, BUS_PARAMS } from './IDM';

let nextId = 0;
export function resetIds(): void { nextId = 0; }

const VISUALS: Record<VehicleType, { len: number; wid: number; colors: string[] }> = {
  [VehicleType.Car]:   { len: 4.5, wid: 1.9,
    colors: ['#4a9eff','#34d399','#f87171','#fbbf24','#a78bfa','#fb923c','#38bdf8','#e879f9'] },
  [VehicleType.Truck]: { len: 8.0, wid: 2.4,
    colors: ['#64748b','#78716c','#6b7280'] },
  [VehicleType.Bus]:   { len: 11.0, wid: 2.5,
    colors: ['#eab308','#f97316'] },
};

function baseParams(t: VehicleType): IDMParams {
  if (t === VehicleType.Truck) return TRUCK_PARAMS;
  if (t === VehicleType.Bus)   return BUS_PARAMS;
  return CAR_PARAMS;
}

/** Box-Muller normal variate clamped to ≥ base×0.5 */
function vary(base: number, sd: number, rng: () => number): number {
  const u1 = Math.max(rng(), 1e-4);
  const u2 = rng();
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(base * 0.5, base + z * sd);
}

export function createVehicle(
  type: VehicleType,
  laneId: string,
  roadId: string,
  position: number,
  route: string[],
  rng: () => number,
): VehicleState {
  const bp = baseParams(type);
  const vis = VISUALS[type];
  const color = vis.colors[Math.floor(rng() * vis.colors.length)] ?? vis.colors[0]!;

  return {
    id:              `v${nextId++}`,
    position,
    speed:           0,
    acceleration:    0,
    length:          vis.len + (rng() - 0.5) * 0.4,
    width:           vis.wid,
    laneId,
    roadId,
    desiredSpeed:    vary(bp.desiredSpeed, 2.0, rng),
    maxAcceleration: vary(bp.maxAccel,     0.3, rng),
    comfortDecel:    vary(bp.comfortDecel,  0.3, rng),
    minGap:          vary(bp.minGap,        0.3, rng),
    timeHeadway:     vary(bp.timeHeadway,   0.3, rng),
    color,
    type,
    route,
    routeIndex:      0,
    prevPosition:    position,
    prevSpeed:       0,
  };
}

/** Extract IDMParams from a live vehicle. */
export function vehicleIDM(v: VehicleState): IDMParams {
  return {
    desiredSpeed: v.desiredSpeed,
    maxAccel:     v.maxAcceleration,
    comfortDecel: v.comfortDecel,
    minGap:       v.minGap,
    timeHeadway:  v.timeHeadway,
    delta:        4,
  };
}
