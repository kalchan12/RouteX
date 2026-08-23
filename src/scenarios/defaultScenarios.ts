import { ScenarioConfig, ScenarioNetwork, VehicleType, NodeType, RoadType, RoadStatus, ScenarioTrafficLight, Incident, Pedestrian } from '../types';

function buildGridNetwork(cols: number, rows: number, blockSize: number): ScenarioNetwork {
  const nodes: ScenarioNetwork['nodes'] = [];
  const edges: ScenarioNetwork['edges'] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `n_${r}_${c}`;
      let type = NodeType.INTERSECTION;
      if (r === 0 && c === 0) type = NodeType.ORIGIN;
      if (r === rows - 1 && c === cols - 1) type = NodeType.DESTINATION;
      if (r === 0 && c === cols - 1) type = NodeType.HOSPITAL;

      nodes.push({
        id,
        x: c * blockSize,
        y: r * blockSize,
        type,
        trafficLightId: null,
      });
    }
  }

  let edgeId = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const src = `n_${r}_${c}`;
      if (c < cols - 1) {
        const dst = `n_${r}_${c + 1}`;
        const dist = blockSize;
        const speedLimit = r === 0 ? 12 : 10;
        edges.push({
          id: `e_${edgeId++}`,
          source: src,
          destination: dst,
          distance: dist,
          speedLimit,
          capacity: 6,
          lanes: r === 0 ? 2 : 1,
          roadType: r === 0 ? RoadType.AVENUE : RoadType.STREET,
          status: RoadStatus.OPEN,
          priority: 0,
        });
      }
      if (r < rows - 1) {
        const dst = `n_${r + 1}_${c}`;
        const dist = blockSize;
        const speedLimit = c === 0 ? 12 : 10;
        edges.push({
          id: `e_${edgeId++}`,
          source: src,
          destination: dst,
          distance: dist,
          speedLimit,
          capacity: 6,
          lanes: c === 0 ? 2 : 1,
          roadType: c === 0 ? RoadType.AVENUE : RoadType.STREET,
          status: RoadStatus.OPEN,
          priority: 0,
        });
      }
    }
  }

  return { nodes, edges };
}

function buildTrafficLights(cols: number, rows: number, greenDuration: number, redDuration: number): ScenarioTrafficLight[] {
  const lights: ScenarioTrafficLight[] = [];
  let offset = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
        lights.push({
          nodeId: `n_${r}_${c}`,
          greenDuration,
          redDuration,
          offset,
        });
        offset = (offset + 5) % (greenDuration + redDuration);
      }
    }
  }
  return lights;
}

const normal = (): ScenarioConfig => {
  const cols = 8, rows = 6, block = 500;
  return {
    id: 'normal',
    name: 'Normal Traffic',
    duration: 600,
    network: buildGridNetwork(cols, rows, block),
    trafficLights: buildTrafficLights(cols, rows, 15, 15),
    events: [],
    incidents: [] as Omit<Incident, 'id' | 'startTick' | 'endTick'>[],
    pedestrians: [] as Omit<Pedestrian, 'id' | 'spawnTick'>[],
    vehicleSpawnRate: 2,
    vehicleTypes: [VehicleType.NORMAL],
  };
};

const rushHour = (): ScenarioConfig => {
  const cols = 8, rows = 6, block = 500;
  return {
    id: 'rush_hour',
    name: 'Rush Hour',
    duration: 600,
    network: buildGridNetwork(cols, rows, block),
    trafficLights: buildTrafficLights(cols, rows, 12, 20),
    events: [],
    incidents: [] as Omit<Incident, 'id' | 'startTick' | 'endTick'>[],
    pedestrians: [] as Omit<Pedestrian, 'id' | 'spawnTick'>[],
    vehicleSpawnRate: 5,
    vehicleTypes: [VehicleType.NORMAL],
  };
};

const accident = (): ScenarioConfig => {
  const cols = 8, rows = 6, block = 500;
  const network = buildGridNetwork(cols, rows, block);
  return {
    id: 'accident',
    name: 'Accident Scenario',
    duration: 600,
    network,
    trafficLights: buildTrafficLights(cols, rows, 15, 15),
    events: [
      {
        type: 'accident' as any,
        tick: 120,
        duration: 180,
        roadId: 'e_7',
        nodeId: null,
        payload: {},
      },
    ],
    incidents: [{
      type: 'accident' as any,
      severity: 'moderate' as any,
      roadId: 'e_7',
      nodeId: null,
      position: null,
      description: 'Vehicle collision blocking lane',
      affectedLanes: [0],
      estimatedClearanceTick: 300,
    }] as Omit<Incident, 'id' | 'startTick' | 'endTick'>[],
    pedestrians: [] as Omit<Pedestrian, 'id' | 'spawnTick'>[],
    vehicleSpawnRate: 3,
    vehicleTypes: [VehicleType.NORMAL],
  };
};

const emergency = (): ScenarioConfig => {
  const cols = 8, rows = 6, block = 500;
  const network = buildGridNetwork(cols, rows, block);
  return {
    id: 'emergency',
    name: 'Emergency Vehicle',
    duration: 600,
    network,
    trafficLights: buildTrafficLights(cols, rows, 15, 15),
    events: [
      {
        type: 'emergency_vehicle' as any,
        tick: 60,
        duration: 0,
        roadId: null,
        nodeId: null,
        payload: { count: 3 },
      },
      {
        type: 'road_closure' as any,
        tick: 200,
        duration: 120,
        roadId: 'e_3',
        nodeId: null,
        payload: {},
      },
    ],
    incidents: [] as Omit<Incident, 'id' | 'startTick' | 'endTick'>[],
    pedestrians: [] as Omit<Pedestrian, 'id' | 'spawnTick'>[],
    vehicleSpawnRate: 2,
    vehicleTypes: [VehicleType.NORMAL, VehicleType.EMERGENCY],
  };
};

const roadClosure = (): ScenarioConfig => {
  const cols = 8, rows = 6, block = 500;
  const network = buildGridNetwork(cols, rows, block);
  return {
    id: 'road_closure',
    name: 'Road Closure',
    duration: 600,
    network,
    trafficLights: buildTrafficLights(cols, rows, 15, 15),
    events: [
      {
        type: 'road_closure' as any,
        tick: 100,
        duration: 300,
        roadId: 'e_5',
        nodeId: null,
        payload: {},
      },
    ],
    incidents: [{
      type: 'road_closure' as any,
      severity: 'severe' as any,
      roadId: 'e_5',
      nodeId: null,
      position: null,
      description: 'Road closed for maintenance',
      affectedLanes: [0, 1],
      estimatedClearanceTick: 400,
    }] as Omit<Incident, 'id' | 'startTick' | 'endTick'>[],
    pedestrians: [] as Omit<Pedestrian, 'id' | 'spawnTick'>[],
    vehicleSpawnRate: 3,
    vehicleTypes: [VehicleType.NORMAL],
  };
};

export const defaultScenarios: ScenarioConfig[] = [
  normal(),
  rushHour(),
  accident(),
  emergency(),
  roadClosure(),
];