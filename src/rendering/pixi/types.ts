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
  [VehicleType.NORMAL]: 0x4cd7f6, // Primary Cyan
  [VehicleType.EMERGENCY]: 0xffb4ab, // Error / Emergency Neon Red
  bus: 0xb4c5ff, // Secondary Electric Blue
  truck: 0xffb873, // Tertiary Amber
};

export const ROAD_STATUS_COLORS = {
  [RoadStatus.OPEN]: 0x1e1f26, // Surface Container
  [RoadStatus.CLOSED]: 0x93000a, // Error Container
  [RoadStatus.ACCIDENT]: 0xffb4ab, // Error Red
  [RoadStatus.CONSTRUCTION]: 0xe89337, // Tertiary Container
};

export function getCongestionColor(congestion: number): number {
  if (congestion < 0.25) return 0x4cd7f6; // Cyan (Flow)
  if (congestion < 0.5) return 0x06b6d4; // Primary Container
  if (congestion < 0.75) return 0xffb873; // Tertiary Amber (Warning)
  return 0xffb4ab; // Error Neon Red (Critical)
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
    case 'origin': return 0x4cd7f6;
    case 'destination': return 0xb4c5ff;
    case 'hospital': return 0xf472b6;
    default: return 0x869397;
  }
}
