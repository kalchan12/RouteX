import { Container, Graphics } from 'pixi.js';
import { Node } from '../../types';
import { RenderableTrafficLight } from './types';

export interface TrafficLightRenderOptions {
  size: number;
  spacing: number;
  poleHeight: number;
  poleWidth: number;
  showStateLabel: boolean;
}

const DEFAULT_OPTIONS: TrafficLightRenderOptions = {
  size: 6,
  spacing: 2,
  poleHeight: 20,
  poleWidth: 3,
  showStateLabel: false,
};

export class TrafficLightRenderer {
  private container: Container;
  private options: TrafficLightRenderOptions;
  private trafficLightGraphics: Map<string, RenderableTrafficLight> = new Map();
  private nodeMap: Map<string, Node> = new Map();

  constructor(container: Container, options: Partial<TrafficLightRenderOptions> = {}) {
    this.container = container;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  setNodes(nodes: Node[]): void {
    this.nodeMap = new Map(nodes.map(n => [n.id, n]));
  }

  renderTrafficLights(trafficLights: Map<string, { state: 'green' | 'red' | 'yellow'; stateTimer: number; greenDuration: number; redDuration: number; offset: number }>): void {
    this.clear();

    for (const [nodeId, light] of trafficLights) {
      const node = this.nodeMap.get(nodeId);
      if (!node) continue;

      const graphics = new Graphics();

      const poleX = node.x;
      const poleY = node.y - this.options.poleHeight / 2;

      graphics.rect(poleX - this.options.poleWidth / 2, poleY, this.options.poleWidth, this.options.poleHeight);
      graphics.fill(0x333333);

      const lightRadius = this.options.size;
      const lightSpacing = this.options.size + this.options.spacing;
      const lightStartY = node.y - this.options.poleHeight + lightRadius;

      const redY = lightStartY;
      const yellowY = lightStartY + lightSpacing;
      const greenY = lightStartY + lightSpacing * 2;

      this.drawLight(graphics, poleX, redY, lightRadius, light.state === 'red' ? 0xff4444 : 0x331111);
      this.drawLight(graphics, poleX, yellowY, lightRadius, light.state === 'yellow' ? 0xffdd00 : 0x333311);
      this.drawLight(graphics, poleX, greenY, lightRadius, light.state === 'green' ? 0x44ff44 : 0x113311);

      if (this.options.showStateLabel) {
        // Could add label here
      }

      const renderable: RenderableTrafficLight = {
        nodeId,
        graphics,
        state: light.state,
      };

      this.trafficLightGraphics.set(nodeId, renderable);
      this.container.addChild(graphics);
    }
  }

  updateTrafficLight(nodeId: string, state: 'green' | 'red' | 'yellow'): void {
    const renderable = this.trafficLightGraphics.get(nodeId);
    if (!renderable) return;

    const node = this.nodeMap.get(nodeId);
    if (!node) return;

    renderable.graphics.clear();

    const poleX = node.x;
    const poleY = node.y - this.options.poleHeight / 2;

    renderable.graphics.rect(poleX - this.options.poleWidth / 2, poleY, this.options.poleWidth, this.options.poleHeight);
    renderable.graphics.fill(0x333333);

    const lightRadius = this.options.size;
    const lightSpacing = this.options.size + this.options.spacing;
    const lightStartY = node.y - this.options.poleHeight + lightRadius;

    const redY = lightStartY;
    const yellowY = lightStartY + lightSpacing;
    const greenY = lightStartY + lightSpacing * 2;

    this.drawLight(renderable.graphics, poleX, redY, lightRadius, state === 'red' ? 0xff4444 : 0x331111);
    this.drawLight(renderable.graphics, poleX, yellowY, lightRadius, state === 'yellow' ? 0xffdd00 : 0x333311);
    this.drawLight(renderable.graphics, poleX, greenY, lightRadius, state === 'green' ? 0x44ff44 : 0x113311);

    renderable.state = state;
  }

  private drawLight(graphics: Graphics, x: number, y: number, radius: number, color: number): void {
    graphics.circle(x, y, radius).fill(color);
    graphics.circle(x, y, radius + 1).stroke({ width: 1, color: 0x000000, alpha: 0.3 });
  }

  clear(): void {
    this.container.removeChildren();
    this.trafficLightGraphics.clear();
  }

  getContainer(): Container {
    return this.container;
  }
}