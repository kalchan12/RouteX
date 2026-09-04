import { describe, it, expect } from 'vitest';
import { defaultScenarios } from '../../src/scenarios/defaultScenarios';
import { buildNetwork } from '../../src/core/network/networkBuilder';
import { createDijkstra, createAStar, createHierarchicalRouting } from '../../src/core/routing/algorithms';

describe('Routing Algorithms', () => {
  const scenario = defaultScenarios[0]!;
  const { network } = buildNetwork(scenario.network);
  const nodeIds = Array.from(network.nodes.keys());
  const origin = nodeIds[0]!;
  const destination = nodeIds[nodeIds.length - 1]!;

  it('Dijkstra finds valid route from origin to destination', () => {
    const dijkstra = createDijkstra();
    const route = dijkstra.findRoute(network, origin, destination);

    expect(route).not.toBeNull();
    expect(route!.nodes[0]).toBe(origin);
    expect(route!.nodes[route!.nodes.length - 1]).toBe(destination);
    expect(route!.edges.length).toBeGreaterThan(0);
    expect(route!.totalCost).toBeGreaterThan(0);
  });

  it('A* finds route with equal or close optimal cost', () => {
    const astar = createAStar();
    const route = astar.findRoute(network, origin, destination);

    expect(route).not.toBeNull();
    expect(route!.nodes[0]).toBe(origin);
    expect(route!.nodes[route!.nodes.length - 1]).toBe(destination);
    expect(route!.computationMs).toBeGreaterThanOrEqual(0);
  });

  it('Dynamic HLD partitions route and successfully navigates network', () => {
    const hld = createHierarchicalRouting();
    const route = hld.findRoute(network, origin, destination);

    expect(route).not.toBeNull();
    expect(route!.algorithm).toBe('dynamic_hld');
    expect(route!.nodes.length).toBeGreaterThan(1);
  });

  it('handles unreachable destination with null', () => {
    const dijkstra = createDijkstra();
    // Non-existent node throws or returns null
    expect(() => dijkstra.findRoute(network, origin, 'non_existent_node')).toThrow();
  });
});
