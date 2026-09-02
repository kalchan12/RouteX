/**
 * Traffic Light Controller with Webster's Signal Timing.
 */

import type { Intersection, VehicleState } from './types';
import { LightState } from './types';

const SATURATION_FLOW = 1900 / 3600; // ~0.527 veh/sec per lane
const LOST_TIME_PER_PHASE = 3;

export class TrafficLightController {
  private flowRates = new Map<string, number>(); // laneId -> smoothed flow (veh/sec)
  private vehicleMemory = new Map<string, Set<string>>(); // laneId -> set of veh IDs seen in last cycle

  update(ix: Intersection, dt: number, allVehicles: VehicleState[] = []): void {
    ix.phaseTimer += dt;
    const phase = ix.phases[ix.currentPhase];
    if (!phase) return;

    // Observe vehicles to calculate flow
    for (const v of allVehicles) {
      if (!this.vehicleMemory.has(v.laneId)) {
        this.vehicleMemory.set(v.laneId, new Set());
      }
      this.vehicleMemory.get(v.laneId)!.add(v.id);
    }

    if (ix.inYellow) {
      if (ix.phaseTimer >= phase.yellowDuration) {
        ix.inYellow = false;
        ix.currentPhase = (ix.currentPhase + 1) % ix.phases.length;
        ix.phaseTimer = 0;
        
        if (ix.currentPhase === 0) {
          this.recomputeWebster(ix);
        }

        this.applyPhase(ix);
      }
    } else {
      if (ix.phaseTimer >= phase.duration) {
        ix.inYellow = true;
        ix.phaseTimer = 0;
        this.setYellow(ix);
      }
    }
  }

  private recomputeWebster(ix: Intersection): void {
    const qMap = new Map<string, number>();
    for (const [laneId, vehs] of this.vehicleMemory.entries()) {
      const totalCycleTime = ix.phases.reduce((acc, p) => acc + p.duration + p.yellowDuration, 0);
      const q = vehs.size / (totalCycleTime || 1);
      
      const oldQ = this.flowRates.get(laneId) ?? 0;
      const newQ = oldQ * 0.5 + q * 0.5;
      this.flowRates.set(laneId, newQ);
      qMap.set(laneId, newQ);
      
      vehs.clear();
    }

    let Y = 0;
    const criticalY = [];

    for (const phase of ix.phases) {
      let maxY = 0;
      for (const group of phase.greenGroups) {
        let groupQ = 0;
        for (const laneId of group) {
          groupQ += qMap.get(laneId) ?? 0;
        }
        const groupS = SATURATION_FLOW * group.length;
        const y = groupQ / groupS;
        if (y > maxY) maxY = y;
      }
      criticalY.push(maxY);
      Y += maxY;
    }

    Y = Math.min(Y, 0.9);

    const L = ix.phases.length * LOST_TIME_PER_PHASE;
    let C0 = (1.5 * L + 5) / (1 - Y);
    
    C0 = Math.max(30, Math.min(120, C0));

    const totalGreen = C0 - L;
    for (let i = 0; i < ix.phases.length; i++) {
      const y = criticalY[i]!;
      const duration = (y / (Y || 1)) * totalGreen;
      ix.phases[i]!.duration = Math.max(10, duration);
    }
  }

  private applyPhase(ix: Intersection): void {
    const phase = ix.phases[ix.currentPhase];
    if (!phase) return;

    const greenSet = new Set<string>();
    for (const grp of phase.greenGroups) {
      for (const id of grp) greenSet.add(id);
    }
    for (const light of ix.lights) {
      const isGreen = light.controlledLaneIds.some(id => greenSet.has(id));
      light.state = isGreen ? LightState.Green : LightState.Red;
    }
  }

  private setYellow(ix: Intersection): void {
    for (const light of ix.lights) {
      if (light.state === LightState.Green) light.state = LightState.Yellow;
    }
  }

  lightState(ix: Intersection, laneId: string): LightState {
    for (const l of ix.lights) {
      if (l.controlledLaneIds.includes(laneId)) return l.state;
    }
    return LightState.Red;
  }

  stopPos(ix: Intersection, laneId: string): number | null {
    for (const l of ix.lights) {
      if (l.controlledLaneIds.includes(laneId)) return l.stopPosition;
    }
    return null;
  }
}
