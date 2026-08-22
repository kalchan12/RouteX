import { RoadNetwork, Road, Route, CostFunction } from '../shared/types';
import { getRoad, neighbors, isTraversable } from '../network';

export interface RoutingAlgorithm {
  name: string;
  description: string;
  findRoute(network: RoadNetwork, origin: string, destination: string, cost?: CostFunction): Route | null;
}

export function defaultCost(road: Road): number {
  if (!isTraversable(road)) return Infinity;
  return road.currentTravelTime;
}

export function createDijkstra(): RoutingAlgorithm {
  return {
    name: 'dijkstra',
    description: "Dijkstra's algorithm — classic non-heuristic shortest path using current dynamic travel times as edge costs.",
    findRoute(network: RoadNetwork, origin: string, destination: string, cost: CostFunction = defaultCost): Route | null {
      if (!network.nodes.has(origin) || !network.nodes.has(destination)) {
        throw new Error(`unknown node in route request: ${origin} -> ${destination}`);
      }

      const start = performance.now();
      const dist = new Map<string, number>([[origin, 0]]);
      const prev = new Map<string, { node: string; edge: string }>();
      const heap: Array<[number, string]> = [[0, origin]];
      const visited = new Set<string>();

      while (heap.length > 0) {
        heap.sort((a, b) => a[0] - b[0]);
        const [currentDist, nodeId] = heap.shift()!;
        
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        if (nodeId === destination) break;

        for (const [neighborId, edgeId] of neighbors(network, nodeId)) {
          const edgeCost = cost(getRoad(network, edgeId));
          if (edgeCost === Infinity) continue;
          
          const candidate = currentDist + edgeCost;
          if (candidate < (dist.get(neighborId) ?? Infinity)) {
            dist.set(neighborId, candidate);
            prev.set(neighborId, { node: nodeId, edge: edgeId });
            heap.push([candidate, neighborId]);
          }
        }
      }

      if (!dist.has(destination)) return null;

      const nodes: string[] = [destination];
      const edges: string[] = [];
      let current = destination;
      
      while (current !== origin) {
        const { node, edge } = prev.get(current)!;
        edges.push(edge);
        nodes.push(node);
        current = node;
      }
      
      nodes.reverse();
      edges.reverse();

      return {
        nodes,
        edges,
        totalCost: dist.get(destination)!,
        computationMs: performance.now() - start,
        algorithm: 'dijkstra',
      };
    },
  };
}

export function createAStar(): RoutingAlgorithm {
  return {
    name: 'astar',
    description: 'A* algorithm with Euclidean distance heuristic — faster than Dijkstra for long routes.',
    findRoute(network: RoadNetwork, origin: string, destination: string, cost: CostFunction = defaultCost): Route | null {
      if (!network.nodes.has(origin) || !network.nodes.has(destination)) {
        throw new Error(`unknown node in route request: ${origin} -> ${destination}`);
      }

      const start = performance.now();
      const destNode = network.nodes.get(destination)!;
      
      const gScore = new Map<string, number>([[origin, 0]]);
      const fScore = new Map<string, number>([[origin, heuristic(origin, destination, network)]]);
      const prev = new Map<string, { node: string; edge: string }>();
      
      const openSet = new Set<string>([origin]);
      const closedSet = new Set<string>();

      while (openSet.size > 0) {
        let current: string | null = null;
        let lowestF = Infinity;
        
        for (const nodeId of openSet) {
          const f = fScore.get(nodeId) ?? Infinity;
          if (f < lowestF) {
            lowestF = f;
            current = nodeId;
          }
        }

        if (!current) break;
        if (current === destination) break;

        openSet.delete(current);
        closedSet.add(current);

        for (const [neighborId, edgeId] of neighbors(network, current)) {
          if (closedSet.has(neighborId)) continue;

          const edge = getRoad(network, edgeId);
          const edgeCost = cost(edge);
          if (edgeCost === Infinity) continue;

          const tentativeG = (gScore.get(current) ?? Infinity) + edgeCost;
          
          if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
            prev.set(neighborId, { node: current, edge: edgeId });
            gScore.set(neighborId, tentativeG);
            fScore.set(neighborId, tentativeG + heuristic(neighborId, destination, network));
            openSet.add(neighborId);
          }
        }
      }

      if (!gScore.has(destination)) return null;

      const nodes: string[] = [destination];
      const edges: string[] = [];
      let current = destination;
      
      while (current !== origin) {
        const { node, edge } = prev.get(current)!;
        edges.push(edge);
        nodes.push(node);
        current = node;
      }
      
      nodes.reverse();
      edges.reverse();

      return {
        nodes,
        edges,
        totalCost: gScore.get(destination)!,
        computationMs: performance.now() - start,
        algorithm: 'astar',
      };
    },
  };
}

function heuristic(nodeId: string, destination: string, network: RoadNetwork): number {
  const node = network.nodes.get(nodeId);
  const dest = network.nodes.get(destination);
  if (!node || !dest) return 0;
  
  const dx = node.x - dest.x;
  const dy = node.y - dest.y;
  return Math.sqrt(dx * dx + dy * dy) / 15;
}