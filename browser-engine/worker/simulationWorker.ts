import type { SimulationSnapshot, SimulationStatus } from '../shared/types';

interface EngineMessage {
  type: 'init' | 'step' | 'run' | 'pause' | 'resume' | 'stop' | 'reset' | 'getSnapshot';
  payload?: any;
}

interface EngineResponse {
  type: 'snapshot' | 'status' | 'ready' | 'error';
  payload: any;
}

let tick = 0;
let maxTicks = 600;
let status: SimulationStatus = 'pending';
let vehicles: any[] = [];
let vehiclesNextId = 1;
let spawnRate = 2;
let network: any = null;
let rng: () => number = () => 0;

function createRNG(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function initNetwork(scenario: any): void {
  network = { nodes: new Map(), edges: new Map(), adjacency: new Map() };
  for (const n of scenario.network.nodes) {
    network.nodes.set(n.id, n);
    network.adjacency.set(n.id, []);
  }
  for (const e of scenario.network.edges) {
    network.edges.set(e.id, { ...e, currentVehicleCount: 0, congestion: 0, baseTravelTime: e.distance / e.speedLimit, currentTravelTime: e.distance / e.speedLimit });
    network.adjacency.get(e.source)?.push(e.id);
  }
  spawnRate = scenario.vehicleSpawnRate || 2;
}

function getNeighbors(nodeId: string): string[] {
  const edgeIds = network.adjacency.get(nodeId) || [];
  return edgeIds.filter((eid: string) => {
    const e = network.edges.get(eid);
    return e && e.status === 'open';
  });
}

function dijkstra(origin: string, dest: string): string[] | null {
  const dist = new Map([[origin, 0]]);
  const prev = new Map();
  const heap: [number, string][] = [[0, origin]];
  const visited = new Set<string>();

  while (heap.length > 0) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, nid] = heap.shift()!;
    if (visited.has(nid)) continue;
    visited.add(nid);
    if (nid === dest) break;

    for (const eid of getNeighbors(nid)) {
      const e = network.edges.get(eid);
      if (!e) continue;
      const cost = e.currentTravelTime;
      const cand = d + cost;
      if (cand < (dist.get(e.destination) ?? Infinity)) {
        dist.set(e.destination, cand);
        prev.set(e.destination, { node: nid, edge: eid });
        heap.push([cand, e.destination]);
      }
    }
  }

  if (!dist.has(dest)) return null;
  const edges: string[] = [];
  let cur = dest;
  while (cur !== origin) {
    const p = prev.get(cur);
    if (!p) break;
    edges.push(p.edge);
    cur = p.node;
  }
  edges.reverse();
  return edges;
}

function findRoute(origin: string, dest: string): string[] | null {
  return dijkstra(origin, dest);
}

function spawnVehicle(): void {
  const origins = Array.from(network.nodes.values()).filter((n: any) => n.type === 'origin');
  const dests = Array.from(network.nodes.values()).filter((n: any) => n.type === 'destination');
  if (!origins.length || !dests.length) return;

  const origin = origins[Math.floor(rng() * origins.length)];
  const dest = dests[Math.floor(rng() * dests.length)];
  if (origin.id === dest.id) return;

  const route = findRoute(origin.id, dest.id);
  if (!route || !route.length) return;

  const firstEdge = network.edges.get(route[0]);
  vehicles.push({
    id: `v_${vehiclesNextId++}`,
    type: 'normal',
    origin: origin.id,
    destination: dest.id,
    currentEdge: route[0],
    progress: 0,
    route: { nodes: [], edges: route, totalCost: 0, computationMs: 0, algorithm: 'dijkstra' },
    speed: firstEdge.speedLimit,
    spawnTick: tick,
    arrived: false,
    arrivalTick: null,
  });
}

function spawnExtra(count: number): void {
  for (let i = 0; i < count; i++) spawnVehicle();
}

function moveVehicles(): void {
  for (const v of vehicles) {
    if (v.arrived || !v.currentEdge) continue;
    const edge = network.edges.get(v.currentEdge);
    if (!edge) { v.arrived = true; v.arrivalTick = tick; continue; }

    v.progress += 1 / edge.currentTravelTime;

    if (v.progress >= 1) {
      const routeEdges = v.route?.edges || [];
      const idx = routeEdges.indexOf(v.currentEdge);
      if (idx >= 0 && idx < routeEdges.length - 1) {
        v.currentEdge = routeEdges[idx + 1];
        v.progress = 0;
        const nextEdge = network.edges.get(v.currentEdge);
        if (nextEdge) v.speed = nextEdge.speedLimit;
      } else {
        v.arrived = true;
        v.arrivalTick = tick;
        v.currentEdge = null;
        v.progress = 0;
      }
    }
  }
}

function updateNetwork(): void {
  const counts = new Map<string, number>();
  for (const v of vehicles) {
    if (v.currentEdge) {
      counts.set(v.currentEdge, (counts.get(v.currentEdge) || 0) + 1);
    }
  }
  for (const [eid, edge] of network.edges) {
    const c = counts.get(eid) || 0;
    edge.currentVehicleCount = c;
    edge.congestion = edge.capacity > 0 ? c / edge.capacity : 1;
    const factor = edge.congestion <= 0.3 ? 1 : edge.congestion <= 0.7 ? 1 + 2 * (edge.congestion - 0.3) : 1.8 + 10 * (edge.congestion - 0.7);
    edge.currentTravelTime = edge.baseTravelTime * factor;
  }
}

function stepSimulation(): void {
  if (status !== 'running') return;
  if (tick >= maxTicks) { status = 'completed'; return; }

  tick++;
  for (let i = 0; i < spawnRate; i++) spawnVehicle();
  moveVehicles();
  updateNetwork();
  vehicles = vehicles.filter(v => !v.arrived);

  if (tick >= maxTicks) status = 'completed';
}

function getSnapshot(): SimulationSnapshot {
  let totalSpeed = 0, moving = 0, totalTravelTime = 0, arrived = 0, totalCongestion = 0, edgeCount = 0;
  for (const v of vehicles) {
    if (!v.arrived && v.currentEdge) { totalSpeed += v.speed; moving++; }
    if (v.arrived && v.arrivalTick != null) { totalTravelTime += v.arrivalTick - v.spawnTick; arrived++; }
  }
  for (const e of network.edges.values()) { totalCongestion += e.congestion; edgeCount++; }

  const nodes = Array.from(network.nodes.values());
  const edges = Array.from(network.edges.values());

  return {
    tick,
    time: tick,
    status,
    vehicles,
    vehicleCount: vehicles.length,
    arrivedCount: arrived,
    networkSummary: { nodes: network.nodes.size, edges: network.edges.size, closed: 0 },
    network: { nodes, edges },
    metrics: {
      avgTravelTime: arrived > 0 ? totalTravelTime / arrived : 0,
      avgSpeed: moving > 0 ? totalSpeed / moving : 0,
      totalThroughput: arrived,
      avgCongestion: edgeCount > 0 ? totalCongestion / edgeCount : 0,
      totalWaitingTime: 0,
      emergencyResponseTime: null,
    },
  };
}

self.onmessage = (event: MessageEvent<EngineMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'init':
        tick = 0;
        maxTicks = payload.config?.maxTicks || payload.scenario.duration || 600;
        status = 'pending';
        vehicles = [];
        vehiclesNextId = 1;
        rng = createRNG(payload.config?.seed || 42);
        initNetwork(payload.scenario);
        (self as any).postMessage({ type: 'ready', payload: null });
        break;
      case 'resume':
        status = 'running';
        (self as any).postMessage({ type: 'status', payload: { status, tick } });
        break;
      case 'pause':
        status = 'paused';
        (self as any).postMessage({ type: 'status', payload: { status, tick } });
        break;
      case 'stop':
        status = 'stopped';
        (self as any).postMessage({ type: 'status', payload: { status, tick } });
        break;
      case 'step':
        if (status !== 'running') status = 'running';
        stepSimulation();
        (self as any).postMessage({ type: 'snapshot', payload: getSnapshot() });
        break;
      case 'run':
        status = 'running';
        for (let i = 0; i < (payload?.steps || 100); i++) {
          if (status !== 'running') break;
          stepSimulation();
        }
        (self as any).postMessage({ type: 'snapshot', payload: getSnapshot() });
        break;
      case 'reset':
        tick = 0;
        status = 'pending';
        vehicles = [];
        vehiclesNextId = 1;
        (self as any).postMessage({ type: 'snapshot', payload: getSnapshot() });
        break;
      case 'getSnapshot':
        (self as any).postMessage({ type: 'snapshot', payload: getSnapshot() });
        break;
    }
  } catch (err) {
    (self as any).postMessage({ type: 'error', payload: { message: err instanceof Error ? err.message : 'Unknown error' } });
  }
};

export {};