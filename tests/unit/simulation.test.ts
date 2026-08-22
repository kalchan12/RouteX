import { describe, it, expect } from 'vitest';
import { defaultScenarios } from '../../src/scenarios/defaultScenarios';
import { SimulationEngine } from '../../src/core/simulation/engine';
import { SimulationStatus } from '../../src/types';

describe('Default Scenarios', () => {
  it('loads 5 default scenarios', () => {
    expect(defaultScenarios).toHaveLength(5);
  });

  it('all scenarios have valid nodes and edges', () => {
    for (const scenario of defaultScenarios) {
      expect(scenario.network.nodes.length).toBeGreaterThan(0);
      expect(scenario.network.edges.length).toBeGreaterThan(0);
      expect(scenario.duration).toBeGreaterThan(0);
      expect(scenario.vehicleSpawnRate).toBeGreaterThan(0);
    }
  });
});

describe('SimulationEngine in Browser', () => {
  it('initializes and produces an initial snapshot with network', () => {
    const scenario = defaultScenarios[0];
    const engine = new SimulationEngine({ scenario });

    expect(engine.getStatus()).toBe(SimulationStatus.PENDING);
    expect(engine.getTick()).toBe(0);

    const snap = engine.snapshot();
    expect(snap.network.nodes.length).toBe(scenario.network.nodes.length);
    expect(snap.network.edges.length).toBe(scenario.network.edges.length);
    expect(snap.vehicles).toEqual([]);
    expect(snap.metrics.avgCongestion).toBe(0);
  });

  it('steps and spawns vehicles properly', () => {
    const scenario = defaultScenarios[0];
    const engine = new SimulationEngine({ scenario });

    engine.start();
    expect(engine.getStatus()).toBe(SimulationStatus.RUNNING);

    for (let i = 0; i < 10; i++) {
      engine.step();
    }

    expect(engine.getTick()).toBe(10);
    const snap = engine.snapshot();
    expect(snap.tick).toBe(10);
    expect(snap.vehicleCount).toBeGreaterThan(0);
  });

  it('pauses and rebuilds/resets correctly', () => {
    const scenario = defaultScenarios[0];
    const engine = new SimulationEngine({ scenario });

    engine.start();
    engine.step();
    engine.pause();
    expect(engine.getStatus()).toBe(SimulationStatus.PAUSED);

    engine.rebuild();
    expect(engine.getStatus()).toBe(SimulationStatus.PENDING);
    expect(engine.getTick()).toBe(0);
  });
});