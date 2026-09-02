/**
 * MOBIL (Minimizing Overall Braking Induced by Lane change)
 * 
 * Determines if a lane change is beneficial based on IDM accelerations.
 */

import type { VehicleState } from './types';
import { idmAcceleration } from './IDM';
import { vehicleIDM } from './Vehicle';

export interface MOBILParams {
  p: number; // Politeness factor
  bSafe: number; // Maximum safe deceleration (positive value)
  aThresh: number; // Acceleration gain threshold
}

export const DEFAULT_MOBIL_PARAMS: MOBILParams = {
  p: 0.2, // Some politeness
  bSafe: 4.0, // Max safe braking
  aThresh: 0.2, // Minimum acceleration advantage
};

export function shouldChangeLane(
  v: VehicleState,
  currLeader: VehicleState | null,
  currFollower: VehicleState | null,
  targetLeader: VehicleState | null,
  targetFollower: VehicleState | null,
  params: MOBILParams = DEFAULT_MOBIL_PARAMS
): boolean {
  const p = vehicleIDM(v);

  // Helper to compute IDM accel
  const calcA = (subject: VehicleState, leader: VehicleState | null) => {
    if (!leader) return p.maxAccel;
    const s = leader.position - subject.position - (leader.length / 2) - (subject.length / 2);
    if (s <= 0) return -10; // Collision!
    const dv = subject.speed - leader.speed;
    return idmAcceleration(subject.speed, subject.desiredSpeed, s, dv, p);
  };

  const calcAFollower = (follower: VehicleState, leader: VehicleState | null) => {
    if (!follower) return 0;
    const fp = vehicleIDM(follower);
    if (!leader) return fp.maxAccel;
    const s = leader.position - follower.position - (leader.length / 2) - (follower.length / 2);
    if (s <= 0) return -10;
    const dv = follower.speed - leader.speed;
    return idmAcceleration(follower.speed, follower.desiredSpeed, s, dv, fp);
  };

  // 1. Safety check for target follower
  const aTargetFollowerNew = calcAFollower(targetFollower!, v);
  if (targetFollower && aTargetFollowerNew < -params.bSafe) {
    return false; // Target follower would have to brake too hard
  }

  // 2. Incentive criterion
  const aCurr = calcA(v, currLeader);
  const aNew = calcA(v, targetLeader);
  
  const aCurrFollowerOld = calcAFollower(currFollower!, v);
  const aCurrFollowerNew = calcAFollower(currFollower!, currLeader);
  
  const aTargetFollowerOld = calcAFollower(targetFollower!, targetLeader);

  // v's advantage
  const selfAdvantage = aNew - aCurr;
  
  // Advantages to others (current follower gets new leader, target follower gets v as leader)
  const currFollowerAdvantage = currFollower ? (aCurrFollowerNew - aCurrFollowerOld) : 0;
  const targetFollowerAdvantage = targetFollower ? (aTargetFollowerNew - aTargetFollowerOld) : 0;

  return selfAdvantage + params.p * (currFollowerAdvantage + targetFollowerAdvantage) > params.aThresh;
}
