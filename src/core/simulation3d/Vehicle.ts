/**
 * Vehicle factory — creates vehicles with personality variation.
 * Each vehicle gets slightly different IDM params via Box-Muller
 * normal distribution, producing realistic heterogeneous traffic.
 */

import type { VehicleState, IDMParams } from './types';
import { VehicleType } from './types';
import { CAR_PARAMS, TRUCK_PARAMS, BUS_PARAMS, EMERGENCY_PARAMS } from './IDM';

let nextId = 0;
export function resetIds(): void { nextId = 0; }

const POLICE_PARAMS: IDMParams = {
  desiredSpeed: 18.0, // ~65 km/h
  maxAccel:     3.2,
  comfortDecel: 3.5,
  minGap:       1.5,
  timeHeadway:  0.9,
  delta:        4,
};

const MOTORCYCLE_PARAMS: IDMParams = {
  desiredSpeed: 16.0, // ~58 km/h
  maxAccel:     3.5,
  comfortDecel: 3.0,
  minGap:       1.0,
  timeHeadway:  0.8,
  delta:        4,
};

const BAJAJ_PARAMS: IDMParams = {
  desiredSpeed: 12.0, // ~43 km/h
  maxAccel:     2.0,
  comfortDecel: 2.2,
  minGap:       1.0,
  timeHeadway:  1.0,
  delta:        4,
};

const MINIBUS_PARAMS: IDMParams = {
  desiredSpeed: 14.5, // ~52 km/h
  maxAccel:     2.2,
  comfortDecel: 2.0,
  minGap:       1.8,
  timeHeadway:  1.2,
  delta:        4,
};

const VISUALS: Record<VehicleType, { len: number; wid: number; colors: string[] }> = {
  [VehicleType.Car]:   { len: 4.5, wid: 1.9,
    colors: ['#4a9eff','#34d399','#f87171','#fbbf24','#a78bfa','#fb923c','#38bdf8','#e879f9'] },
  [VehicleType.Truck]: { len: 8.0, wid: 2.4,
    colors: ['#64748b','#78716c','#6b7280'] },
  [VehicleType.Bus]:   { len: 11.0, wid: 2.5,
    colors: ['#eab308','#f97316'] },
  [VehicleType.Emergency]: { len: 5.2, wid: 2.1,
    colors: ['#ffffff'] },
  [VehicleType.Police]: { len: 4.8, wid: 2.0,
    colors: ['#1e293b'] },
  [VehicleType.Motorcycle]: { len: 2.2, wid: 0.9,
    colors: ['#0284c7', '#dc2626', '#16a34a', '#18181b'] },
  [VehicleType.Bajaj]: { len: 2.8, wid: 1.3,
    colors: ['#facc15', '#0284c7'] },
  [VehicleType.MinibusTaxi]: { len: 5.0, wid: 2.0,
    colors: ['#2563eb'] }, // Blue & white Ethiopian taxi
};

function baseParams(t: VehicleType): IDMParams {
  if (t === VehicleType.Truck) return TRUCK_PARAMS;
  if (t === VehicleType.Bus)   return BUS_PARAMS;
  if (t === VehicleType.Emergency) return EMERGENCY_PARAMS;
  if (t === VehicleType.Police) return POLICE_PARAMS;
  if (t === VehicleType.Motorcycle) return MOTORCYCLE_PARAMS;
  if (t === VehicleType.Bajaj) return BAJAJ_PARAMS;
  if (t === VehicleType.MinibusTaxi) return MINIBUS_PARAMS;
  return CAR_PARAMS;
}

/** Box-Muller normal variate clamped to ≥ base×0.5 */
function vary(base: number, sd: number, rng: () => number): number {
  const u1 = Math.max(rng(), 1e-4);
  const u2 = rng();
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(base * 0.5, base + z * sd);
}

function generateLicensePlate(rng: () => number): string {
  const regionCode = Math.floor(1 + rng() * 3);
  const alpha = ['A', 'B', 'C', 'M', 'T'][Math.floor(rng() * 5)];
  const num = Math.floor(100 + rng() * 899);
  return `ET-${regionCode}-${alpha}${num}`;
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
  const vis = VISUALS[type] || VISUALS[VehicleType.Car];
  const color = vis.colors[Math.floor(rng() * vis.colors.length)] ?? vis.colors[0]!;

  // Driver personality: 20% aggressive, 20% cautious, 60% normal
  const pRoll = rng();
  const personality = type === VehicleType.Emergency || type === VehicleType.Police
    ? 'aggressive'
    : pRoll < 0.2
    ? 'aggressive'
    : pRoll > 0.8
    ? 'cautious'
    : 'normal';

  const speedMult = personality === 'aggressive' ? 1.25 : personality === 'cautious' ? 0.85 : 1.0;
  const gapMult = personality === 'aggressive' ? 0.75 : personality === 'cautious' ? 1.3 : 1.0;
  const accelMult = personality === 'aggressive' ? 1.3 : personality === 'cautious' ? 0.85 : 1.0;

  return {
    id:              `v${nextId++}`,
    position,
    speed:           0,
    acceleration:    0,
    length:          vis.len + (rng() - 0.5) * 0.3,
    width:           vis.wid,
    laneId,
    roadId,
    desiredSpeed:    vary(bp.desiredSpeed * speedMult, 1.5, rng),
    maxAcceleration: vary(bp.maxAccel * accelMult,     0.3, rng),
    comfortDecel:    vary(bp.comfortDecel,             0.3, rng),
    minGap:          vary(bp.minGap * gapMult,         0.2, rng),
    timeHeadway:     vary(bp.timeHeadway * gapMult,    0.2, rng),
    color,
    type,
    route,
    routeIndex:      0,
    prevPosition:    position,
    prevSpeed:       0,
    personality,
    licensePlate:    generateLicensePlate(rng),
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
