import { useEffect, useRef } from 'react';
import { Application, Graphics, Container, Text as PixiText } from 'pixi.js';
import type { SimulationSnapshot, Node, Road, Vehicle, RoadStatus } from '@routex/shared/types';

interface SimulationCanvasProps {
  snapshot: SimulationSnapshot | null;
}

const COLORS = {
  background: 0x0f0f1a,
  road: 0x334155,
  roadClosed: 0x991b1b,
  roadAccident: 0xdc2626,
  roadHigh: 0x065f46,
  roadMed: 0x854d0e,
  roadLow: 0x1e40af,
  node: 0x64748b,
  nodeOrigin: 0x22c55e,
  nodeDest: 0xef4444,
  nodeHospital: 0xf472b6,
  vehicle: 0x38bdf8,
  emergency: 0xf43f5e,
  text: 0xeaeaea,
};

function getRoadColor(road: Road): number {
  if (road.status === RoadStatus.CLOSED || road.status === RoadStatus.CONSTRUCTION) return COLORS.roadClosed;
  if (road.status === RoadStatus.ACCIDENT) return COLORS.roadAccident;
  if (road.congestion < 0.3) return COLORS.road;
  if (road.congestion < 0.6) return COLORS.roadLow;
  if (road.congestion < 0.8) return COLORS.roadMed;
  return COLORS.roadHigh;
}

function getNodeColor(type: string): number {
  switch (type) {
    case 'origin': return COLORS.nodeOrigin;
    case 'destination': return COLORS.nodeDest;
    case 'hospital': return COLORS.nodeHospital;
    default: return COLORS.node;
  }
}

export function SimulationCanvas({ snapshot }: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const app = new Application();
    appRef.current = app;

    (async () => {
      await app.init({
        background: COLORS.background,
        resizeTo: container,
        antialias: true,
      });

      container.appendChild(app.canvas as HTMLCanvasElement);

      const world = new Container();
      world.sortableChildren = true;
      app.stage.addChild(world);
      worldRef.current = world;

      app.canvas.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        world.scale.x *= factor;
        world.scale.y *= factor;
      }, { passive: false });

      let dragging = false;
      let lx = 0, ly = 0;
      app.canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
      window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        world.x += e.clientX - lx; world.y += e.clientY - ly;
        lx = e.clientX; ly = e.clientY;
      });
      window.addEventListener('pointerup', () => { dragging = false; });
    })();

    return () => { app.destroy(true); appRef.current = null; };
  }, []);

  useEffect(() => {
    if (!snapshot || !worldRef.current || !appRef.current) return;
    const world = worldRef.current;
    const app = appRef.current;

    world.removeChildren();

    const SCALE = 0.6;

    const vehicles = snapshot.vehicles || [];
    if (vehicles.length === 0) return;

    const nodeMap = new Map<string, { x: number; y: number; type: string }>();
    const visitedVehicles = new Set<string>();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of vehicles) {
      const key = v.origin;
      if (!nodeMap.has(key)) {
        const [x, y] = key.split('_').map(Number);
        if (!isNaN(x) && !isNaN(y)) {
          nodeMap.set(key, { x, y, type: 'origin' });
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      if (!visitedVehicles.has(v.id)) visitedVehicles.add(v.id);
    }

    if (nodeMap.size === 0) {
      const g = new Graphics();
      g.rect(0, 0, 20, 20).fill(COLORS.road);
      world.addChild(g);
      return;
    }

    const worldContainer = new Graphics();
    world.addChild(worldContainer);

    for (const v of vehicles) {
      if (v.arrived || !v.currentEdge) continue;
      const parts = v.currentEdge.split('_');
      if (parts.length < 3) continue;

      const nodeAKey = `n_${parts[1]}_${parts[2]}`;
      let dirIdx = 3;
      let nodeBKey: string;
      if (parts[3] === 'h') {
        nodeBKey = `n_${parts[1]}_${parts[4]}`;
        dirIdx = 5;
      } else {
        nodeBKey = `n_${parts[2]}_${parts[3]}`;
        dirIdx = 4;
      }

      for (const nk of [nodeAKey, nodeBKey]) {
        if (!nodeMap.has(nk)) {
          const [r, c] = nk.split('_').slice(1).map(Number);
          if (!isNaN(r) && !isNaN(c)) {
            nodeMap.set(nk, { x: c, y: r, type: 'intersection' });
          }
        }
      }
    }

    if (nodeMap.size === 0) return;

    minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
    for (const n of nodeMap.values()) {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
    }

    const offsetX = (app.screen.width / SCALE - (maxX - minX) * 80) / 2;
    const offsetY = (app.screen.height / SCALE - (maxY - minY) * 80) / 2;

    for (const [id, node] of nodeMap) {
      const px = (node.x - minX) * 80 + offsetX;
      const py = (node.y - minY) * 80 + offsetY;

      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (dc === 0 && dr === 0) continue;
          const [nr, nc] = [node.y + dr, node.x + dc];
          const neighborKey = `n_${nr}_${nc}`;
          if (nodeMap.has(neighborKey)) {
            const np = nodeMap.get(neighborKey)!;
            const npx = (np.x - minX) * 80 + offsetX;
            const npy = (np.y - minY) * 80 + offsetY;
            worldContainer.moveTo(px, py).lineTo(npx, npy);
          }
        }
      }

      const nodeG = new Graphics();
      nodeG.circle(0, 0, 6).fill(getNodeColor(node.type));
      nodeG.x = px; nodeG.y = py;
      world.addChild(nodeG);
    }

    worldContainer.stroke({ width: 3, color: COLORS.road });

    for (const v of vehicles) {
      if (v.arrived || !v.currentEdge) continue;
      const parts = v.currentEdge.split('_');
      let nodeAKey: string, nodeBKey: string;

      if (parts.length >= 4 && parts[3] === 'h') {
        nodeAKey = `n_${parts[1]}_${parts[2]}`;
        nodeBKey = `n_${parts[1]}_${parts[4]}`;
      } else if (parts.length >= 4) {
        nodeAKey = `n_${parts[1]}_${parts[2]}`;
        nodeBKey = `n_${parts[2]}_${parts[3]}`;
      } else {
        continue;
      }

      const na = nodeMap.get(nodeAKey);
      const nb = nodeMap.get(nodeBKey);
      if (!na || !nb) continue;

      const px = ((na.x - minX) * 80 + offsetX) + v.progress * ((nb.x - na.x) * 80);
      const py = ((na.y - minY) * 80 + offsetY) + v.progress * ((nb.y - na.y) * 80);

      const vg = new Graphics();
      const color = v.type === 'emergency' ? COLORS.emergency : COLORS.vehicle;
      vg.circle(0, 0, v.type === 'emergency' ? 5 : 4).fill(color);
      vg.x = px; vg.y = py;
      world.addChild(vg);
    }

    world.x = (app.screen.width - world.width) / 2;
    world.y = (app.screen.height - world.height) / 2;
  }, [snapshot]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {snapshot && (
        <div style={{
          position: 'absolute', top: 10, left: 10, padding: '6px 12px',
          background: 'rgba(0,0,0,0.7)', borderRadius: 6, fontSize: 13, color: '#eaeaea', zIndex: 10,
        }}>
          Tick: {snapshot.tick} | Vehicles: {snapshot.vehicleCount} | Arrived: {snapshot.arrivedCount}
        </div>
      )}
    </div>
  );
}