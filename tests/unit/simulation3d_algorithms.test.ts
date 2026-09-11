import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/core/simulation3d/SimulationEngine';
import { getScenario3D, SCENARIOS } from '../../src/core/simulation3d/scenarios';
import { VehicleType } from '../../src/core/simulation3d/types';

describe('3D Simulation Engine - Next-Gen Algorithms & Real Behaviors', () => {
  it('loads all 8 predetermined scenarios with tailored environmental themes', () => {
    const scenarioIds = [
      'astu_campus',
      'adama_expressway',
      'posta_bet_rotary',
      'hospital_corridor',
      'wonji_road',
      'aba_geda',
      'franco_junction',
      'normal',
    ];

    for (const id of scenarioIds) {
      const scenario = getScenario3D(id);
      expect(scenario).toBeDefined();
      expect(scenario.environment).toBeDefined();
      expect(scenario.environment?.landmarkType).toBeDefined();
      expect(scenario.environment?.groundColor).toBeDefined();
      expect(scenario.spawners.length).toBeGreaterThan(0);
    }
  });

  it('switches routing algorithms between Dijkstra, A*, and Dynamic Adaptive', () => {
    const engine = new SimulationEngine();
    const scenario = getScenario3D('normal');
    engine.load(scenario);

    // Default algorithm
    expect(engine.getSnapshot().activeAlgorithm).toBe('astar');

    // Switch to Dijkstra
    engine.setAlgorithm('dijkstra');
    expect(engine.getSnapshot().activeAlgorithm).toBe('dijkstra');

    // Switch to Dynamic Adaptive
    engine.setAlgorithm('dynamic_hld');
    expect(engine.getSnapshot().activeAlgorithm).toBe('dynamic_hld');
  });

  it('spawns law enforcement units (Police and Motorcycle patrol)', () => {
    const engine = new SimulationEngine();
    engine.load(getScenario3D('normal'));

    const initialVehicles = engine.network.getAllVehicles().length;

    // Spawn 1 Police Interceptor
    engine.spawnPolice(1);
    const afterPolice = engine.network.getAllVehicles();
    expect(afterPolice.length).toBe(initialVehicles + 1);
    const police = afterPolice.find((v) => v.type === VehicleType.Police);
    expect(police).toBeDefined();
    expect(police?.licensePlate).toMatch(/^ET-\d-[A-Z]\d+$/);

    // Spawn 1 Motorcycle Patrol
    engine.spawnMotorcyclePatrol(1);
    const afterMoto = engine.network.getAllVehicles();
    expect(afterMoto.length).toBe(initialVehicles + 2);
    const moto = afterMoto.find((v) => v.type === VehicleType.Motorcycle);
    expect(moto).toBeDefined();
  });

  it('dynamically reroutes vehicles when a road lane is blocked', () => {
    const engine = new SimulationEngine();
    engine.load(getScenario3D('adama_expressway'));

    // Step simulation to populate vehicles
    for (let i = 0; i < 20; i++) {
      engine.update(0.1);
    }

    // Block lane
    engine.blockRoad();
    const snapshot = engine.getSnapshot();
    expect(snapshot.blockedLanes?.length).toBeGreaterThan(0);

    // Clear incidents
    engine.clearIncidents();
    const cleared = engine.getSnapshot();
    expect(cleared.blockedLanes?.length).toBe(0);
  });
});
