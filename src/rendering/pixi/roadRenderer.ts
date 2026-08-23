import { Container, Graphics } from 'pixi.js';
import { Node, Road, RoadStatus } from '../../types';
import { getRoadColor, RenderableRoad } from './types';

export interface RoadRenderOptions {
  baseWidth: number;
  congestionWidthMultiplier: number;
  showDirectionArrows: boolean;
}

const DEFAULT_OPTIONS: RoadRenderOptions = {
  baseWidth: 4,
  congestionWidthMultiplier: 2,
  showDirectionArrows: false,
};

export class RoadRenderer {
  private container: Container;
  private options: RoadRenderOptions;
  private roadGraphics: Map<string, RenderableRoad> = new Map();

  constructor(container: Container, options: Partial<RoadRenderOptions> = {}) {
    this.container = container;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  renderRoads(nodes: Node[], roads: Road[]): void {
    this.clear();

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const road of roads) {
      const source = nodeMap.get(road.source);
      const destination = nodeMap.get(road.destination);

      if (!source || !destination) continue;

      const graphics = new Graphics();
      
      const color = getRoadColor(road);
      const width = this.calculateRoadWidth(road);

      graphics.moveTo(source.x, source.y);
      graphics.lineTo(destination.x, destination.y);
      graphics.stroke({ width, color, alpha: 0.9 });

      if (road.status !== RoadStatus.OPEN) {
        const overlay = new Graphics();
        overlay.moveTo(source.x, source.y);
        overlay.lineTo(destination.x, destination.y);
        overlay.stroke({ width: width * 0.6, color, alpha: 0.6 });
        graphics.addChild(overlay);
      }

      const renderable: RenderableRoad = {
        id: road.id,
        source,
        destination,
        road,
        graphics,
      };

      this.roadGraphics.set(road.id, renderable);
      this.container.addChild(graphics);
    }
  }

  private calculateRoadWidth(road: Road): number {
    let width = this.options.baseWidth * road.lanes;
    
    if (road.congestion > 0.7) {
      width *= this.options.congestionWidthMultiplier;
    }
    
    return Math.max(2, width);
  }

  updateRoadCongestion(roadId: string, congestion: number, status: RoadStatus): void {
    const renderable = this.roadGraphics.get(roadId);
    if (!renderable) return;

    const newColor = getRoadColor({ ...renderable.road, congestion, status });
    const newWidth = this.calculateRoadWidth({ ...renderable.road, congestion });

    renderable.graphics.clear();
    renderable.graphics.moveTo(renderable.source.x, renderable.source.y);
    renderable.graphics.lineTo(renderable.destination.x, renderable.destination.y);
    renderable.graphics.stroke({ width: newWidth, color: newColor, alpha: 0.9 });
  }

  clear(): void {
    this.container.removeChildren();
    this.roadGraphics.clear();
  }

  getContainer(): Container {
    return this.container;
  }
}