import { Container, Graphics, Sprite } from 'pixi.js';
import { Node, Road, Vehicle, VehicleType, RoadStatus } from '../../types';

export interface RenderableRoad {
  id: string;
  source: Node;
  destination: Node;
  road: Road;
  graphics: Graphics;
}

export interface RenderableNode {
  id: string;
  node: Node;
  graphics: Graphics;
}

export interface RenderableVehicle {
  id: string;
  vehicle: Vehicle;
  graphics: Graphics | Sprite;
  currentPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  rotation: number;
}

export interface RenderableTrafficLight {
  nodeId: string;
  graphics: Graphics;
  state: 'red' | 'green' | 'yellow';
}

export interface RenderLayer {
  roads: Container;
  nodes: Container;
  vehicles: Container;
  trafficLights: Container;
  routes: Container;
  incidents: Container;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export const VEHICLE_COLORS = {
  [VehicleType.NORMAL]: 0x38bdf8,
  [VehicleType.EMERGENCY]: 0xf43f5e,
  bus: 0xf59e0b,
  truck: 0x8b5cf6,
};

export const ROAD_STATUS_COLORS = {
  [RoadStatus.OPEN]: 0x334155,
  [RoadStatus.CLOSED]: 0x991b1b,
  [RoadStatus.ACCIDENT]: 0xdc2626,
  [RoadStatus.CONSTRUCTION]: 0x92400e,
};

export function getCongestionColor(congestion: number): number {
  if (congestion < 0.3) return 0x22c55e;
  if (congestion < 0.6) return 0x3b82f6;
  if (congestion < 0.8) return 0xf59e0b;
  return 0xef4444;
}

export function getRoadColor(road: Road): number {
  if (road.status === RoadStatus.CLOSED || road.status === RoadStatus.CONSTRUCTION) {
    return ROAD_STATUS_COLORS[road.status];
  }
  if (road.status === RoadStatus.ACCIDENT) {
    return ROAD_STATUS_COLORS[road.status];
  }
  return getCongestionColor(road.congestion);
}

export function getNodeColor(type: Node['type']): number {
  switch (type) {
    case 'origin': return 0x22c55e;
    case 'destination': return 0xef4444;
    case 'hospital': return 0xf472b6;
    default: return 0x64748b;
  }
}