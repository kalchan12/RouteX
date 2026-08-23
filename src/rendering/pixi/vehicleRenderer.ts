import { Container, Graphics, Text } from 'pixi.js';
import { Vehicle, VehicleType, Road, Node } from '../../types';
import { VEHICLE_COLORS, RenderableVehicle } from './types';

export interface VehicleRenderOptions {
  baseSize: number;
  emergencySizeMultiplier: number;
  showLabels: boolean;
  labelFontSize: number;
  smoothMovement: boolean;
  interpolationFactor: number;
}

const DEFAULT_OPTIONS: VehicleRenderOptions = {
  baseSize: 4,
  emergencySizeMultiplier: 1.5,
  showLabels: false,
  labelFontSize: 8,
  smoothMovement: true,
  interpolationFactor: 0.15,
};

export class VehicleRenderer {
  private container: Container;
  private options: VehicleRenderOptions;
  private vehicleGraphics: Map<string, RenderableVehicle> = new Map();
  private nodeMap: Map<string, Node> = new Map();
  private roadMap: Map<string, Road> = new Map();

  constructor(container: Container, options: Partial<VehicleRenderOptions> = {}) {
    this.container = container;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  setNetwork(nodes: Node[], roads: Road[]): void {
    this.nodeMap = new Map(nodes.map(n => [n.id, n]));
    this.roadMap = new Map(roads.map(r => [r.id, r]));
  }

  updateVehicles(vehicles: Vehicle[]): void {
    const currentVehicleIds = new Set(vehicles.map(v => v.id));
    
    for (const [id] of this.vehicleGraphics) {
      if (!currentVehicleIds.has(id)) {
        this.removeVehicle(id);
      }
    }

    for (const vehicle of vehicles) {
      if (vehicle.arrived) continue;
      if (!vehicle.currentEdge) continue;

      this.updateVehiclePosition(vehicle);
    }
  }

  private updateVehiclePosition(vehicle: Vehicle): void {
    let renderable = this.vehicleGraphics.get(vehicle.id);

    if (!renderable) {
      renderable = this.createVehicleGraphics(vehicle);
      this.vehicleGraphics.set(vehicle.id, renderable);
      this.container.addChild(renderable.graphics);
    }

    const edge = this.roadMap.get(vehicle.currentEdge!);
    if (!edge) return;

    const source = this.nodeMap.get(edge.source);
    const destination = this.nodeMap.get(edge.destination);
    if (!source || !destination) return;

    const targetX = source.x + vehicle.progress * (destination.x - source.x);
    const targetY = source.y + vehicle.progress * (destination.y - source.y);
    const dx = destination.x - source.x;
    const dy = destination.y - source.y;
    const targetRotation = Math.atan2(dy, dx);

    if (this.options.smoothMovement) {
      renderable.currentPosition.x += (targetX - renderable.currentPosition.x) * this.options.interpolationFactor;
      renderable.currentPosition.y += (targetY - renderable.currentPosition.y) * this.options.interpolationFactor;
      renderable.rotation += this.shortestRotationDiff(renderable.rotation, targetRotation) * this.options.interpolationFactor;
    } else {
      renderable.currentPosition.x = targetX;
      renderable.currentPosition.y = targetY;
      renderable.rotation = targetRotation;
    }

    renderable.graphics.position.set(renderable.currentPosition.x, renderable.currentPosition.y);
    renderable.graphics.rotation = renderable.rotation;

    if (this.options.showLabels) {
      this.updateVehicleLabel(renderable, vehicle);
    }
  }

  private createVehicleGraphics(vehicle: Vehicle): RenderableVehicle {
    const edge = this.roadMap.get(vehicle.currentEdge!);
    if (!edge) {
      throw new Error(`Edge ${vehicle.currentEdge} not found`);
    }

    const source = this.nodeMap.get(edge.source);
    const destination = this.nodeMap.get(edge.destination);
    if (!source || !destination) {
      throw new Error(`Nodes for edge ${vehicle.currentEdge} not found`);
    }

    const startX = source.x + vehicle.progress * (destination.x - source.x);
    const startY = source.y + vehicle.progress * (destination.y - source.y);
    const dx = destination.x - source.x;
    const dy = destination.y - source.y;
    const rotation = Math.atan2(dy, dx);

    const size = vehicle.type === VehicleType.EMERGENCY 
      ? this.options.baseSize * this.options.emergencySizeMultiplier 
      : this.options.baseSize;

    const color = VEHICLE_COLORS[vehicle.type] ?? VEHICLE_COLORS[VehicleType.NORMAL];

    const graphics = new Graphics();
    graphics.rect(-size / 2, -size / 3, size, size * 0.66);
    graphics.fill(color);
    
    if (vehicle.type === VehicleType.EMERGENCY) {
      graphics.rect(-size / 2 + 1, -size / 3 + 1, size - 2, size * 0.33);
      graphics.fill(0xffffff);
    }

    graphics.position.set(startX, startY);
    graphics.rotation = rotation;

    if (this.options.showLabels) {
      const label = new Text({
        text: vehicle.id,
        style: {
          fontSize: this.options.labelFontSize,
          fill: 0xffffff,
          fontFamily: 'monospace',
        },
      });
      label.anchor.set(0.5, 1);
      label.position.set(0, -size - 2);
      graphics.addChild(label);
    }

    return {
      id: vehicle.id,
      vehicle,
      graphics,
      currentPosition: { x: startX, y: startY },
      targetPosition: { x: startX, y: startY },
      rotation,
    };
  }

  private updateVehicleLabel(renderable: RenderableVehicle, vehicle: Vehicle): void {
    const label = renderable.graphics.children.find(c => c instanceof Text) as Text;
    if (label) {
      label.text = `${vehicle.id} (${Math.round(vehicle.speed * 3.6)} km/h)`;
    }
  }

  private removeVehicle(id: string): void {
    const renderable = this.vehicleGraphics.get(id);
    if (renderable) {
      this.container.removeChild(renderable.graphics);
      renderable.graphics.destroy();
      this.vehicleGraphics.delete(id);
    }
  }

  private shortestRotationDiff(current: number, target: number): number {
    let diff = target - current;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return diff;
  }

  clear(): void {
    for (const [id] of this.vehicleGraphics) {
      this.removeVehicle(id);
    }
  }

  getContainer(): Container {
    return this.container;
  }
}