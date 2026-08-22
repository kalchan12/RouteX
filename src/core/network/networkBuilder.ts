import { ScenarioNetwork, RoadNetwork, Node, Road, RoadType, RoadStatus, NodeType } from '../../types';
import { createNode } from './node';
import { createRoad } from './edge';
import { createRoadNetwork, addNode, addRoad } from './graph';

export function buildNetwork(scenarioNetwork: ScenarioNetwork): {
  network: ReturnType<typeof createRoadNetwork>;
  nodeIdToIndex: Map<string, number>;
} {
  const network = createRoadNetwork();
  const nodeIdToIndex = new Map<string, number>();

  for (let i = 0; i < scenarioNetwork.nodes.length; i++) {
    const nodeData = scenarioNetwork.nodes[i];
    const node = createNode(
      nodeData.id,
      nodeData.x,
      nodeData.y,
      nodeData.type,
      nodeData.trafficLightId
    );
    addNode(network, node);
    nodeIdToIndex.set(node.id, i);
  }

  for (const edgeData of scenarioNetwork.edges) {
    const road = createRoad({
      id: edgeData.id,
      source: edgeData.source,
      destination: edgeData.destination,
      distance: edgeData.distance,
      speedLimit: edgeData.speedLimit,
      capacity: edgeData.capacity,
      lanes: edgeData.lanes,
      roadType: edgeData.roadType,
      status: edgeData.status,
      priority: edgeData.priority,
    });
    addRoad(network, road);
  }

  return { network, nodeIdToIndex };
}