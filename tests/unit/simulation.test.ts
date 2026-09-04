import { describe, it, expect } from 'vitest';
import { defaultScenarios } from '../../src/scenarios/defaultScenarios';
import { SimulationEngine } from '../../src/core/simulation3d/SimulationEngine';
import { getScenario3D } from '../../src/core/simulation3d/scenarios';
import { idmAcceleration } from '../../src/core/simulation3d/IDM';
import { CAR_PARAMS, EMERGENCY_PARAMS } from '../../src/core/simulation3d/IDM';

describe('Default Scenarios & Topology', () => {
  it('loads 5 default scenarios', () => {
    expect(defaultScenarios).toHaveLength(5);
  });

  it('all scenarios have valid nodes, edges, and rates', () => {
    for (const scenario of defaultScenarios) {
      expect(scenario.network.nodes.length).toBeGreaterThan(0);
      expect(scenario.network.edges.length).toBeGreaterThan(0);
      expect(scenario.duration).toBeGreaterThan(0);
      expect(scenario.vehicleSpawnRate).toBeGreaterThan(0);
    }
  });
});

describe('3D Continuous Simulation Engine', () => {
  it('loads 3D scenario and initializes road network', () => {
    const engine = new SimulationEngine();
    const scenario = getScenario3D('normal');
    engine.load(scenario);

    expect(engine.network.getAllRoads().length).toBeGreaterThan(0);
    expect(engine.network.getAllIntersections().length).toBeGreaterThan(0);
    
    const snap = engine.getSnapshot();
    expect(snap.isRunning).toBe(false);
    expect(snap.vehicleCount).toBe(0);
    expect(snap.simTime).toBe(0);
  });

  it('steps forward and spawns 3D vehicles with IDM kinematics', () => {
    const engine = new SimulationEngine();
    engine.load(getScenario3D('normal'));
    engine.start();

    // Advance 5 seconds of physics (300 steps at 60Hz)
    for (let i = 0; i < 300; i++) {
      engine.update(1 / 60);
    }

    const snap = engine.getSnapshot();
    expect(snap.simTime).toBeGreaterThan(4.5);
    expect(snap.vehicleCount).toBeGreaterThan(0);
    expect(snap.vehicles.length).toBe(snap.vehicleCount);
    expect(snap.metrics.avgSpeed).toBeGreaterThan(0);

    // Verify vehicle properties
    const firstVeh = snap.vehicles[0]!;
    expect(firstVeh.id).toBeDefined();
    expect(firstVeh.speed).toBeGreaterThan(0);
    expect(firstVeh.laneId).toBeDefined();
  });

  it('pauses and resets cleanly', () => {
    const engine = new SimulationEngine();
    engine.load(getScenario3D('normal'));
    engine.start();

    for (let i = 0; i < 60; i++) {
      engine.update(1 / 60);
    }

    expect(engine.getSnapshot().isRunning).toBe(true);

    engine.pause();
    expect(engine.getSnapshot().isRunning).toBe(false);

    engine.reset();
    expect(engine.getSnapshot().vehicleCount).toBe(0);
    expect(engine.getSnapshot().simTime).toBe(0);
  });

  it('supports dynamic incident injection (block road and emergency vehicle)', () => {
    const engine = new SimulationEngine();
    engine.load(getScenario3D('normal'));
    engine.start();

    engine.blockRoad('e-in-0');
    expect(engine.blockedLanes.has('e-in-0')).toBe(true);

    engine.spawnEmergency(2);
    const snap = engine.getSnapshot();
    const emergencyVehicles = snap.vehicles.filter(v => v.type === 'emergency');
    expect(emergencyVehicles.length).toBeGreaterThanOrEqual(1);

    engine.clearIncidents();
    expect(engine.blockedLanes.size).toBe(0);
  });
});

describe('IDM Physics Model', () => {
  it('accelerates free vehicles toward desired speed', () => {
    // Current speed 0, desired speed 13.9, no leader
    const accel = idmAcceleration(0, CAR_PARAMS.desiredSpeed, 1000, 0, CAR_PARAMS);
    expect(accel).toBeCloseTo(CAR_PARAMS.maxAccel, 1);
  });

  it('decelerates heavily when closing on a slow leader', () => {
    // Current speed 13.9, gap 5m (very close), dv 10m/s closing fast
    const accel = idmAcceleration(13.9, CAR_PARAMS.desiredSpeed, 5, 10, CAR_PARAMS);
    expect(accel).toBeLessThan(-2.0);
  });

  it('emergency params provide higher top speed and acceleration', () => {
    expect(EMERGENCY_PARAMS.desiredSpeed).toBeGreaterThan(CAR_PARAMS.desiredSpeed);
    expect(EMERGENCY_PARAMS.maxAccel).toBeGreaterThan(CAR_PARAMS.maxAccel);
  });
});
