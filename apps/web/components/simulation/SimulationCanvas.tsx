"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";

import type { SimulationSnapshot } from "@/types/simulation";

interface Props {
  snapshot: SimulationSnapshot | null;
  selectedVehicleId: string | null;
}

const ROAD_COLORS = {
  low: 0x4b5563,
  medium: 0xf59e0b,
  high: 0xf97316,
  critical: 0xef4444,
  closed: 0x1f2937,
} as const;

const NODE_COLORS = {
  origin: 0x34d399,
  destination: 0xf59e0b,
  hospital: 0xef4444,
  intersection: 0x232a36,
} as const;

const VEHICLE_COLORS: Record<string, number> = {
  normal: 0x8b5cf6,
  bus: 0x22d3ee,
  truck: 0xf59e0b,
  emergency: 0xef4444,
};

function congestionColor(congestion: number, closed: boolean): number {
  if (closed) return ROAD_COLORS.closed;
  if (congestion >= 1.0) return ROAD_COLORS.critical;
  if (congestion >= 0.6) return ROAD_COLORS.high;
  if (congestion >= 0.3) return ROAD_COLORS.medium;
  return ROAD_COLORS.low;
}

interface RenderState {
  snapshot: SimulationSnapshot | null;
  selected: string | null;
}

export function SimulationCanvas({ snapshot, selectedVehicleId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const stageRef = useRef<Container | null>(null);
  const stateRef = useRef<RenderState>({ snapshot: null, selected: null });
  const renderFnRef = useRef<(() => void) | null>(null);

  stateRef.current = { snapshot, selected: selectedVehicleId };

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    let disposed = false;
    const app = new Application();
    appRef.current = app;

    void app
      .init({
        background: 0x0d1117,
        antialias: true,
        resizeTo: host,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      })
      .then(() => {
        if (disposed) return;
        host.appendChild(app.canvas);
        const stage = new Container();
        app.stage.addChild(stage);
        stageRef.current = stage;
        renderFnRef.current = () => render(app, stage, stateRef.current);
        renderFnRef.current();
      });

    return () => {
      disposed = true;
      app.destroy(true, { children: true });
      appRef.current = null;
      stageRef.current = null;
      renderFnRef.current = null;
    };
  }, []);

  useEffect(() => {
    renderFnRef.current?.();
  }, [snapshot, selectedVehicleId]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function render(
  app: Application,
  stage: Container,
  { snapshot, selected }: RenderState
) {
  stage.removeChildren().forEach((child) => child.destroy());

  if (!snapshot || snapshot.nodes.length === 0) {
    const empty = new Text({
      text: "Waiting for simulation data…",
      style: { fill: 0x8b93a7, fontSize: 14 },
    });
    empty.position.set(16, 16);
    stage.addChild(empty);
    return;
  }

  const width = app.screen.width;
  const height = app.screen.height;

  const xs = snapshot.nodes.map((n) => n.x);
  const ys = snapshot.nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const pad = 40;
  const scale = Math.min(
    (width - pad * 2) / spanX,
    (height - pad * 2) / spanY
  );
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const sx = (x: number) => offsetX + (x - minX) * scale;
  const sy = (y: number) => offsetY + (y - minY) * scale;

  const nodeById = new Map(snapshot.nodes.map((n) => [n.id, n]));

  // roads
  const roadLayer = new Graphics();
  for (const road of snapshot.roads) {
    const source = nodeById.get(road.source);
    const dest = nodeById.get(road.destination);
    if (!source || !dest) continue;
    roadLayer.moveTo(sx(source.x), sy(source.y));
    roadLayer.lineTo(sx(dest.x), sy(dest.y));
    roadLayer.stroke({
      width: road.road_type === "highway" ? 5 : road.lanes > 1 ? 4 : 3,
      color: congestionColor(road.congestion, road.status !== "open"),
      alpha: road.status === "open" ? 0.9 : 0.45,
    });
  }
  stage.addChild(roadLayer);

  // nodes
  const nodeLayer = new Graphics();
  for (const node of snapshot.nodes) {
    nodeLayer.circle(sx(node.x), sy(node.y), 4).fill({
      color: NODE_COLORS[node.type] ?? NODE_COLORS.intersection,
      alpha: 0.9,
    });
  }
  stage.addChild(nodeLayer);

  // selected route
  if (selected) {
    const vehicle = snapshot.vehicles.find((v) => v.id === selected);
    if (vehicle) {
      const routeLayer = new Graphics();
      const points = vehicle.route
        .map((id) => nodeById.get(id))
        .filter((n): n is NonNullable<typeof n> => Boolean(n));
      points.forEach((node, index) => {
        const x = sx(node.x);
        const y = sy(node.y);
        if (index === 0) routeLayer.moveTo(x, y);
        else routeLayer.lineTo(x, y);
      });
      routeLayer.stroke({ width: 2, color: 0x22d3ee, alpha: 0.8 });
      stage.addChild(routeLayer);
    }
  }

  // vehicles
  const vehicleLayer = new Graphics();
  for (const vehicle of snapshot.vehicles) {
    if (vehicle.status === "completed") continue;
    const radius = vehicle.type === "emergency" ? 5 : 3.5;
    vehicleLayer.circle(sx(vehicle.x), sy(vehicle.y), radius).fill({
      color: VEHICLE_COLORS[vehicle.type] ?? VEHICLE_COLORS.normal,
      alpha: vehicle.status === "waiting" ? 0.55 : 0.95,
    });
  }
  stage.addChild(vehicleLayer);

  // HUD
  const label = new Text({
    text: `tick ${snapshot.tick}  ·  t=${snapshot.time.toFixed(0)}s  ·  ${
      snapshot.metrics.active_vehicles
    } active`,
    style: { fill: 0x8b93a7, fontSize: 12 },
  });
  label.position.set(12, 12);
  stage.addChild(label);
}
