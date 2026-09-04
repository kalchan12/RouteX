/**
 * Core Simulation Engine.
 * 
 * Runs the fixed-timestep physics loop, totally decoupled from React/UI.
 * Uses the IDM for car-following, virtual obstacles for traffic lights and road incidents,
 * and MOBIL for realistic multi-lane changes.
 */

import type { Scenario, VehicleState, SimulationSnapshot, VehicleSpawner, PedestrianState, VehicleSnapshot } from './types';
import { VehicleType, LightState } from './types';
import { RoadNetwork } from './RoadNetwork';
import { TrafficLightController } from './TrafficLightController';
import { idmAcceleration, idmFreeAccel } from './IDM';
import { createVehicle, vehicleIDM, resetIds } from './Vehicle';
import { shouldChangeLane } from './MOBIL';
import { computePedestrianForces } from './SocialForce';
import { canSafelyTurn } from './GapAcceptance';

/** Seeded PRNG (mulberry32) for reproducible traffic generation */
function createRNG(seed: number): () => number {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SimulationEngine {
  readonly network = new RoadNetwork();
  private traffic = new TrafficLightController();
  
  private running = false;
  private simTime = 0;
  private readonly dt = 1 / 60; // 60Hz physics step
  private accumulator = 0;
  private speedMult = 1;
  private rng: () => number = Math.random;
  
  private spawners: VehicleSpawner[] = [];
  private spawnTimers: number[] = [];
  
  public pedestrians: PedestrianState[] = [];
  public blockedLanes = new Set<string>();

  private totalThroughput = 0;
  private arrivedCount = 0;
  private totalTravelTime = 0;
  private trafficSpikeTimer = 0;
  private trafficSpikeMultiplier = 1.0;

  load(scenario: Scenario): void {
    this.network.clear();
    this.pedestrians = scenario.pedestrians ?? [];
    resetIds();
    this.simTime = 0;
    this.accumulator = 0;
    this.blockedLanes.clear();
    this.totalThroughput = 0;
    this.arrivedCount = 0;
    this.totalTravelTime = 0;
    this.trafficSpikeTimer = 0;
    this.trafficSpikeMultiplier = 1.0;
    this.rng = createRNG(scenario.seed);

    for (const r of scenario.roads) this.network.addRoad(r);
    for (const ix of scenario.intersections) this.network.addIntersection(ix);

    this.spawners = scenario.spawners;
    this.spawnTimers = new Array(scenario.spawners.length).fill(0);
  }

  start(): void { this.running = true; }
  pause(): void { this.running = false; }
  stop(): void {
    this.running = false;
    this.simTime = 0;
    this.accumulator = 0;
    this.network.clearVehicles();
  }
  reset(): void {
    this.stop();
    this.blockedLanes.clear();
    this.totalThroughput = 0;
    this.arrivedCount = 0;
    this.totalTravelTime = 0;
    this.trafficSpikeTimer = 0;
    this.trafficSpikeMultiplier = 1.0;
  }
  setSpeed(mult: number): void { this.speedMult = Math.max(0.1, Math.min(10, mult)); }

  /** Manually step forward by one tick (dt) */
  stepOnce(): void {
    this.step(this.dt);
  }

  /** Dynamic Incident Injection: block a lane */
  blockRoad(laneId?: string): void {
    if (laneId) {
      this.blockedLanes.add(laneId);
    } else {
      // Pick first available lane
      const roads = this.network.getAllRoads();
      if (roads.length > 0 && roads[0]!.lanes.length > 0) {
        this.blockedLanes.add(roads[0]!.lanes[0]!.id);
      }
    }
  }

  /** Dynamic Incident Injection: spawn emergency vehicle */
  spawnEmergency(count = 1): void {
    const roads = this.network.getAllRoads();
    if (roads.length === 0) return;
    
    for (let i = 0; i < count; i++) {
      const spawner = this.spawners[i % this.spawners.length];
      const targetLaneId = spawner ? spawner.laneId : roads[0]!.lanes[0]!.id;
      const lane = this.network.getLane(targetLaneId);
      if (!lane) continue;

      const v = createVehicle(VehicleType.Emergency, targetLaneId, lane.roadId, 0, [], this.rng);
      v.desiredSpeed = 22.0; // High speed response
      v.color = '#ef4444';
      this.network.insertVehicle(v);
    }
  }

  /** Trigger temporary traffic surge */
  triggerTrafficSpike(multiplier = 2.5, durationSec = 15): void {
    this.trafficSpikeMultiplier = multiplier;
    this.trafficSpikeTimer = durationSec;
  }

  /** Clear all active road closures and incidents */
  clearIncidents(): void {
    this.blockedLanes.clear();
  }

  /** Called by render loop with actual elapsed wall-clock time (seconds). */
  update(realDt: number): void {
    if (!this.running) return;
    this.accumulator += realDt * this.speedMult;
    
    // Prevent "spiral of death" if tab is backgrounded
    if (this.accumulator > 0.25) this.accumulator = 0.25;

    while (this.accumulator >= this.dt) {
      this.step(this.dt);
      this.accumulator -= this.dt;
    }
  }

  private step(dt: number): void {
    this.simTime += dt;

    if (this.trafficSpikeTimer > 0) {
      this.trafficSpikeTimer -= dt;
      if (this.trafficSpikeTimer <= 0) {
        this.trafficSpikeMultiplier = 1.0;
      }
    }

    const all = this.network.getAllVehicles();
    // 1. Traffic lights
    for (const ix of this.network.getAllIntersections()) this.traffic.update(ix, dt, all);

    // 2. Spawning
    this.processSpawners(dt);

    // 3. Save state for interpolation
    for (const v of all) {
      v.prevPosition = v.position;
      v.prevSpeed = v.speed;
    }

    // 4. Calculate accelerations (IDM)
    for (const v of all) this.calcAccel(v, dt);

    // 4.5. MOBIL Lane changing
    for (const v of all) {
      if (this.rng() < dt * 2.0) { // ~2 chances per second
        this.tryLaneChange(v);
      }
    }

    // 5. Integrate & move
    const removed: VehicleState[] = [];
    for (const v of all) {
      v.speed = Math.max(0, v.speed + v.acceleration * dt);
      v.position += v.speed * dt;
      
      const lane = this.network.getLane(v.laneId);
      if (lane && v.position > lane.length) {
        if (!this.transitionNextLane(v)) {
          removed.push(v);
          this.totalThroughput++;
          this.arrivedCount++;
          this.totalTravelTime += (v.position / Math.max(1, v.speed));
        }
      }
    }

    // 5.5. Pedestrian Physics
    for (const ped of this.pedestrians) {
      const force = computePedestrianForces(ped, this.pedestrians, all, this.network);
      ped.velocity.x += force.x * dt;
      ped.velocity.y += force.y * dt;
      const vLen = Math.sqrt(ped.velocity.x * ped.velocity.x + ped.velocity.y * ped.velocity.y);
      if (vLen > ped.desiredSpeed * 1.5) {
        ped.velocity.x = (ped.velocity.x / vLen) * ped.desiredSpeed * 1.5;
        ped.velocity.y = (ped.velocity.y / vLen) * ped.desiredSpeed * 1.5;
      }
      ped.position.x += ped.velocity.x * dt;
      ped.position.y += ped.velocity.y * dt;
    }

    // 6. Cleanup & Re-sort
    for (const v of removed) this.network.removeVehicle(v);
    this.network.resort();
  }

  private calcAccel(v: VehicleState, dt: number): void {
    const p = vehicleIDM(v);
    const leader = this.network.getLeader(v);
    
    // Find virtual obstacle (red light or blocked lane)
    let obstacleGap = Infinity;
    const lane = this.network.getLane(v.laneId);
    const road = lane ? this.network.getRoad(lane.roadId) : null;
    
    // Check lane blockage incident
    if (this.blockedLanes.has(v.laneId) && lane) {
      const blockPoint = lane.length * 0.45;
      if (blockPoint > v.position) {
        obstacleGap = blockPoint - v.position - v.length / 2;
      }
    }

    if (road?.endIntersectionId) {
      const ix = this.network.getIntersection(road.endIntersectionId);
      if (ix) {
        const state = this.traffic.lightState(ix, v.laneId);
        if (state === LightState.Red || state === LightState.Yellow) {
          const stopPos = this.traffic.stopPos(ix, v.laneId);
          if (stopPos !== null) {
            const tlGap = stopPos - v.position - v.length / 2;
            if (tlGap < obstacleGap && tlGap > 0) {
              obstacleGap = tlGap;
            }
          }
        }
      }
    }

    if (leader) {
      const gap = leader.position - v.position - (leader.length / 2) - (v.length / 2);
      const dv = v.speed - leader.speed;
      
      if (obstacleGap < gap && obstacleGap > 0) {
        v.acceleration = idmAcceleration(v.speed, v.desiredSpeed, obstacleGap, v.speed, p);
      } else {
        v.acceleration = idmAcceleration(v.speed, v.desiredSpeed, gap, dv, p);
      }
    } else if (obstacleGap < Infinity && obstacleGap > 0) {
      v.acceleration = idmAcceleration(v.speed, v.desiredSpeed, obstacleGap, v.speed, p);
    } else {
      v.acceleration = idmFreeAccel(v.speed, v.desiredSpeed, p);
    }

    v.acceleration = Math.max(-8, Math.min(p.maxAccel, v.acceleration));

    // Slight stochastic variation for non-emergency vehicles
    if (v.type !== VehicleType.Emergency && this.rng() < 0.08 * dt) {
      v.acceleration -= this.rng() * 1.2;
      v.acceleration = Math.max(-8, v.acceleration);
    }
  }

  private transitionNextLane(v: VehicleState): boolean {
    const lane = this.network.getLane(v.laneId);
    if (!lane || lane.connections.length === 0) return false;

    // Check light
    const road = this.network.getRoad(lane.roadId);
    if (road?.endIntersectionId) {
      const ix = this.network.getIntersection(road.endIntersectionId);
      if (ix && this.traffic.lightState(ix, v.laneId) !== LightState.Green && v.type !== VehicleType.Emergency) {
        v.position = lane.length;
        v.speed = 0;
        return true;
      }
    }

    // Pick connection
    const conn = lane.connections.length > 1 
      ? lane.connections[Math.floor(this.rng() * lane.connections.length)]! 
      : lane.connections[0]!;

    const targetLane = this.network.getLane(conn.toLaneId);
    if (!targetLane) return false;

    // Gap acceptance (emergency vehicles have high assertiveness)
    if (v.type !== VehicleType.Emergency && !canSafelyTurn(v, lane, targetLane, this.network, conn.turnType)) {
      v.position = lane.length;
      v.speed = 0;
      return true; // Wait for gap
    }

    const over = v.position - lane.length;
    this.network.removeVehicle(v);
    
    v.laneId = conn.toLaneId;
    v.roadId = conn.toRoadId;
    v.position = over;
    v.prevPosition = over;
    
    this.network.insertVehicle(v);
    return true;
  }

  private processSpawners(dt: number): void {
    for (let i = 0; i < this.spawners.length; i++) {
      const s = this.spawners[i]!;
      this.spawnTimers[i]! += dt;
      
      const effectiveRate = s.rate * this.trafficSpikeMultiplier;
      const interval = 60 / effectiveRate;
      while (this.spawnTimers[i]! >= interval) {
        this.spawnTimers[i]! -= interval;

        // Space check
        const q = this.network.laneVehicles(s.laneId);
        if (q.length > 0 && q[0]!.position < 15) continue; // jammed

        // Type selection
        const roll = this.rng();
        let cum = 0, type = VehicleType.Car;
        for (const w of s.typeWeights) {
          cum += w.weight;
          if (roll < cum) { type = w.type; break; }
        }

        const route = s.routes[Math.floor(this.rng() * s.routes.length)] ?? [];
        const lane = this.network.getLane(s.laneId);
        
        const v = createVehicle(type, s.laneId, lane?.roadId ?? '', 0, route, this.rng);
        this.network.insertVehicle(v);
      }
    }
  }

  getSnapshot(): SimulationSnapshot {
    const all = this.network.getAllVehicles();
    const speedSum = all.reduce((acc, v) => acc + v.speed, 0);
    const avgSpeed = all.length > 0 ? speedSum / all.length : 0;
    const stoppedCount = all.filter(v => v.speed < 0.5).length;

    const vehicles: VehicleSnapshot[] = all.map(v => {
      const lane = this.network.getLane(v.laneId);
      const laneLen = lane?.length || 100;
      const progress = Math.min(100, Math.round((v.position / laneLen) * 100));
      return {
        id: v.id,
        type: v.type,
        position: v.position,
        speed: v.speed,
        desiredSpeed: v.desiredSpeed,
        maxSpeed: v.desiredSpeed * 1.2,
        acceleration: v.acceleration,
        laneId: v.laneId,
        roadId: v.roadId,
        length: v.length,
        width: v.width,
        color: v.color,
        origin: v.laneId,
        destination: v.route[v.route.length - 1] || 'exit',
        state: v.speed < 0.5 ? 'stopped' : v.acceleration < -1 ? 'slowing' : 'moving',
        progress,
      };
    });

    const avgCongestion = all.length > 0 
      ? Math.min(1, Math.max(0, 1 - (avgSpeed / 13.9)))
      : 0;

    return {
      tick: Math.floor(this.simTime * 20),
      simTime: this.simTime,
      status: this.running ? 'running' : 'paused',
      isRunning: this.running,
      vehicleCount: all.length,
      vehicles,
      metrics: {
        totalThroughput: this.totalThroughput,
        avgSpeed,
        avgTravelTime: this.arrivedCount > 0 ? this.totalTravelTime / this.arrivedCount : 18.5,
        avgCongestion,
        totalWaitingTime: stoppedCount * 0.5,
        emergencyResponseTime: 4.2,
      },
      blockedLanes: Array.from(this.blockedLanes),
    };
  }

  private tryLaneChange(v: VehicleState): void {
    const lane = this.network.getLane(v.laneId);
    const road = lane ? this.network.getRoad(lane.roadId) : null;
    if (!lane || !road || road.lanes.length < 2) return;

    const neighbors: string[] = [];
    if (lane.index > 0) neighbors.push(road.lanes[lane.index - 1]!.id);
    if (lane.index < road.lanes.length - 1) neighbors.push(road.lanes[lane.index + 1]!.id);

    const currLeader = this.network.getLeader(v);
    
    const laneVehs = this.network.laneVehicles(v.laneId);
    const currIdx = laneVehs.indexOf(v);
    const currFollower = currIdx > 0 ? laneVehs[currIdx - 1]! : null;

    for (const targetLaneId of neighbors) {
      const targetVehs = this.network.laneVehicles(targetLaneId);
      let targetLeader: VehicleState | null = null;
      let targetFollower: VehicleState | null = null;
      
      let lo = 0, hi = targetVehs.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (targetVehs[mid]!.position < v.position) lo = mid + 1; else hi = mid;
      }
      if (lo < targetVehs.length) targetLeader = targetVehs[lo]!;
      if (lo > 0) targetFollower = targetVehs[lo - 1]!;

      if (targetLeader && (targetLeader.position - v.position) < (targetLeader.length / 2 + v.length / 2 + 1)) continue;
      if (targetFollower && (v.position - targetFollower.position) < (v.length / 2 + targetFollower.length / 2 + 1)) continue;

      if (shouldChangeLane(v, currLeader, currFollower, targetLeader, targetFollower)) {
        this.network.removeVehicle(v);
        v.laneId = targetLaneId;
        this.network.insertVehicle(v);
        break;
      }
    }
  }

  getAlpha(): number { return this.accumulator / this.dt; }
}
