/**
 * Road Network — manages roads, lanes, intersections.
 *
 * Key design: vehicles live in **sorted arrays per lane** (ascending
 * by position).  This gives O(1) leader lookup — the vehicle directly
 * after you in the array is your leader.
 *
 * The 1D→2D mapping (lanePositionToWorld) is the architectural bridge
 * between the simulation (which works in 1D lane coordinates) and the
 * renderer (which works in 2D screen coordinates).
 */

import type { Road, Lane, Intersection, VehicleState, Vec2 } from './types';

export class RoadNetwork {
  private roads        = new Map<string, Road>();
  private lanes        = new Map<string, Lane>();
  private intersections = new Map<string, Intersection>();
  /** Vehicles sorted by position (ascending) per lane */
  private byLane       = new Map<string, VehicleState[]>();

  // ── Mutators ──────────────────────────────────────────────

  addRoad(road: Road): void {
    this.roads.set(road.id, road);
    for (const lane of road.lanes) {
      this.lanes.set(lane.id, lane);
      if (!this.byLane.has(lane.id)) this.byLane.set(lane.id, []);
    }
  }

  addIntersection(ix: Intersection): void {
    this.intersections.set(ix.id, ix);
  }

  clear(): void {
    this.roads.clear();
    this.lanes.clear();
    this.intersections.clear();
    this.byLane.clear();
  }

  clearVehicles(): void {
    for (const arr of this.byLane.values()) arr.length = 0;
  }

  // ── Getters ───────────────────────────────────────────────

  getRoad(id: string)         { return this.roads.get(id); }
  getLane(id: string)         { return this.lanes.get(id); }
  getIntersection(id: string) { return this.intersections.get(id); }
  getAllRoads()          { return [...this.roads.values()]; }
  getAllLanes()          { return [...this.lanes.values()]; }
  getAllIntersections()  { return [...this.intersections.values()]; }

  // ── Vehicle management ────────────────────────────────────

  laneVehicles(laneId: string): VehicleState[] {
    return this.byLane.get(laneId) ?? [];
  }

  /** Insert keeping sorted order (binary search). */
  insertVehicle(v: VehicleState): void {
    const arr = this.byLane.get(v.laneId);
    if (!arr) return;
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid]!.position < v.position) lo = mid + 1; else hi = mid;
    }
    arr.splice(lo, 0, v);
  }

  removeVehicle(v: VehicleState): void {
    const arr = this.byLane.get(v.laneId);
    if (!arr) return;
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1);
  }

  /** Re-sort after bulk position updates. */
  resort(): void {
    for (const arr of this.byLane.values()) {
      arr.sort((a, b) => a.position - b.position);
    }
  }

  /** Leader = next vehicle ahead in the same lane (higher position). */
  getLeader(v: VehicleState): VehicleState | null {
    const arr = this.byLane.get(v.laneId);
    if (!arr) return null;
    const i = arr.indexOf(v);
    if (i < 0 || i >= arr.length - 1) return null;
    return arr[i + 1]!;
  }

  getAllVehicles(): VehicleState[] {
    const out: VehicleState[] = [];
    for (const arr of this.byLane.values()) out.push(...arr);
    return out;
  }

  vehicleCount(): number {
    let n = 0;
    for (const arr of this.byLane.values()) n += arr.length;
    return n;
  }

  // ── 1D → 2D mapping ──────────────────────────────────────

  /** Map a 1D lane position to 2D world coordinates. */
  toWorld(laneId: string, pos: number): Vec2 | null {
    const lane = this.lanes.get(laneId);
    if (!lane || lane.waypoints.length < 2) return null;
    if (pos <= 0) return lane.waypoints[0]!;

    let acc = 0;
    for (let i = 0; i < lane.waypoints.length - 1; i++) {
      const a = lane.waypoints[i]!;
      const b = lane.waypoints[i + 1]!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const seg = Math.sqrt(dx * dx + dy * dy);
      if (acc + seg >= pos) {
        const t = (pos - acc) / Math.max(seg, 1e-6);
        return { x: a.x + dx * t, y: a.y + dy * t };
      }
      acc += seg;
    }
    return lane.waypoints[lane.waypoints.length - 1]!;
  }

  /** Heading angle at a 1D lane position. */
  toAngle(laneId: string, pos: number): number {
    const lane = this.lanes.get(laneId);
    if (!lane || lane.waypoints.length < 2) return 0;

    let acc = 0;
    for (let i = 0; i < lane.waypoints.length - 1; i++) {
      const a = lane.waypoints[i]!;
      const b = lane.waypoints[i + 1]!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const seg = Math.sqrt(dx * dx + dy * dy);
      if (acc + seg >= pos || i === lane.waypoints.length - 2) {
        return Math.atan2(dy, dx);
      }
      acc += seg;
    }
    return 0;
  }
}
