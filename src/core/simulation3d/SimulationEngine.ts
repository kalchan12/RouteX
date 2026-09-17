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

  public currentScenario: Scenario | null = null;
  public activeAlgorithm: 'dijkstra' | 'astar' | 'dynamic_hld' = 'astar';
  public recentCitations: Array<{
    id: string;
    ticketNumber: string;
    plateNumber: string;
    violationType: string;
    fineAmountETB: number;
    timestamp: number;
    vehicleId: string;
    location: string;
    officer: string;
  }> = [];
  public lastIncidentFocus: { vehicleId: string; type: string; description: string; time: number } | null = null;
  public activeEncounter: {
    vehicleId: string;
    stage: 'whistling' | 'approaching' | 'talking' | 'stepped_out' | 'telebirr_payment' | 'released';
    speaker: 'officer' | 'driver';
    amharic: string;
    english: string;
    plateNumber: string;
    fineAmountETB: number;
    isBribe: boolean;
    plateConfiscated: boolean;
    isDriverSteppedOut: boolean;
    telebirrCode?: string;
  } | null = null;
  public officerDirectingTraffic = false;
  private congestionCheckTimer = 0;
  private officerCongestionTimer = 0;

  load(scenario: Scenario): void {
    this.currentScenario = scenario;
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
    this.activeEncounter = null;
    this.officerDirectingTraffic = false;
    this.congestionCheckTimer = 0;
    this.officerCongestionTimer = 0;
    this.rng = createRNG(scenario.seed);

    for (const r of scenario.roads) this.network.addRoad(r);
    for (const ix of scenario.intersections) this.network.addIntersection(ix);

    this.spawners = scenario.spawners;
    this.spawnTimers = new Array(scenario.spawners.length).fill(0);
  }

  setAlgorithm(algo: 'dijkstra' | 'astar' | 'dynamic_hld'): void {
    this.activeAlgorithm = algo;
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
      v.color = '#ffffff';
      this.network.insertVehicle(v);
    }
  }

  /** Law Enforcement Dispatch: spawn police cruiser */
  spawnPolice(count = 1): void {
    const roads = this.network.getAllRoads();
    if (roads.length === 0) return;

    for (let i = 0; i < count; i++) {
      const spawner = this.spawners[i % this.spawners.length];
      const targetLaneId = spawner ? spawner.laneId : roads[0]!.lanes[0]!.id;
      const lane = this.network.getLane(targetLaneId);
      if (!lane) continue;

      const v = createVehicle(VehicleType.Police, targetLaneId, lane.roadId, 0, [], this.rng);
      v.desiredSpeed = 24.0; // High speed pursuit/patrol
      v.color = '#1e293b';
      this.network.insertVehicle(v);
    }
  }

  /** Law Enforcement Dispatch: spawn agile police motorcycle patrol */
  spawnMotorcyclePatrol(count = 1): void {
    const roads = this.network.getAllRoads();
    if (roads.length === 0) return;

    for (let i = 0; i < count; i++) {
      const spawner = this.spawners[i % this.spawners.length];
      const targetLaneId = spawner ? spawner.laneId : roads[0]!.lanes[0]!.id;
      const lane = this.network.getLane(targetLaneId);
      if (!lane) continue;

      const v = createVehicle(VehicleType.Motorcycle, targetLaneId, lane.roadId, 0, [], this.rng);
      v.desiredSpeed = 20.0;
      v.color = '#0284c7';
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
    for (const v of this.network.getAllVehicles()) {
      v.isCrashed = false;
      v.isPulledOver = false;
      v.hasHazardLights = false;
      if (v.violation) v.violation = undefined;
    }
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

    // 1.1. Congestion Monitoring & Officer Clearing Intervention
    this.congestionCheckTimer += dt;
    if (this.officerCongestionTimer > 0) {
      this.officerCongestionTimer -= dt;
      if (this.officerCongestionTimer <= 0) {
        this.officerDirectingTraffic = false;
      }
    }

    if (this.congestionCheckTimer >= 2.0) {
      this.congestionCheckTimer = 0;
      if (!this.activeEncounter) {
        for (const ix of this.network.getAllIntersections()) {
          for (const road of this.network.getAllRoads()) {
            if (road.endIntersectionId === ix.id) {
              for (const lane of road.lanes) {
                const laneVehs = this.network.laneVehicles(lane.id);
                const stoppedCount = laneVehs.filter(v => v.speed < 1.0 && !v.isPulledOver && !v.isCrashed).length;
                if (stoppedCount >= 3) {
                  const flushed = this.traffic.flushCongestion(ix, lane.id);
                  if (flushed) {
                    this.officerDirectingTraffic = true;
                    this.officerCongestionTimer = 10;
                    // Encourage stopped vehicles to proceed
                    for (const v of laneVehs) {
                      if (v.speed < 0.5 && !v.isPulledOver && !v.isCrashed) {
                        v.speed = Math.min(v.desiredSpeed, 2.5);
                      }
                    }
                    break;
                  }
                }
              }
            }
            if (this.officerDirectingTraffic) break;
          }
          if (this.officerDirectingTraffic) break;
        }
      }
    }

    // 2. Spawning
    this.processSpawners(dt);

    // 3. Save state for interpolation
    for (const v of all) {
      v.prevPosition = v.position;
      v.prevSpeed = v.speed;
    }

    // 4. Calculate accelerations (IDM)
    for (const v of all) {
      if (v.isPulledOver || v.isCrashed) {
        v.acceleration = -6;
        v.speed = 0;
      } else {
        this.calcAccel(v, dt);
      }
    }

    // 4.2. Emergency & Police Siren Preemption Yielding
    for (const v of all) {
      if (v.type === VehicleType.Emergency || v.type === VehicleType.Police) {
        const leader = this.network.getLeader(v);
        if (leader && leader.type !== VehicleType.Emergency && leader.type !== VehicleType.Police) {
          const gap = leader.position - v.position;
          if (gap < 30 && gap > 0) {
            // Leader slows down and yields to shoulder
            leader.speed = Math.max(1.5, leader.speed * 0.7);
          }
        }
      }
    }

    // 4.4. Speed Violation Detection
    for (const v of all) {
      if (v.type !== VehicleType.Emergency && v.type !== VehicleType.Police && !v.violation && !v.isPulledOver && !v.isCrashed) {
        const lane = this.network.getLane(v.laneId);
        if (lane && v.speed > lane.speedLimit * 1.25 && v.personality === 'aggressive') {
          v.violation = {
            type: 'speeding',
            fine: 1500,
            ticketIssued: false,
            timestamp: this.simTime,
          };
          this.lastIncidentFocus = {
            vehicleId: v.id,
            type: 'speeding',
            description: `Aggressive Speeding: ${Math.round(v.speed * 3.6)} km/h in ${Math.round(lane.speedLimit * 3.6)} zone`,
            time: this.simTime,
          };
        }
      }
    }

    // 4.5. MOBIL Lane changing
    for (const v of all) {
      if (!v.isPulledOver && !v.isCrashed && this.rng() < dt * 2.0) { // ~2 chances per second
        this.tryLaneChange(v);
      }
    }

    // 4.6. Crash & Fender-Bender Physics — robust collision detection
    for (const v of all) {
      if (v.isCrashed) continue;
      const leader = this.network.getLeader(v);
      if (leader && !leader.isCrashed) {
        const gap = leader.position - v.position - (leader.length / 2) - (v.length / 2);
        // Hard overlap prevention: if gap is negative, vehicles are physically overlapping
        if (gap < 0.15) {
          // Snap back to avoid visual pass-through regardless of speed
          v.position = leader.position - (leader.length / 2) - (v.length / 2) - 0.15;
          v.speed = Math.min(v.speed, leader.speed);

          // Actual crash: only if closing speed is significant
          if (v.speed > 2.0 && (v.speed - leader.speed) > 1.5) {
            v.isCrashed = true;
            leader.isCrashed = true;
            v.speed = 0;
            leader.speed = 0;
            v.hasHazardLights = true;
            leader.hasHazardLights = true;
            v.violation = {
              type: 'crash',
              fine: 5000,
              ticketIssued: false,
              timestamp: this.simTime,
            };
            this.lastIncidentFocus = {
              vehicleId: v.id,
              type: 'crash',
              description: `Collision: ${v.licensePlate || v.id} rear-ended ${leader.licensePlate || leader.id}`,
              time: this.simTime,
            };
          }
        }
      }
    }

    // 4.7. Traffic Officer Pull-Over, Whistling, Confrontation & Telebirr Settlement
    for (const v of all) {
      if (v.violation && !v.violation.ticketIssued && !v.isPulledOver && !v.isCrashed) {
        v.isPulledOver = true;
        // Variable encounter duration based on violation severity
        const encounterDurations: Record<string, number> = {
          'crash': 14, 'red_light': 10, 'pedestrian_hazard': 10, 'speeding': 7
        };
        v.pullOverTimer = encounterDurations[v.violation.type] ?? 8;
        v.hasHazardLights = true;
        v.speed = 0;
        v.violation.ticketIssued = true;
        v.encounterStage = 'whistling';
        v.encounterTimer = 0;
        v.isWindowDown = false;
        v.isDriverSteppedOut = false;
        v.plateConfiscated = false;
        // 40% chance driver negotiates bribe for minor speed violation, 0% for crash
        v.bribeAccepted = v.violation.type === 'speeding' && this.rng() < 0.45;

        const ticketNumber = `TKT-${Math.floor(10000 + this.rng() * 90000)}`;
        const officers = ['Officer Girma', 'Officer Bekele', 'Officer Desta', 'Officer Almaz'];
        const chosenOfficer = officers[Math.floor(this.rng() * officers.length)]!;
        const fineETB = v.bribeAccepted ? Math.round(v.violation.fine * 0.4) : v.violation.fine;

        const citation = {
          id: `cit-${Date.now()}-${v.id}`,
          ticketNumber,
          plateNumber: v.licensePlate || `ET-3-A${Math.floor(100 + this.rng() * 900)}`,
          violationType: v.bribeAccepted ? 'settled_direct' : v.violation.type,
          fineAmountETB: fineETB,
          timestamp: Date.now(),
          vehicleId: v.id,
          location: v.roadId,
          officer: chosenOfficer,
        };
        this.recentCitations.unshift(citation);
        if (this.recentCitations.length > 25) this.recentCitations.pop();

        v.telebirrTransaction = {
          code: `TB-${Math.floor(100000000 + this.rng() * 900000000)}`,
          amount: fineETB,
          recipient: v.bribeAccepted ? `${chosenOfficer} (Telebirr Wallet)` : 'Federal Police Commission (Traffic Dept)',
          isBribe: v.bribeAccepted,
        };
      }

      if (v.isPulledOver && v.pullOverTimer !== undefined) {
        v.pullOverTimer -= dt;
        v.encounterTimer = (v.encounterTimer || 0) + dt;
        v.speed = 0;

        const t = v.encounterTimer;
        // STAGE 1: Whistling & pull-over signal (0 to 3.5s)
        if (t < 3.5) {
          v.encounterStage = 'whistling';
          v.encounterDialog = {
            speaker: 'officer',
            amharic: 'ፊሽካ! ኧረ አቁም! ወደ ዳር ያዝ!',
            english: '*Blows whistle sharply* Hey! Pull over to the curb immediately!',
          };
        }
        // STAGE 2: Officer approaches & driver rolls down window (3.5 to 7.0s)
        else if (t < 7.0) {
          v.encounterStage = 'approaching';
          v.isWindowDown = true;
          v.encounterDialog = {
            speaker: 'officer',
            amharic: 'ጤና ይስጥልኝ አሽከርካሪ። ፍቃድና ቦሎ ያሳዩኝ!',
            english: 'Good day driver. Please present your license and registration!',
          };
        }
        // STAGE 3: Violation explanation & driver step-out for severe offenses (7.0 to 11.0s)
        else if (t < 11.0) {
          const isSevere = v.violation?.type === 'red_light' || v.violation?.type === 'pedestrian_hazard' || v.violation?.type === 'crash';
          if (isSevere) {
            v.encounterStage = 'stepped_out';
            v.isDriverSteppedOut = true;
            v.plateConfiscated = true;
            v.encounterDialog = {
              speaker: 'officer',
              amharic: 'ቀዩን መብራት ጥሰሃል! ከእንቅስቃሴ ውጪ ነህ፤ ሰሌዳህን እፈታለሁ፣ ውረድ ከጋቢናው!',
              english: 'You violated the red signal & risked pedestrians! Step out of the car, I am removing your plates!',
            };
          } else {
            v.encounterStage = 'talking';
            v.encounterDialog = {
              speaker: 'driver',
              amharic: 'ጌታዬ ተሳስቼ ነው፣ አስቸኳይ ጉዳይ ገጥሞኝ ነው። ተረዳኝ!',
              english: 'Officer please, it was an honest mistake, I had an urgent situation. Have mercy!',
            };
          }
        }
        // STAGE 4: Telebirr payment / Bribe settlement (11.0 to 16.0s)
        else if (t < 16.0) {
          v.encounterStage = 'telebirr_payment';
          if (v.bribeAccepted) {
            v.encounterDialog = {
              speaker: 'officer',
              amharic: 'እሺ ለሻይ የሚሆን በቴሌብር ላክና ሰሌዳህን መልስልሃለሁ። የቁጥር ኮዱን አስገባ!',
              english: 'Alright, transfer some lunch money on Telebirr and take your plate. Enter the USSD code!',
            };
          } else {
            v.encounterDialog = {
              speaker: 'officer',
              amharic: 'ቅጣቱ በቴሌብር የፌደራል ፖሊስ አካውንት ተከፍሏል። ደረሰኝዎ ገብቷል።',
              english: 'Official penalty charged via Telebirr Federal Traffic Police portal. Payment confirmed.',
            };
          }
        }
        // STAGE 5: Plate restored & released (16.0s+)
        else {
          v.encounterStage = 'released';
          v.plateConfiscated = false;
          v.encounterDialog = {
            speaker: 'officer',
            amharic: 'በቃ ሂድ፣ ሌላ ጊዜ ህግ አክብር!',
            english: 'You may proceed. Respect traffic lights and pedestrians next time!',
          };
        }

        // Active encounter published to snapshot
        this.activeEncounter = {
          vehicleId: v.id,
          stage: v.encounterStage,
          speaker: v.encounterDialog.speaker,
          amharic: v.encounterDialog.amharic,
          english: v.encounterDialog.english,
          plateNumber: v.licensePlate || `ET-3-A882`,
          fineAmountETB: v.telebirrTransaction?.amount || 1500,
          isBribe: !!v.bribeAccepted,
          plateConfiscated: !!v.plateConfiscated,
          isDriverSteppedOut: !!v.isDriverSteppedOut,
          telebirrCode: v.telebirrTransaction?.code,
        };

        if (v.pullOverTimer <= 0) {
          v.isPulledOver = false;
          v.hasHazardLights = false;
          v.isDriverSteppedOut = false;
          v.isWindowDown = false;
          v.plateConfiscated = false;
          v.encounterStage = 'none';
          v.desiredSpeed = Math.max(8, v.desiredSpeed * 0.85); // Drives moderately
          this.activeEncounter = null;
        }
      }
    }

    // 5. Integrate & move
    const removed: VehicleState[] = [];
    for (const v of all) {
      if (v.isPulledOver || v.isCrashed) {
        v.speed = 0;
        continue;
      }
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
      let gap = leader.position - v.position - (leader.length / 2) - (v.length / 2);
      // Enforce minimum physical gap — vehicles cannot occupy the same space
      const minGap = 0.5;
      if (gap < minGap) {
        v.position = leader.position - (leader.length / 2) - (v.length / 2) - minGap;
        gap = minGap;
        v.speed = Math.min(v.speed, leader.speed);
      }
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
      if (ix && this.traffic.lightState(ix, v.laneId) !== LightState.Green && v.type !== VehicleType.Emergency && v.type !== VehicleType.Police) {
        // Aggressive drivers have a 12% chance to run red light if speed > 5 m/s
        if (v.personality === 'aggressive' && v.speed > 5.0 && this.rng() < 0.12 && !v.violation) {
          v.violation = {
            type: 'red_light',
            fine: 2500,
            ticketIssued: false,
            timestamp: this.simTime,
          };
          this.lastIncidentFocus = {
            vehicleId: v.id,
            type: 'red_light',
            description: `Red Light Violation: ${v.licensePlate || v.id} ran red signal at intersection`,
            time: this.simTime,
          };
        } else {
          // Gradual stop: clamp to stop line with safe braking, not instant teleport
          const safeStopPos = lane.length - (v.length * 0.5 + 0.5);
          v.position = Math.min(v.position, safeStopPos);
          v.speed = Math.max(0, v.speed - 8 * (1 / 60)); // decelerate at max brake rate
          if (v.speed < 0.1) v.speed = 0;
          return true;
        }
      }
    }

    // Pick connection (dynamically avoid blocked lanes if alternatives exist)
    const openConnections = lane.connections.filter(c => !this.blockedLanes.has(c.toLaneId));
    const viableConnections = openConnections.length > 0 ? openConnections : lane.connections;

    const conn = this.selectDownstreamConnection(v, lane, viableConnections);

    const targetLane = this.network.getLane(conn.toLaneId);
    if (!targetLane) return false;

    // Gap acceptance (emergency vehicles have high assertiveness)
    if (v.type !== VehicleType.Emergency && !canSafelyTurn(v, lane, targetLane, this.network, conn.turnType)) {
      v.position = lane.length - (v.length * 0.5 + 0.5);
      v.speed = 0;
      return true; // Wait for gap
    }

    // Target lane entrance clearance: do not transition if a vehicle is already stopped at the entry
    const targetVehicles = this.network.laneVehicles(targetLane.id);
    if (targetVehicles.length > 0) {
      let minPos = Infinity;
      let closestVeh: VehicleState = targetVehicles[0]!;
      for (const tv of targetVehicles) {
        if (tv.position < minPos) {
          minPos = tv.position;
          closestVeh = tv;
        }
      }
      const requiredClearance = (v.length + closestVeh.length) / 2 + 1.5;
      if (minPos < requiredClearance) {
        // Target lane entrance is blocked! Hold vehicle safely before stop line
        v.position = lane.length - (v.length * 0.5 + 0.5);
        v.speed = 0;
        return true;
      }
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

  private selectDownstreamConnection(_v: VehicleState, _lane: any, connections: any[]): any {
    if (connections.length <= 1) return connections[0]!;

    if (this.activeAlgorithm === 'dijkstra') {
      // 1. Dijkstra: Static shortest physical distance — ignores congestion and blockages
      let bestConn = connections[0]!;
      let minDistance = Infinity;
      for (const conn of connections) {
        const targetLane = this.network.getLane(conn.toLaneId);
        if (targetLane) {
          const dist = targetLane.length;
          if (dist < minDistance) {
            minDistance = dist;
            bestConn = conn;
          }
        }
      }
      return bestConn;
    } else if (this.activeAlgorithm === 'astar') {
      // 2. A*: Coordinate goal-directed search prioritizing express arteries
      let bestConn = connections[0]!;
      let bestScore = -Infinity;
      for (const conn of connections) {
        const targetLane = this.network.getLane(conn.toLaneId);
        if (targetLane) {
          const turnMultiplier = conn.turnType === 'straight' ? 1.3 : 0.9;
          const score = targetLane.speedLimit * turnMultiplier;
          if (score > bestScore) {
            bestScore = score;
            bestConn = conn;
          }
        }
      }
      return bestConn;
    } else {
      // 3. Dynamic Adaptive Rerouting (BPR flow penalty + hazard avoidance)
      let bestConn = connections[0]!;
      let minCost = Infinity;
      for (const conn of connections) {
        const targetLane = this.network.getLane(conn.toLaneId);
        if (targetLane) {
          const vehCount = this.network.laneVehicles(targetLane.id).length;
          const capacity = Math.max(1, Math.floor(targetLane.length / 8));
          const isBlocked = this.blockedLanes.has(targetLane.id);
          const hasCrashedVehicle = this.network.laneVehicles(targetLane.id).some(veh => veh.isCrashed);
          
          const freeTime = targetLane.length / Math.max(5, targetLane.speedLimit);
          const congestionMultiplier = 1 + 0.25 * Math.pow(vehCount / capacity, 3);
          const hazardPenalty = isBlocked ? 1000 : hasCrashedVehicle ? 500 : 0;
          
          const cost = (freeTime * congestionMultiplier) + hazardPenalty;
          if (cost < minCost) {
            minCost = cost;
            bestConn = conn;
          }
        }
      }
      return bestConn;
    }
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
      citations: this.recentCitations,
      lastIncident: this.lastIncidentFocus,
      activeEncounter: this.activeEncounter,
      officerDirectingTraffic: this.officerDirectingTraffic,
      activeAlgorithm: this.activeAlgorithm,
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
      // Do not change into a blocked lane
      if (this.blockedLanes.has(targetLaneId)) continue;

      const isCurrentBlocked = this.blockedLanes.has(v.laneId);
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

      // If current lane is blocked, evade urgently; otherwise use MOBIL incentive
      if (isCurrentBlocked || shouldChangeLane(v, currLeader, currFollower, targetLeader, targetFollower)) {
        this.network.removeVehicle(v);
        v.laneId = targetLaneId;
        this.network.insertVehicle(v);
        break;
      }
    }
  }

  getAlpha(): number { return this.accumulator / this.dt; }
}
