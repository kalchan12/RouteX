import { RoadNetwork, Node, Road } from '../../types';
import { updateRoadDynamicState, isTraversable } from './edge';

export function createRoadNetwork(): RoadNetwork {
  return {
    nodes: new Map(),
    edges: new Map(),
    adjacency: new Map(),
    incoming: new Map(),
  };
}

export function addNode(network: RoadNetwork, node: Node): void {
  if (network.nodes.has(node.id)) {
    throw new Error(`node ${node.id} already exists`);
  }
  network.nodes.set(node.id, node);
  network.adjacency.set(node.id, []);
  network.incoming.set(node.id, []);
}

export function addRoad(network: RoadNetwork, road: Road): void {
  if (network.edges.has(road.id)) {
    throw new Error(`road ${road.id} already exists`);
  }
  if (!network.nodes.has(road.source) || !network.nodes.has(road.destination)) {
    throw new Error(`road ${road.id}: source/destination nodes must exist`);
  }
  network.edges.set(road.id, road);
  network.adjacency.get(road.source)!.push(road.id);
  network.incoming.get(road.destination)!.push(road.id);
}

export function getNode(network: RoadNetwork, nodeId: string): Node {
  const node = network.nodes.get(nodeId);
  if (!node) throw new Error(`node ${nodeId} not found`);
  return node;
}

export function getRoad(network: RoadNetwork, edgeId: string): Road {
  const road = network.edges.get(edgeId);
  if (!road) throw new Error(`road ${edgeId} not found`);
  return road;
}

export function nodeCount(network: RoadNetwork): number {
  return network.nodes.size;
}

export function edgeCount(network: RoadNetwork): number {
  return network.edges.size;
}

export function outgoingEdges(network: RoadNetwork, nodeId: string): string[] {
  return network.adjacency.get(nodeId) ?? [];
}

export function incomingEdges(network: RoadNetwork, nodeId: string): string[] {
  return network.incoming.get(nodeId) ?? [];
}

export function* neighbors(network: RoadNetwork, nodeId: string): Generator<[string, string]> {
  for (const edgeId of network.adjacency.get(nodeId) ?? []) {
    const road = network.edges.get(edgeId)!;
    if (isTraversable(road)) {
      yield [road.destination, edgeId];
    }
  }
}

export function edgeBetween(network: RoadNetwork, source: string, destination: string): Road | null {
  for (const edgeId of network.adjacency.get(source) ?? []) {
    const road = network.edges.get(edgeId)!;
    if (road.destination === destination) return road;
  }
  return null;
}

export function nodesOfType(network: RoadNetwork, type: Node['type']): Node[] {
  const result: Node[] = [];
  for (const node of network.nodes.values()) {
    if (node.type === type) result.push(node);
  }
  return result;
}

export function roadSummary(network: RoadNetwork): { nodes: number; edges: number; closed: number } {
  let closed = 0;
  for (const road of network.edges.values()) {
    if (!isTraversable(road)) closed++;
  }
  return { nodes: network.nodes.size, edges: network.edges.size, closed };
}

export function refreshDynamicState(network: RoadNetwork, vehicleCounts: Map<string, number>): void {
  for (const [roadId, road] of network.edges) {
    const count = vehicleCounts.get(roadId) ?? 0;
    updateRoadDynamicState(road, count);
  }
}

export interface NetworkValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateNetwork(network: RoadNetwork): NetworkValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (network.nodes.size === 0) {
    errors.push('Network must contain at least one node');
  }
  if (network.edges.size === 0) {
    errors.push('Network must contain at least one edge');
  }

  // Check each node
  for (const [nodeId, node] of network.nodes) {
    if (!node.id || typeof node.x !== 'number' || typeof node.y !== 'number') {
      errors.push(`Invalid node definition for node ${nodeId}`);
    }
    const outEdges = network.adjacency.get(nodeId) ?? [];
    const inEdges = network.incoming.get(nodeId) ?? [];
    if (outEdges.length === 0 && inEdges.length === 0) {
      warnings.push(`Node ${nodeId} is isolated (no incoming or outgoing edges)`);
    }
  }

  // Check each edge
  for (const [edgeId, road] of network.edges) {
    if (!network.nodes.has(road.source)) {
      errors.push(`Road ${edgeId} references non-existent source node: ${road.source}`);
    }
    if (!network.nodes.has(road.destination)) {
      errors.push(`Road ${edgeId} references non-existent destination node: ${road.destination}`);
    }
    if (road.distance <= 0) {
      errors.push(`Road ${edgeId} has invalid distance: ${road.distance} (must be > 0)`);
    }
    if (road.speedLimit <= 0) {
      errors.push(`Road ${edgeId} has invalid speedLimit: ${road.speedLimit} (must be > 0)`);
    }
    if (road.capacity <= 0) {
      errors.push(`Road ${edgeId} has invalid capacity: ${road.capacity} (must be > 0)`);
    }
    if (road.lanes < 1) {
      errors.push(`Road ${edgeId} has invalid lane count: ${road.lanes} (must be >= 1)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}