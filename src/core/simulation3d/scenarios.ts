import type { Scenario, Road, Lane, Intersection, TrafficLight, VehicleSpawner, PedestrianState } from './types';
import { VehicleType, LightState } from './types';

const L = 120, OFF = 1.8, ISZ = 8, H = ISZ / 2;
const LW = 3.2; // Lane width

function mkLane(id: string, roadId: string, index: number, waypoints: { x: number; y: number }[], speedLimit = 13.9): Lane {
  let len = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i]!.x - waypoints[i - 1]!.x;
    const dy = waypoints[i]!.y - waypoints[i - 1]!.y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return { id, roadId, index, direction: 'forward', length: len, speedLimit, waypoints, connections: [] };
}

// 1. ASTU Tech Corridor (Normal)
export function createAstuScenario(): Scenario {
  const eIn0 = mkLane('e-in-0', 're-in', 0, [{ x: -L - H, y: OFF }, { x: -H, y: OFF }]);
  const eIn1 = mkLane('e-in-1', 're-in', 1, [{ x: -L - H, y: OFF + LW }, { x: -H, y: OFF + LW }]);
  const eOut0 = mkLane('e-out-0', 're-out', 0, [{ x: H, y: OFF }, { x: L + H, y: OFF }]);
  const eOut1 = mkLane('e-out-1', 're-out', 1, [{ x: H, y: OFF + LW }, { x: L + H, y: OFF + LW }]);

  const wIn0 = mkLane('w-in-0', 'rw-in', 0, [{ x: L + H, y: -OFF }, { x: H, y: -OFF }]);
  const wIn1 = mkLane('w-in-1', 'rw-in', 1, [{ x: L + H, y: -OFF - LW }, { x: H, y: -OFF - LW }]);
  const wOut0 = mkLane('w-out-0', 'rw-out', 0, [{ x: -H, y: -OFF }, { x: -L - H, y: -OFF }]);
  const wOut1 = mkLane('w-out-1', 'rw-out', 1, [{ x: -H, y: -OFF - LW }, { x: -L - H, y: -OFF - LW }]);

  const nIn = mkLane('n-in', 'rn-in', 0, [{ x: -OFF, y: L + H }, { x: -OFF, y: H }]);
  const nOut = mkLane('n-out', 'rn-out', 0, [{ x: -OFF, y: -H }, { x: -OFF, y: -L - H }]);

  const sIn = mkLane('s-in', 'rs-in', 0, [{ x: OFF, y: -L - H }, { x: OFF, y: -H }]);
  const sOut = mkLane('s-out', 'rs-out', 0, [{ x: OFF, y: H }, { x: OFF, y: L + H }]);

  eIn0.connections = [
    { toLaneId: 'e-out-0', toRoadId: 're-out', turnType: 'straight' },
    { toLaneId: 's-out', toRoadId: 'rs-out', turnType: 'right' }
  ];
  eIn1.connections = [{ toLaneId: 'e-out-1', toRoadId: 're-out', turnType: 'straight' }];

  wIn0.connections = [
    { toLaneId: 'w-out-0', toRoadId: 'rw-out', turnType: 'straight' },
    { toLaneId: 'n-out', toRoadId: 'rn-out', turnType: 'right' }
  ];
  wIn1.connections = [{ toLaneId: 'w-out-1', toRoadId: 'rw-out', turnType: 'straight' }];

  nIn.connections = [
    { toLaneId: 'n-out', toRoadId: 'rn-out', turnType: 'straight' },
    { toLaneId: 'e-out-0', toRoadId: 're-out', turnType: 'right' }
  ];
  sIn.connections = [
    { toLaneId: 's-out', toRoadId: 'rs-out', turnType: 'straight' },
    { toLaneId: 'w-out-0', toRoadId: 'rw-out', turnType: 'right' }
  ];

  const roads: Road[] = [
    { id: 're-in', lanes: [eIn0, eIn1], speedLimit: 13.9, startIntersectionId: null, endIntersectionId: 'ix' },
    { id: 're-out', lanes: [eOut0, eOut1], speedLimit: 13.9, startIntersectionId: 'ix', endIntersectionId: null },
    { id: 'rw-in', lanes: [wIn0, wIn1], speedLimit: 13.9, startIntersectionId: null, endIntersectionId: 'ix' },
    { id: 'rw-out', lanes: [wOut0, wOut1], speedLimit: 13.9, startIntersectionId: 'ix', endIntersectionId: null },
    { id: 'rn-in', lanes: [nIn], speedLimit: 13.9, startIntersectionId: null, endIntersectionId: 'ix' },
    { id: 'rn-out', lanes: [nOut], speedLimit: 13.9, startIntersectionId: 'ix', endIntersectionId: null },
    { id: 'rs-in', lanes: [sIn], speedLimit: 13.9, startIntersectionId: null, endIntersectionId: 'ix' },
    { id: 'rs-out', lanes: [sOut], speedLimit: 13.9, startIntersectionId: 'ix', endIntersectionId: null },
  ];

  const lights: TrafficLight[] = [
    { id: 'tl-e0', intersectionId: 'ix', controlledLaneIds: ['e-in-0', 'e-in-1'], state: LightState.Green, stopPosition: eIn0.length - 5 },
    { id: 'tl-w0', intersectionId: 'ix', controlledLaneIds: ['w-in-0', 'w-in-1'], state: LightState.Green, stopPosition: wIn0.length - 5 },
    { id: 'tl-n', intersectionId: 'ix', controlledLaneIds: ['n-in'], state: LightState.Red, stopPosition: nIn.length - 5 },
    { id: 'tl-s', intersectionId: 'ix', controlledLaneIds: ['s-in'], state: LightState.Red, stopPosition: sIn.length - 5 },
  ];

  const ix: Intersection = {
    id: 'ix',
    position: { x: 0, y: 0 },
    size: ISZ,
    phases: [
      { greenGroups: [['e-in-0', 'e-in-1']], duration: 12, yellowDuration: 3 },
      { greenGroups: [['w-in-0', 'w-in-1']], duration: 12, yellowDuration: 3 },
      { greenGroups: [['n-in']], duration: 10, yellowDuration: 3 },
      { greenGroups: [['s-in']], duration: 10, yellowDuration: 3 }
    ],
    currentPhase: 0,
    phaseTimer: 0,
    inYellow: false,
    lights
  };

  const spawners: VehicleSpawner[] = [
    { laneId: 'e-in-0', rate: 18, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.9 }, { type: VehicleType.Truck, weight: 0.1 }] },
    { laneId: 'e-in-1', rate: 12, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 'w-in-0', rate: 16, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.8 }, { type: VehicleType.Bus, weight: 0.2 }] },
    { laneId: 'w-in-1', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 'n-in', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 's-in', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.8 }, { type: VehicleType.Truck, weight: 0.2 }] }
  ];

  const pedestrians: PedestrianState[] = [
    { id: 'p1', position: { x: -10, y: -10 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.2, destination: { x: 10, y: 10 } },
    { id: 'p2', position: { x: 10, y: -10 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.5, destination: { x: -10, y: 10 } }
  ];

  return {
    name: 'ASTU Tech Hub',
    description: 'Science & Technology University arterial corridor with steady autonomous vehicle pilot flow.',
    roads,
    intersections: [ix],
    spawners,
    pedestrians,
    seed: 42
  };
}

// 2. Addis-Adama Toll Expressway (Rush Hour)
export function createExpresswayScenario(): Scenario {
  const base = createAstuScenario();
  base.name = 'Addis-Adama Toll Expressway';
  base.description = 'Expressway ingress toll gate with heavy freight influx and high traffic density.';
  base.seed = 99;
  base.spawners = [
    { laneId: 'e-in-0', rate: 45, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.6 }, { type: VehicleType.Truck, weight: 0.4 }] },
    { laneId: 'e-in-1', rate: 35, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.8 }, { type: VehicleType.Bus, weight: 0.2 }] },
    { laneId: 'w-in-0', rate: 40, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Truck, weight: 0.5 }] },
    { laneId: 'w-in-1', rate: 30, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.9 }, { type: VehicleType.Bus, weight: 0.1 }] },
    { laneId: 'n-in', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.7 }, { type: VehicleType.Truck, weight: 0.3 }] },
    { laneId: 's-in', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.7 }, { type: VehicleType.Truck, weight: 0.3 }] }
  ];
  return base;
}

// 3. Posta Bet Hub (Accident / Congestion)
export function createPostaBetScenario(): Scenario {
  const base = createAstuScenario();
  base.name = 'Posta Bet Roundabout';
  base.description = 'City Center Hub experiencing multi-vehicle collision and high gridlock risk.';
  base.seed = 101;
  base.spawners = [
    { laneId: 'e-in-0', rate: 30, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.8 }, { type: VehicleType.Bus, weight: 0.2 }] },
    { laneId: 'e-in-1', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 'w-in-0', rate: 28, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.7 }, { type: VehicleType.Truck, weight: 0.3 }] },
    { laneId: 'w-in-1', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 'n-in', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.8 }, { type: VehicleType.Truck, weight: 0.2 }] },
    { laneId: 's-in', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.8 }, { type: VehicleType.Truck, weight: 0.2 }] }
  ];
  return base;
}

// 4. Adama General Hospital (Emergency Corridor)
export function createHospitalScenario(): Scenario {
  const base = createAstuScenario();
  base.name = 'Adama General Hospital';
  base.description = 'Critical medical corridor with active emergency response vehicle dispatches.';
  base.seed = 202;
  base.spawners = [
    { laneId: 'e-in-0', rate: 15, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.8 }, { type: VehicleType.Bus, weight: 0.2 }] },
    { laneId: 'e-in-1', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.7 }, { type: VehicleType.Car, weight: 0.3 }] },
    { laneId: 'w-in-0', rate: 18, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.9 }, { type: VehicleType.Truck, weight: 0.1 }] },
    { laneId: 'w-in-1', rate: 12, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 'n-in', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 's-in', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] }
  ];
  return base;
}

// 5. Wonji Freight Corridor (Road Closure)
export function createWonjiScenario(): Scenario {
  const base = createAstuScenario();
  base.name = 'Wonji Freight Corridor';
  base.description = 'Industrial southern corridor with active maintenance closure and traffic detours.';
  base.seed = 303;
  base.spawners = [
    { laneId: 'e-in-0', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Truck, weight: 0.7 }, { type: VehicleType.Car, weight: 0.3 }] },
    { laneId: 'e-in-1', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Truck, weight: 0.8 }, { type: VehicleType.Car, weight: 0.2 }] },
    { laneId: 'w-in-0', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Truck, weight: 0.6 }, { type: VehicleType.Car, weight: 0.4 }] },
    { laneId: 'w-in-1', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 1.0 }] },
    { laneId: 'n-in', rate: 8, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Truck, weight: 0.5 }] },
    { laneId: 's-in', rate: 8, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Truck, weight: 0.5 }] }
  ];
  return base;
}

export function getScenario3D(id: string): Scenario {
  switch (id) {
    case 'rush_hour':
    case 'expressway':
      return createExpresswayScenario();
    case 'accident':
    case 'posta_bet':
      return createPostaBetScenario();
    case 'emergency':
    case 'hospital':
      return createHospitalScenario();
    case 'road_closure':
    case 'wonji':
      return createWonjiScenario();
    case 'normal':
    case 'astu':
    default:
      return createAstuScenario();
  }
}
