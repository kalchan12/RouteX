import { Container, Graphics, Text } from 'pixi.js';
import { Node, NodeType } from '../../types';
import { getNodeColor, RenderableNode } from './types';

export interface NodeRenderOptions {
  baseRadius: number;
  keyNodeRadiusMultiplier: number;
  showLabels: boolean;
  labelFontSize: number;
}

const DEFAULT_OPTIONS: NodeRenderOptions = {
  baseRadius: 6,
  keyNodeRadiusMultiplier: 1.5,
  showLabels: false,
  labelFontSize: 10,
};

export class NodeRenderer {
  private container: Container;
  private options: NodeRenderOptions;
  private nodeGraphics: Map<string, RenderableNode> = new Map();

  constructor(container: Container, options: Partial<NodeRenderOptions> = {}) {
    this.container = container;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  renderNodes(nodes: Node[]): void {
    this.clear();

    for (const node of nodes) {
      const isKeyNode = this.isKeyNode(node.type);
      const radius = isKeyNode 
        ? this.options.baseRadius * this.options.keyNodeRadiusMultiplier 
        : this.options.baseRadius;

      const graphics = new Graphics();
      graphics.circle(0, 0, radius).fill(getNodeColor(node.type));
      graphics.x = node.x;
      graphics.y = node.y;

      if (isKeyNode) {
        graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
      }

      if (this.options.showLabels) {
        const label = new Text({
          text: node.id,
          style: {
            fontSize: this.options.labelFontSize,
            fill: 0xffffff,
            fontFamily: 'monospace',
          },
        });
        label.anchor.set(0.5);
        label.position.set(0, -radius - 4);
        graphics.addChild(label);
      }

      const renderable: RenderableNode = {
        id: node.id,
        node,
        graphics,
      };

      this.nodeGraphics.set(node.id, renderable);
      this.container.addChild(graphics);
    }
  }

  private isKeyNode(type: NodeType): boolean {
    return type === NodeType.ORIGIN || type === NodeType.DESTINATION || type === NodeType.HOSPITAL;
  }

  clear(): void {
    this.container.removeChildren();
    this.nodeGraphics.clear();
  }

  getContainer(): Container {
    return this.container;
  }

  highlightNode(nodeId: string, highlight: boolean = true): void {
    const renderable = this.nodeGraphics.get(nodeId);
    if (!renderable) return;

    if (highlight) {
      renderable.graphics.stroke({ width: 3, color: 0x22d3ee, alpha: 0.9 });
    } else {
      const isKeyNode = this.isKeyNode(renderable.node.type);
      if (isKeyNode) {
        renderable.graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
      } else {
        renderable.graphics.stroke({ width: 0 });
      }
    }
  }
}