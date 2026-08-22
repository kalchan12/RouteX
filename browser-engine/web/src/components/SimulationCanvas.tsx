import { useEffect, useRef } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import type { SimulationSnapshot, Node, Road, RoadStatus } from '@routex/shared/types';

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
  const networkDrawnRef = useRef(false);

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

    const net = snapshot.network;
    if (!net || net.nodes.length === 0) return;

    const nodeMap = new Map<string, Node>();
    for (const n of net.nodes) nodeMap.set(n.id, n);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of net.nodes) {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
    }

    const worldW = (maxX - minX) || 1;
    const worldH = (maxY - minY) || 1;
    const scaleX = (app.screen.width * 0.85) / worldW;
    const scaleY = (app.screen.height * 0.85) / worldH;
    const s = Math.min(scaleX, scaleY);

    const offsetX = (app.screen.width - worldW * s) / 2 - minX * s;
    const offsetY = (app.screen.height - worldH * s) / 2 - minY * s;

    world.removeChildren();

    const roadG = new Graphics();
    for (const edge of net.edges) {
      const src = nodeMap.get(edge.source);
      const dst = nodeMap.get(edge.destination);
      if (!src || !dst) continue;

      const x1 = src.x * s + offsetX;
      const y1 = src.y * s + offsetY;
      const x2 = dst.x * s + offsetX;
      const y2 = dst.y * s + offsetY;

      roadG.moveTo(x1, y1).lineTo(x2, y2);
    }
    roadG.stroke({ width: 3, color: COLORS.road });
    world.addChild(roadG);

    for (const edge of net.edges) {
      if (edge.status === RoadStatus.OPEN && edge.congestion < 0.1) continue;
      const src = nodeMap.get(edge.source);
      const dst = nodeMap.get(edge.destination);
      if (!src || !dst) continue;

      const g = new Graphics();
      g.moveTo(src.x * s + offsetX, src.y * s + offsetY);
      g.lineTo(dst.x * s + offsetX, dst.y * s + offsetY);
      g.stroke({ width: 3, color: getRoadColor(edge) });
      world.addChild(g);
    }

    for (const n of net.nodes) {
      const g = new Graphics();
      const r = n.type === 'origin' || n.type === 'destination' || n.type === 'hospital' ? 8 : 5;
      g.circle(0, 0, r).fill(getNodeColor(n.type));
      g.x = n.x * s + offsetX;
      g.y = n.y * s + offsetY;
      world.addChild(g);
    }

    for (const v of snapshot.vehicles) {
      if (v.arrived || !v.currentEdge) continue;
      const edge = net.edges.find(e => e.id === v.currentEdge);
      if (!edge) continue;

      const src = nodeMap.get(edge.source);
      const dst = nodeMap.get(edge.destination);
      if (!src || !dst) continue;

      const px = (src.x + v.progress * (dst.x - src.x)) * s + offsetX;
      const py = (src.y + v.progress * (dst.y - src.y)) * s + offsetY;

      const vg = new Graphics();
      const color = v.type === 'emergency' ? COLORS.emergency : COLORS.vehicle;
      vg.circle(0, 0, v.type === 'emergency' ? 6 : 4).fill(color);
      vg.x = px;
      vg.y = py;
      world.addChild(vg);
    }

    networkDrawnRef.current = true;
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