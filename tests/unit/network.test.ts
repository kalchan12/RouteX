import { describe, it, expect } from 'vitest';
import {
  createRoadNetwork,
  addNode,
  addRoad,
  validateNetwork,
  neighbors,
  roadSummary,
  refreshDynamicState,
} from '../../src/core/network';
import { createNode } from '../../src/core/network/node';
import { createRoad } from '../../src/core/network/edge';
import { RoadStatus } from '../../src/types';

describe('Network Model & Graph Topology', () => {
  it('creates an empty road network', () => {
    const net = createRoadNetwork();
    expect(net.nodes.size).toBe(0);
    expect(net.edges.size).toBe(0);
    const validation = validateNetwork(net);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Network must contain at least one node');
  });

  it('adds nodes and roads correctly and validates successfully', () => {
    const net = createRoadNetwork();
    const n1 = createNode('n1', 0, 0);
    const n2 = createNode('n2', 100, 0);
    addNode(net, n1);
    addNode(net, n2);

    const road = createRoad({
      id: 'r1',
      source: 'n1',
      destination: 'n2',
      distance: 100,
      speedLimit: 15,
      capacity: 50,
      lanes: 2,
    });
    addRoad(net, road);

    const validation = validateNetwork(net);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const summary = roadSummary(net);
    expect(summary.nodes).toBe(2);
    expect(summary.edges).toBe(1);
    expect(summary.closed).toBe(0);
  });

  it('flags isolated nodes as warnings', () => {
    const net = createRoadNetwork();
    const n1 = createNode('n1', 0, 0);
    const n2 = createNode('n2', 100, 0);
    const isolated = createNode('n3_isolated', 50, 50);
    addNode(net, n1);
    addNode(net, n2);
    addNode(net, isolated);

    addRoad(net, createRoad({
      id: 'r1',
      source: 'n1',
      destination: 'n2',
      distance: 100,
      speedLimit: 15,
      capacity: 50,
    }));

    const validation = validateNetwork(net);
    expect(validation.valid).toBe(true);
    expect(validation.warnings.some(w => w.includes('n3_isolated'))).toBe(true);
  });

  it('rejects roads with missing source or destination node during addition', () => {
    const net = createRoadNetwork();
    const n1 = createNode('n1', 0, 0);
    addNode(net, n1);

    expect(() => {
      addRoad(net, createRoad({
        id: 'r_invalid',
        source: 'n1',
        destination: 'n_missing',
        distance: 100,
        speedLimit: 15,
        capacity: 50,
      }));
    }).toThrow(/source\/destination nodes must exist/);
  });

  it('correctly filters non-traversable roads in neighbors generator', () => {
    const net = createRoadNetwork();
    addNode(net, createNode('n1', 0, 0));
    addNode(net, createNode('n2', 100, 0));
    addNode(net, createNode('n3', 0, 100));

    addRoad(net, createRoad({
      id: 'r_open',
      source: 'n1',
      destination: 'n2',
      distance: 100,
      speedLimit: 15,
      capacity: 50,
      status: RoadStatus.OPEN,
    }));

    addRoad(net, createRoad({
      id: 'r_closed',
      source: 'n1',
      destination: 'n3',
      distance: 100,
      speedLimit: 15,
      capacity: 50,
      status: RoadStatus.CLOSED,
    }));

    const nextNodes = Array.from(neighbors(net, 'n1')).map(([nodeId]) => nodeId);
    expect(nextNodes).toContain('n2');
    expect(nextNodes).not.toContain('n3');

    const summary = roadSummary(net);
    expect(summary.closed).toBe(1);
  });

  it('updates dynamic state when vehicle counts change', () => {
    const net = createRoadNetwork();
    addNode(net, createNode('n1', 0, 0));
    addNode(net, createNode('n2', 100, 0));
    const road = createRoad({
      id: 'r1',
      source: 'n1',
      destination: 'n2',
      distance: 1000,
      speedLimit: 20,
      capacity: 10,
    });
    addRoad(net, road);

    const initialTime = road.currentTravelTime;
    // Inject heavy traffic exceeding capacity
    const counts = new Map([['r1', 25]]);
    refreshDynamicState(net, counts);

    expect(road.currentTravelTime).toBeGreaterThan(initialTime);
    expect(road.congestion).toBeGreaterThan(0.5);
  });
});
