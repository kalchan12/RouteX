import { Node, NodeType } from '../../types';

export function createNode(
  id: string,
  x: number,
  y: number,
  type: NodeType = NodeType.INTERSECTION,
  trafficLightId: string | null = null
): Node {
  return { id, x, y, type, trafficLightId };
}

export function nodeToDict(node: Node): Record<string, unknown> {
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    type: node.type,
    trafficLightId: node.trafficLightId,
  };
}