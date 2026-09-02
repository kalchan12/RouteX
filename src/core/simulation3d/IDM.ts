/**
 * Intelligent Driver Model (IDM)
 *
 * Treiber, Hennecke & Helbing (2000)
 *
 *   dv/dt = a · [ 1 − (v/v₀)^δ − (s*(v,Δv) / s)² ]
 *
 *   s*(v,Δv) = s₀ + max(0, v·T + v·Δv / (2·√(a·b)))
 *
 * All inputs/outputs in SI units.
 */

import type { IDMParams } from './types';

// ─── Default parameter sets ────────────────────────────────

export const CAR_PARAMS: IDMParams = {
  desiredSpeed: 13.9,    // ≈50 km/h (urban)
  maxAccel:     1.4,
  comfortDecel: 2.0,
  minGap:       2.0,
  timeHeadway:  1.5,
  delta:        4,
};

export const TRUCK_PARAMS: IDMParams = {
  desiredSpeed: 11.1,    // ≈40 km/h
  maxAccel:     0.7,
  comfortDecel: 1.5,
  minGap:       3.0,
  timeHeadway:  2.0,
  delta:        4,
};

export const BUS_PARAMS: IDMParams = {
  desiredSpeed: 11.1,
  maxAccel:     0.8,
  comfortDecel: 1.8,
  minGap:       3.0,
  timeHeadway:  1.8,
  delta:        4,
};

// ─── Core IDM function ─────────────────────────────────────

/**
 * Calculate IDM acceleration.
 *
 * @param v     Current speed (m/s)
 * @param v0    Desired speed (m/s)
 * @param s     Bumper-to-bumper gap to leader (m)
 * @param dv    Approach rate = v − v_leader (positive when closing)
 * @param p     IDM parameters
 */
export function idmAcceleration(
  v: number,
  v0: number,
  s: number,
  dv: number,
  p: IDMParams,
): number {
  const safeV0 = Math.max(v0, 0.01);
  const safeS  = Math.max(s, 0.01);

  // desired gap
  const sStar = p.minGap
    + Math.max(0, v * p.timeHeadway + (v * dv) / (2 * Math.sqrt(p.maxAccel * p.comfortDecel)));

  return p.maxAccel * (1 - Math.pow(v / safeV0, p.delta) - Math.pow(sStar / safeS, 2));
}

/** Free-road acceleration (no leader). */
export function idmFreeAccel(v: number, v0: number, p: IDMParams): number {
  const safeV0 = Math.max(v0, 0.01);
  return p.maxAccel * (1 - Math.pow(v / safeV0, p.delta));
}
