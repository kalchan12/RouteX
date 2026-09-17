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

// 1. ASTU Tech Corridor (4-Way Autonomous Pilot Grid)
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
    { toLaneId: 's-out', toRoadId: 'rs-out', turnType: 'right' },
  ];
  eIn1.connections = [{ toLaneId: 'e-out-1', toRoadId: 're-out', turnType: 'straight' }];

  wIn0.connections = [
    { toLaneId: 'w-out-0', toRoadId: 'rw-out', turnType: 'straight' },
    { toLaneId: 'n-out', toRoadId: 'rn-out', turnType: 'right' },
  ];
  wIn1.connections = [{ toLaneId: 'w-out-1', toRoadId: 'rw-out', turnType: 'straight' }];

  nIn.connections = [
    { toLaneId: 'n-out', toRoadId: 'rn-out', turnType: 'straight' },
    { toLaneId: 'e-out-0', toRoadId: 're-out', turnType: 'right' },
  ];
  sIn.connections = [
    { toLaneId: 's-out', toRoadId: 'rs-out', turnType: 'straight' },
    { toLaneId: 'w-out-0', toRoadId: 'rw-out', turnType: 'right' },
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
      { greenGroups: [['s-in']], duration: 10, yellowDuration: 3 },
    ],
    currentPhase: 0,
    phaseTimer: 0,
    inYellow: false,
    lights,
  };

  const spawners: VehicleSpawner[] = [
    { laneId: 'e-in-0', rate: 18, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Bajaj, weight: 0.2 }, { type: VehicleType.Motorcycle, weight: 0.1 }] },
    { laneId: 'e-in-1', rate: 12, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.6 }, { type: VehicleType.Bus, weight: 0.3 }, { type: VehicleType.Police, weight: 0.1 }] },
    { laneId: 'w-in-0', rate: 16, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Truck, weight: 0.2 }] },
    { laneId: 'w-in-1', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.7 }, { type: VehicleType.Bajaj, weight: 0.3 }] },
    { laneId: 'n-in', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.6 }, { type: VehicleType.Motorcycle, weight: 0.3 }, { type: VehicleType.Police, weight: 0.1 }] },
    { laneId: 's-in', rate: 10, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Truck, weight: 0.2 }] },
  ];

  const pedestrians: PedestrianState[] = [
    { id: 'p1', position: { x: -10, y: -10 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.2, destination: { x: 10, y: 10 } },
    { id: 'p2', position: { x: 10, y: -10 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.5, destination: { x: -10, y: 10 } },
    { id: 'p3', position: { x: -15, y: 12 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.1, destination: { x: 15, y: -12 } },
    { id: 'p4', position: { x: 12, y: 15 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.3, destination: { x: -12, y: -15 } },
  ];

  return {
    name: 'ASTU Tech Hub',
    description: 'Science & Technology University arterial corridor with steady autonomous vehicle pilot flow.',
    roads,
    intersections: [ix],
    spawners,
    pedestrians,
    environment: {
      groundColor: '#2d6a4f',
      grassColor: '#40916c',
      skyColor: '#70c4ff',
      fogColor: '#bde0fe',
      fogDensity: 0.007,
      sunColor: '#fffbeb',
      sunIntensity: 1.6,
      sunPosition: [50, 100, -30],
      landmarkType: 'university',
      weatherName: 'Midday Campus Clear',
    },
    seed: 42,
  };
}

// 2. Addis-Adama Toll Expressway (3-Lane High-Speed Highway with On-Ramp Merge)
export function createExpresswayScenario(): Scenario {
  const expLen = 180;
  const expSpeed = 25.0; // 90 km/h

  // 3 Lanes Eastbound
  const eIn0 = mkLane('exp-e-in-0', 'exp-e-in', 0, [{ x: -expLen, y: OFF }, { x: -H, y: OFF }], expSpeed);
  const eIn1 = mkLane('exp-e-in-1', 'exp-e-in', 1, [{ x: -expLen, y: OFF + LW }, { x: -H, y: OFF + LW }], expSpeed);
  const eIn2 = mkLane('exp-e-in-2', 'exp-e-in', 2, [{ x: -expLen, y: OFF + LW * 2 }, { x: -H, y: OFF + LW * 2 }], expSpeed);

  const eOut0 = mkLane('exp-e-out-0', 'exp-e-out', 0, [{ x: H, y: OFF }, { x: expLen, y: OFF }], expSpeed);
  const eOut1 = mkLane('exp-e-out-1', 'exp-e-out', 1, [{ x: H, y: OFF + LW }, { x: expLen, y: OFF + LW }], expSpeed);
  const eOut2 = mkLane('exp-e-out-2', 'exp-e-out', 2, [{ x: H, y: OFF + LW * 2 }, { x: expLen, y: OFF + LW * 2 }], expSpeed);

  // 3 Lanes Westbound
  const wIn0 = mkLane('exp-w-in-0', 'exp-w-in', 0, [{ x: expLen, y: -OFF }, { x: H, y: -OFF }], expSpeed);
  const wIn1 = mkLane('exp-w-in-1', 'exp-w-in', 1, [{ x: expLen, y: -OFF - LW }, { x: H, y: -OFF - LW }], expSpeed);
  const wIn2 = mkLane('exp-w-in-2', 'exp-w-in', 2, [{ x: expLen, y: -OFF - LW * 2 }, { x: H, y: -OFF - LW * 2 }], expSpeed);

  const wOut0 = mkLane('exp-w-out-0', 'exp-w-out', 0, [{ x: -H, y: -OFF }, { x: -expLen, y: -OFF }], expSpeed);
  const wOut1 = mkLane('exp-w-out-1', 'exp-w-out', 1, [{ x: -H, y: -OFF - LW }, { x: -expLen, y: -OFF - LW }], expSpeed);
  const wOut2 = mkLane('exp-w-out-2', 'exp-w-out', 2, [{ x: -H, y: -OFF - LW * 2 }, { x: -expLen, y: -OFF - LW * 2 }], expSpeed);

  // On-Ramp merging from Toll Gate
  const rampIn = mkLane('exp-ramp-in', 'exp-ramp', 0, [{ x: -60, y: 70 }, { x: -H, y: OFF + LW * 2 }], 16.0);

  eIn0.connections = [{ toLaneId: 'exp-e-out-0', toRoadId: 'exp-e-out', turnType: 'straight' }];
  eIn1.connections = [{ toLaneId: 'exp-e-out-1', toRoadId: 'exp-e-out', turnType: 'straight' }];
  eIn2.connections = [{ toLaneId: 'exp-e-out-2', toRoadId: 'exp-e-out', turnType: 'straight' }];

  wIn0.connections = [{ toLaneId: 'exp-w-out-0', toRoadId: 'exp-w-out', turnType: 'straight' }];
  wIn1.connections = [{ toLaneId: 'exp-w-out-1', toRoadId: 'exp-w-out', turnType: 'straight' }];
  wIn2.connections = [{ toLaneId: 'exp-w-out-2', toRoadId: 'exp-w-out', turnType: 'straight' }];

  rampIn.connections = [{ toLaneId: 'exp-e-out-2', toRoadId: 'exp-e-out', turnType: 'right' }];

  const roads: Road[] = [
    { id: 'exp-e-in', lanes: [eIn0, eIn1, eIn2], speedLimit: expSpeed, startIntersectionId: null, endIntersectionId: 'toll-ix' },
    { id: 'exp-e-out', lanes: [eOut0, eOut1, eOut2], speedLimit: expSpeed, startIntersectionId: 'toll-ix', endIntersectionId: null },
    { id: 'exp-w-in', lanes: [wIn0, wIn1, wIn2], speedLimit: expSpeed, startIntersectionId: null, endIntersectionId: 'toll-ix' },
    { id: 'exp-w-out', lanes: [wOut0, wOut1, wOut2], speedLimit: expSpeed, startIntersectionId: 'toll-ix', endIntersectionId: null },
    { id: 'exp-ramp', lanes: [rampIn], speedLimit: 16.0, startIntersectionId: null, endIntersectionId: 'toll-ix' },
  ];

  const lights: TrafficLight[] = [
    { id: 'tl-exp-e', intersectionId: 'toll-ix', controlledLaneIds: ['exp-e-in-0', 'exp-e-in-1', 'exp-e-in-2'], state: LightState.Green, stopPosition: eIn0.length - 8 },
    { id: 'tl-exp-w', intersectionId: 'toll-ix', controlledLaneIds: ['exp-w-in-0', 'exp-w-in-1', 'exp-w-in-2'], state: LightState.Green, stopPosition: wIn0.length - 8 },
    { id: 'tl-ramp', intersectionId: 'toll-ix', controlledLaneIds: ['exp-ramp-in'], state: LightState.Green, stopPosition: rampIn.length - 4 },
  ];

  const ix: Intersection = {
    id: 'toll-ix',
    position: { x: 0, y: 0 },
    size: 14,
    phases: [
      { greenGroups: [['exp-e-in-0', 'exp-e-in-1', 'exp-e-in-2', 'exp-w-in-0', 'exp-w-in-1', 'exp-w-in-2']], duration: 24, yellowDuration: 3 },
      { greenGroups: [['exp-ramp-in']], duration: 8, yellowDuration: 2 },
    ],
    currentPhase: 0,
    phaseTimer: 0,
    inYellow: false,
    lights,
  };

  const spawners: VehicleSpawner[] = [
    { laneId: 'exp-e-in-0', rate: 35, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Truck, weight: 0.2 }] },
    { laneId: 'exp-e-in-1', rate: 40, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Bus, weight: 0.3 }, { type: VehicleType.Police, weight: 0.2 }] },
    { laneId: 'exp-e-in-2', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Truck, weight: 0.7 }, { type: VehicleType.Car, weight: 0.3 }] },
    { laneId: 'exp-w-in-0', rate: 30, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.6 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Police, weight: 0.1 }] },
    { laneId: 'exp-w-in-1', rate: 35, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Truck, weight: 0.3 }, { type: VehicleType.Bus, weight: 0.2 }] },
    { laneId: 'exp-ramp-in', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Truck, weight: 0.3 }, { type: VehicleType.Motorcycle, weight: 0.2 }] },
  ];

  return {
    name: 'Addis-Adama Toll Expressway',
    description: 'High-speed triple-lane intercity highway corridor with toll ingress and heavy freight flow.',
    roads,
    intersections: [ix],
    spawners,
    environment: {
      groundColor: '#78716c',
      grassColor: '#84cc16',
      skyColor: '#fdba74',
      fogColor: '#ffedd5',
      fogDensity: 0.008,
      sunColor: '#ea580c',
      sunIntensity: 1.8,
      sunPosition: [-80, 50, 60],
      landmarkType: 'toll_plaza',
      weatherName: 'Golden Sunset Express',
    },
    seed: 99,
  };
}

// 3. Posta Bet Roundabout (City Center Rotary & Collision Scenario)
export function createPostaBetScenario(): Scenario {
  const rotRadius = 26;
  const feederLen = 90;

  // Feeder Roads
  const eIn = mkLane('pb-e-in', 'r-pb-e-in', 0, [{ x: -feederLen - rotRadius, y: 0 }, { x: -rotRadius, y: 0 }], 12.0);
  const eOut = mkLane('pb-e-out', 'r-pb-e-out', 0, [{ x: -rotRadius, y: LW }, { x: -feederLen - rotRadius, y: LW }], 12.0);

  const wIn = mkLane('pb-w-in', 'r-pb-w-in', 0, [{ x: feederLen + rotRadius, y: 0 }, { x: rotRadius, y: 0 }], 12.0);
  const wOut = mkLane('pb-w-out', 'r-pb-w-out', 0, [{ x: rotRadius, y: -LW }, { x: feederLen + rotRadius, y: -LW }], 12.0);

  const nIn = mkLane('pb-n-in', 'r-pb-n-in', 0, [{ x: 0, y: feederLen + rotRadius }, { x: 0, y: rotRadius }], 12.0);
  const nOut = mkLane('pb-n-out', 'r-pb-n-out', 0, [{ x: -LW, y: rotRadius }, { x: -LW, y: feederLen + rotRadius }], 12.0);

  const sIn = mkLane('pb-s-in', 'r-pb-s-in', 0, [{ x: 0, y: -feederLen - rotRadius }, { x: 0, y: -rotRadius }], 12.0);
  const sOut = mkLane('pb-s-out', 'r-pb-s-out', 0, [{ x: LW, y: -rotRadius }, { x: LW, y: -feederLen - rotRadius }], 12.0);

  // Rotary Quadrants (Counter-Clockwise)
  const rotEast = mkLane('rot-e', 'r-rot-e', 0, [{ x: -rotRadius, y: 0 }, { x: 0, y: rotRadius }], 11.0);
  const rotNorth = mkLane('rot-n', 'r-rot-n', 0, [{ x: 0, y: rotRadius }, { x: rotRadius, y: 0 }], 11.0);
  const rotWest = mkLane('rot-w', 'r-rot-w', 0, [{ x: rotRadius, y: 0 }, { x: 0, y: -rotRadius }], 11.0);
  const rotSouth = mkLane('rot-s', 'r-rot-s', 0, [{ x: 0, y: -rotRadius }, { x: -rotRadius, y: 0 }], 11.0);

  eIn.connections = [{ toLaneId: 'rot-e', toRoadId: 'r-rot-e', turnType: 'right' }];
  rotEast.connections = [
    { toLaneId: 'pb-n-out', toRoadId: 'r-pb-n-out', turnType: 'right' },
    { toLaneId: 'rot-n', toRoadId: 'r-rot-n', turnType: 'straight' },
  ];

  nIn.connections = [{ toLaneId: 'rot-n', toRoadId: 'r-rot-n', turnType: 'right' }];
  rotNorth.connections = [
    { toLaneId: 'pb-w-out', toRoadId: 'r-pb-w-out', turnType: 'right' },
    { toLaneId: 'rot-w', toRoadId: 'r-rot-w', turnType: 'straight' },
  ];

  wIn.connections = [{ toLaneId: 'rot-w', toRoadId: 'r-rot-w', turnType: 'right' }];
  rotWest.connections = [
    { toLaneId: 'pb-s-out', toRoadId: 'r-pb-s-out', turnType: 'right' },
    { toLaneId: 'rot-s', toRoadId: 'r-rot-s', turnType: 'straight' },
  ];

  sIn.connections = [{ toLaneId: 'rot-s', toRoadId: 'r-rot-s', turnType: 'right' }];
  rotSouth.connections = [
    { toLaneId: 'pb-e-out', toRoadId: 'r-pb-e-out', turnType: 'right' },
    { toLaneId: 'rot-e', toRoadId: 'r-rot-e', turnType: 'straight' },
  ];

  const roads: Road[] = [
    { id: 'r-pb-e-in', lanes: [eIn], speedLimit: 12.0, startIntersectionId: null, endIntersectionId: 'pb-rotary' },
    { id: 'r-pb-e-out', lanes: [eOut], speedLimit: 12.0, startIntersectionId: 'pb-rotary', endIntersectionId: null },
    { id: 'r-pb-w-in', lanes: [wIn], speedLimit: 12.0, startIntersectionId: null, endIntersectionId: 'pb-rotary' },
    { id: 'r-pb-w-out', lanes: [wOut], speedLimit: 12.0, startIntersectionId: 'pb-rotary', endIntersectionId: null },
    { id: 'r-pb-n-in', lanes: [nIn], speedLimit: 12.0, startIntersectionId: null, endIntersectionId: 'pb-rotary' },
    { id: 'r-pb-n-out', lanes: [nOut], speedLimit: 12.0, startIntersectionId: 'pb-rotary', endIntersectionId: null },
    { id: 'r-pb-s-in', lanes: [sIn], speedLimit: 12.0, startIntersectionId: null, endIntersectionId: 'pb-rotary' },
    { id: 'r-pb-s-out', lanes: [sOut], speedLimit: 12.0, startIntersectionId: 'pb-rotary', endIntersectionId: null },
    { id: 'r-rot-e', lanes: [rotEast], speedLimit: 11.0, startIntersectionId: 'pb-rotary', endIntersectionId: 'pb-rotary' },
    { id: 'r-rot-n', lanes: [rotNorth], speedLimit: 11.0, startIntersectionId: 'pb-rotary', endIntersectionId: 'pb-rotary' },
    { id: 'r-rot-w', lanes: [rotWest], speedLimit: 11.0, startIntersectionId: 'pb-rotary', endIntersectionId: 'pb-rotary' },
    { id: 'r-rot-s', lanes: [rotSouth], speedLimit: 11.0, startIntersectionId: 'pb-rotary', endIntersectionId: 'pb-rotary' },
  ];

  const ix: Intersection = {
    id: 'pb-rotary',
    position: { x: 0, y: 0 },
    size: 28,
    phases: [
      { greenGroups: [['pb-e-in', 'pb-w-in', 'rot-e', 'rot-w']], duration: 16, yellowDuration: 3 },
      { greenGroups: [['pb-n-in', 'pb-s-in', 'rot-n', 'rot-s']], duration: 16, yellowDuration: 3 },
    ],
    currentPhase: 0,
    phaseTimer: 0,
    inYellow: false,
    lights: [],
  };

  const spawners: VehicleSpawner[] = [
    { laneId: 'pb-e-in', rate: 26, routes: [], typeWeights: [{ type: VehicleType.MinibusTaxi, weight: 0.35 }, { type: VehicleType.Bajaj, weight: 0.3 }, { type: VehicleType.Car, weight: 0.25 }, { type: VehicleType.Motorcycle, weight: 0.1 }] },
    { laneId: 'pb-w-in', rate: 24, routes: [], typeWeights: [{ type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Car, weight: 0.3 }, { type: VehicleType.Bajaj, weight: 0.25 }, { type: VehicleType.Police, weight: 0.15 }] },
    { laneId: 'pb-n-in', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Motorcycle, weight: 0.2 }, { type: VehicleType.Bus, weight: 0.1 }] },
    { laneId: 'pb-s-in', rate: 22, routes: [], typeWeights: [{ type: VehicleType.Bajaj, weight: 0.35 }, { type: VehicleType.Car, weight: 0.35 }, { type: VehicleType.MinibusTaxi, weight: 0.2 }, { type: VehicleType.Police, weight: 0.1 }] },
  ];

  return {
    name: 'Posta Bet Roundabout',
    description: 'City center commercial roundabout experiencing multi-vehicle collision and complex circular weaving.',
    roads,
    intersections: [ix],
    spawners,
    environment: {
      groundColor: '#1e293b',
      grassColor: '#0284c7',
      skyColor: '#0f172a',
      fogColor: '#020617',
      fogDensity: 0.012,
      sunColor: '#38bdf8',
      sunIntensity: 1.3,
      sunPosition: [30, 80, 30],
      landmarkType: 'monument_rotary',
      weatherName: 'City Center Twilight',
    },
    seed: 101,
  };
}

// 4. Adama General Hospital (T-Junction Priority Emergency Corridor)
export function createHospitalScenario(): Scenario {
  const hLen = 130;

  // East-West Main Boulevard
  const eIn0 = mkLane('h-e-in-0', 'rh-e-in', 0, [{ x: -hLen, y: OFF }, { x: -H, y: OFF }], 15.0);
  const eIn1 = mkLane('h-e-in-1', 'rh-e-in', 1, [{ x: -hLen, y: OFF + LW }, { x: -H, y: OFF + LW }], 15.0);
  const eOut0 = mkLane('h-e-out-0', 'rh-e-out', 0, [{ x: H, y: OFF }, { x: hLen, y: OFF }], 15.0);
  const eOut1 = mkLane('h-e-out-1', 'rh-e-out', 1, [{ x: H, y: OFF + LW }, { x: hLen, y: OFF + LW }], 15.0);

  const wIn0 = mkLane('h-w-in-0', 'rh-w-in', 0, [{ x: hLen, y: -OFF }, { x: H, y: -OFF }], 15.0);
  const wIn1 = mkLane('h-w-in-1', 'rh-w-in', 1, [{ x: hLen, y: -OFF - LW }, { x: H, y: -OFF - LW }], 15.0);
  const wOut0 = mkLane('h-w-out-0', 'rh-w-out', 0, [{ x: -H, y: -OFF }, { x: -hLen, y: -OFF }], 15.0);
  const wOut1 = mkLane('h-w-out-1', 'rh-w-out', 1, [{ x: -H, y: -OFF - LW }, { x: -hLen, y: -OFF - LW }], 15.0);

  // Dedicated Emergency Trauma Bay Ingress Spur
  const emergBayIn = mkLane('h-emerg-in', 'rh-emerg', 0, [{ x: 0, y: 80 }, { x: 0, y: H }], 20.0);
  const emergBayOut = mkLane('h-emerg-out', 'rh-emerg-out', 0, [{ x: LW, y: H }, { x: LW, y: 80 }], 16.0);

  eIn0.connections = [
    { toLaneId: 'h-e-out-0', toRoadId: 'rh-e-out', turnType: 'straight' },
    { toLaneId: 'h-emerg-out', toRoadId: 'rh-emerg-out', turnType: 'left' },
  ];
  eIn1.connections = [{ toLaneId: 'h-e-out-1', toRoadId: 'rh-e-out', turnType: 'straight' }];

  wIn0.connections = [
    { toLaneId: 'h-w-out-0', toRoadId: 'rh-w-out', turnType: 'straight' },
    { toLaneId: 'h-emerg-out', toRoadId: 'rh-emerg-out', turnType: 'right' },
  ];
  wIn1.connections = [{ toLaneId: 'h-w-out-1', toRoadId: 'rh-w-out', turnType: 'straight' }];

  emergBayIn.connections = [
    { toLaneId: 'h-e-out-0', toRoadId: 'rh-e-out', turnType: 'right' },
    { toLaneId: 'h-w-out-0', toRoadId: 'rh-w-out', turnType: 'left' },
  ];

  const roads: Road[] = [
    { id: 'rh-e-in', lanes: [eIn0, eIn1], speedLimit: 15.0, startIntersectionId: null, endIntersectionId: 'hosp-ix' },
    { id: 'rh-e-out', lanes: [eOut0, eOut1], speedLimit: 15.0, startIntersectionId: 'hosp-ix', endIntersectionId: null },
    { id: 'rh-w-in', lanes: [wIn0, wIn1], speedLimit: 15.0, startIntersectionId: null, endIntersectionId: 'hosp-ix' },
    { id: 'rh-w-out', lanes: [wOut0, wOut1], speedLimit: 15.0, startIntersectionId: 'hosp-ix', endIntersectionId: null },
    { id: 'rh-emerg', lanes: [emergBayIn], speedLimit: 20.0, startIntersectionId: null, endIntersectionId: 'hosp-ix' },
    { id: 'rh-emerg-out', lanes: [emergBayOut], speedLimit: 16.0, startIntersectionId: 'hosp-ix', endIntersectionId: null },
  ];

  const lights: TrafficLight[] = [
    { id: 'tl-h-e', intersectionId: 'hosp-ix', controlledLaneIds: ['h-e-in-0', 'h-e-in-1'], state: LightState.Green, stopPosition: eIn0.length - 5 },
    { id: 'tl-h-w', intersectionId: 'hosp-ix', controlledLaneIds: ['h-w-in-0', 'h-w-in-1'], state: LightState.Green, stopPosition: wIn0.length - 5 },
    { id: 'tl-h-emerg', intersectionId: 'hosp-ix', controlledLaneIds: ['h-emerg-in'], state: LightState.Green, stopPosition: emergBayIn.length - 4 },
  ];

  const ix: Intersection = {
    id: 'hosp-ix',
    position: { x: 0, y: 0 },
    size: 10,
    phases: [
      { greenGroups: [['h-emerg-in']], duration: 15, yellowDuration: 2 },
      { greenGroups: [['h-e-in-0', 'h-e-in-1', 'h-w-in-0', 'h-w-in-1']], duration: 18, yellowDuration: 3 },
    ],
    currentPhase: 0,
    phaseTimer: 0,
    inYellow: false,
    lights,
  };

  const spawners: VehicleSpawner[] = [
    { laneId: 'h-emerg-in', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Emergency, weight: 0.6 }, { type: VehicleType.Police, weight: 0.2 }, { type: VehicleType.Car, weight: 0.2 }] },
    { laneId: 'h-e-in-0', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Emergency, weight: 0.2 }] },
    { laneId: 'h-e-in-1', rate: 15, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.6 }, { type: VehicleType.Motorcycle, weight: 0.2 }, { type: VehicleType.Police, weight: 0.2 }] },
    { laneId: 'h-w-in-0', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Emergency, weight: 0.2 }] },
  ];

  return {
    name: 'Adama General Hospital Priority',
    description: 'Medical campus T-junction featuring high-speed emergency response dispatches with traffic preemption.',
    roads,
    intersections: [ix],
    spawners,
    environment: {
      groundColor: '#334155',
      grassColor: '#22c55e',
      skyColor: '#93c5fd',
      fogColor: '#e0f2fe',
      fogDensity: 0.006,
      sunColor: '#ffffff',
      sunIntensity: 1.6,
      sunPosition: [40, 110, -40],
      landmarkType: 'hospital_bay',
      weatherName: 'Clinical Emergency Daylight',
    },
    seed: 202,
  };
}

// 5. Wonji Freight Corridor (Dual Industrial Highway with Detour Bypass)
export function createWonjiScenario(): Scenario {
  const wLen = 140;

  // Main Freight Road (East-West)
  const eMainIn0 = mkLane('w-main-in-0', 'rw-main-in', 0, [{ x: -wLen, y: OFF }, { x: -H, y: OFF }], 14.0);
  const eMainIn1 = mkLane('w-main-in-1', 'rw-main-in', 1, [{ x: -wLen, y: OFF + LW }, { x: -H, y: OFF + LW }], 14.0);
  const eMainOut0 = mkLane('w-main-out-0', 'rw-main-out', 0, [{ x: H, y: OFF }, { x: wLen, y: OFF }], 14.0);
  const eMainOut1 = mkLane('w-main-out-1', 'rw-main-out', 1, [{ x: H, y: OFF + LW }, { x: wLen, y: OFF + LW }], 14.0);

  // Parallel South Industrial Detour Bypass
  const detourIn = mkLane('w-detour-in', 'rw-detour', 0, [{ x: -wLen, y: -45 }, { x: -H, y: -OFF }], 13.0);
  const detourOut = mkLane('w-detour-out', 'rw-detour-out', 0, [{ x: H, y: -OFF }, { x: wLen, y: -45 }], 13.0);

  eMainIn0.connections = [{ toLaneId: 'w-main-out-0', toRoadId: 'rw-main-out', turnType: 'straight' }];
  eMainIn1.connections = [
    { toLaneId: 'w-main-out-1', toRoadId: 'rw-main-out', turnType: 'straight' },
    { toLaneId: 'w-detour-out', toRoadId: 'rw-detour-out', turnType: 'right' },
  ];
  detourIn.connections = [{ toLaneId: 'w-detour-out', toRoadId: 'rw-detour-out', turnType: 'straight' }];

  const roads: Road[] = [
    { id: 'rw-main-in', lanes: [eMainIn0, eMainIn1], speedLimit: 14.0, startIntersectionId: null, endIntersectionId: 'wonji-ix' },
    { id: 'rw-main-out', lanes: [eMainOut0, eMainOut1], speedLimit: 14.0, startIntersectionId: 'wonji-ix', endIntersectionId: null },
    { id: 'rw-detour', lanes: [detourIn], speedLimit: 13.0, startIntersectionId: null, endIntersectionId: 'wonji-ix' },
    { id: 'rw-detour-out', lanes: [detourOut], speedLimit: 13.0, startIntersectionId: 'wonji-ix', endIntersectionId: null },
  ];

  const lights: TrafficLight[] = [
    { id: 'tl-wonji-main', intersectionId: 'wonji-ix', controlledLaneIds: ['w-main-in-0', 'w-main-in-1'], state: LightState.Green, stopPosition: eMainIn0.length - 5 },
    { id: 'tl-wonji-detour', intersectionId: 'wonji-ix', controlledLaneIds: ['w-detour-in'], state: LightState.Green, stopPosition: detourIn.length - 5 },
  ];

  const ix: Intersection = {
    id: 'wonji-ix',
    position: { x: 0, y: 0 },
    size: 10,
    phases: [
      { greenGroups: [['w-main-in-0', 'w-main-in-1']], duration: 18, yellowDuration: 3 },
      { greenGroups: [['w-detour-in']], duration: 12, yellowDuration: 3 },
    ],
    currentPhase: 0,
    phaseTimer: 0,
    inYellow: false,
    lights,
  };

  const spawners: VehicleSpawner[] = [
    { laneId: 'w-main-in-0', rate: 25, routes: [], typeWeights: [{ type: VehicleType.Truck, weight: 0.6 }, { type: VehicleType.MinibusTaxi, weight: 0.2 }, { type: VehicleType.Car, weight: 0.2 }] },
    { laneId: 'w-main-in-1', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Truck, weight: 0.5 }, { type: VehicleType.Car, weight: 0.3 }, { type: VehicleType.Police, weight: 0.2 }] },
    { laneId: 'w-detour-in', rate: 15, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Truck, weight: 0.3 }, { type: VehicleType.Motorcycle, weight: 0.2 }] },
  ];

  return {
    name: 'Wonji Freight Corridor',
    description: 'Industrial heavy haul route with active maintenance closure on main lane and parallel detour bypass.',
    roads,
    intersections: [ix],
    spawners,
    environment: {
      groundColor: '#78350f',
      grassColor: '#b45309',
      skyColor: '#a8a29e',
      fogColor: '#78716c',
      fogDensity: 0.015,
      sunColor: '#d97706',
      sunIntensity: 1.4,
      sunPosition: [30, 60, -50],
      landmarkType: 'industrial_silos',
      weatherName: 'Industrial Dust Haze',
    },
    seed: 303,
  };
}

// 6. Aba Geda Commercial Plaza (Dense Downtown Grid & High Pedestrian Density)
export function createAbaGedaScenario(): Scenario {
  const base = createAstuScenario();
  base.name = 'Aba Geda Commercial Plaza';
  base.description = 'Dense retail and market district with heavy pedestrian crossings and high delivery van activity.';
  base.seed = 404;
  base.spawners = [
    { laneId: 'e-in-0', rate: 22, routes: [], typeWeights: [{ type: VehicleType.Bajaj, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Car, weight: 0.2 }, { type: VehicleType.Motorcycle, weight: 0.1 }] },
    { laneId: 'e-in-1', rate: 18, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Bajaj, weight: 0.3 }, { type: VehicleType.Police, weight: 0.2 }] },
    { laneId: 'w-in-0', rate: 22, routes: [], typeWeights: [{ type: VehicleType.MinibusTaxi, weight: 0.4 }, { type: VehicleType.Bajaj, weight: 0.3 }, { type: VehicleType.Car, weight: 0.3 }] },
    { laneId: 'w-in-1', rate: 15, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Motorcycle, weight: 0.3 }, { type: VehicleType.Bajaj, weight: 0.2 }] },
    { laneId: 'n-in', rate: 16, routes: [], typeWeights: [{ type: VehicleType.Bajaj, weight: 0.4 }, { type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.2 }] },
    { laneId: 's-in', rate: 16, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Truck, weight: 0.3 }] },
  ];
  base.pedestrians = [
    { id: 'p1', position: { x: -15, y: -15 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.1, destination: { x: 15, y: 15 } },
    { id: 'p2', position: { x: 15, y: -15 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.3, destination: { x: -15, y: 15 } },
    { id: 'p3', position: { x: -20, y: 10 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.0, destination: { x: 20, y: -10 } },
    { id: 'p4', position: { x: 10, y: 20 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.2, destination: { x: -10, y: -20 } },
    { id: 'p5', position: { x: -12, y: 5 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.4, destination: { x: 12, y: -5 } },
    { id: 'p6', position: { x: 5, y: -18 }, velocity: { x: 0, y: 0 }, radius: 0.3, desiredSpeed: 1.1, destination: { x: -5, y: 18 } },
  ];
  base.environment = {
    groundColor: '#44403c',
    grassColor: '#16a34a',
    skyColor: '#fef08a',
    fogColor: '#fef9c3',
    fogDensity: 0.008,
    sunColor: '#ca8a04',
    sunIntensity: 1.7,
    sunPosition: [60, 90, 40],
    landmarkType: 'market_stalls',
    weatherName: 'Warm Commercial Afternoon',
  };
  return base;
}

// 7. Franco Transit Depot (Multimodal Transit Hub)
export function createFrancoScenario(): Scenario {
  const base = createAstuScenario();
  base.name = 'Franco Transit Depot';
  base.description = 'Railway terminal transit hub featuring dedicated high-capacity bus logistics and freight lines.';
  base.seed = 505;
  base.spawners = [
    { laneId: 'e-in-0', rate: 30, routes: [], typeWeights: [{ type: VehicleType.Bus, weight: 0.5 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Car, weight: 0.2 }] },
    { laneId: 'e-in-1', rate: 20, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Truck, weight: 0.3 }, { type: VehicleType.Police, weight: 0.2 }] },
    { laneId: 'w-in-0', rate: 28, routes: [], typeWeights: [{ type: VehicleType.Bus, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Truck, weight: 0.3 }] },
    { laneId: 'w-in-1', rate: 18, routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.6 }, { type: VehicleType.Motorcycle, weight: 0.4 }] },
    { laneId: 'n-in', rate: 14, routes: [], typeWeights: [{ type: VehicleType.Bus, weight: 0.4 }, { type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.2 }] },
    { laneId: 's-in', rate: 14, routes: [], typeWeights: [{ type: VehicleType.Truck, weight: 0.5 }, { type: VehicleType.Car, weight: 0.3 }, { type: VehicleType.Police, weight: 0.2 }] },
  ];
  base.environment = {
    groundColor: '#18181b',
    grassColor: '#65a30d',
    skyColor: '#cbd5e1',
    fogColor: '#94a3b8',
    fogDensity: 0.01,
    sunColor: '#fde047',
    sunIntensity: 1.5,
    sunPosition: [-50, 80, -30],
    landmarkType: 'transit_depot',
    weatherName: 'Transit Hub Dawn',
  };
  return base;
}

// 8. Procedural Random Scenario Generator
export function createRandomScenario(customSeed?: number): Scenario {
  const seed = customSeed ?? Math.floor(Math.random() * 900000 + 100000);
  // Deterministic RNG from seed
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const roadLen = Math.floor(80 + rnd() * 80);
  const laneSpeed = Number((11.0 + rnd() * 10.0).toFixed(1));
  const numEastLanes = rnd() > 0.4 ? 2 : 1;
  const numWestLanes = rnd() > 0.4 ? 2 : 1;

  const eInLanes: Lane[] = [];
  const eOutLanes: Lane[] = [];
  for (let i = 0; i < numEastLanes; i++) {
    eInLanes.push(mkLane(`rnd-e-in-${i}`, 'r-rnd-e-in', i, [{ x: -roadLen - H, y: OFF + i * LW }, { x: -H, y: OFF + i * LW }], laneSpeed));
    eOutLanes.push(mkLane(`rnd-e-out-${i}`, 'r-rnd-e-out', i, [{ x: H, y: OFF + i * LW }, { x: roadLen + H, y: OFF + i * LW }], laneSpeed));
  }

  const wInLanes: Lane[] = [];
  const wOutLanes: Lane[] = [];
  for (let i = 0; i < numWestLanes; i++) {
    wInLanes.push(mkLane(`rnd-w-in-${i}`, 'r-rnd-w-in', i, [{ x: roadLen + H, y: -OFF - i * LW }, { x: H, y: -OFF - i * LW }], laneSpeed));
    wOutLanes.push(mkLane(`rnd-w-out-${i}`, 'r-rnd-w-out', i, [{ x: -H, y: -OFF - i * LW }, { x: -roadLen - H, y: -OFF - i * LW }], laneSpeed));
  }

  const nIn = mkLane('rnd-n-in', 'r-rnd-n-in', 0, [{ x: -OFF, y: roadLen + H }, { x: -OFF, y: H }], laneSpeed);
  const nOut = mkLane('rnd-n-out', 'r-rnd-n-out', 0, [{ x: -OFF, y: -H }, { x: -OFF, y: -roadLen - H }], laneSpeed);

  const sIn = mkLane('rnd-s-in', 'r-rnd-s-in', 0, [{ x: OFF, y: -roadLen - H }, { x: OFF, y: -H }], laneSpeed);
  const sOut = mkLane('rnd-s-out', 'r-rnd-s-out', 0, [{ x: OFF, y: H }, { x: OFF, y: roadLen + H }], laneSpeed);

  // Wire connections
  for (let i = 0; i < eInLanes.length; i++) {
    const target = eOutLanes[Math.min(i, eOutLanes.length - 1)]!;
    eInLanes[i]!.connections = [{ toLaneId: target.id, toRoadId: 'r-rnd-e-out', turnType: 'straight' }];
  }
  for (let i = 0; i < wInLanes.length; i++) {
    const target = wOutLanes[Math.min(i, wOutLanes.length - 1)]!;
    wInLanes[i]!.connections = [{ toLaneId: target.id, toRoadId: 'r-rnd-w-out', turnType: 'straight' }];
  }
  nIn.connections = [{ toLaneId: nOut.id, toRoadId: 'r-rnd-n-out', turnType: 'straight' }];
  sIn.connections = [{ toLaneId: sOut.id, toRoadId: 'r-rnd-s-out', turnType: 'straight' }];

  const roads: Road[] = [
    { id: 'r-rnd-e-in', lanes: eInLanes, speedLimit: laneSpeed, startIntersectionId: null, endIntersectionId: 'rnd-ix' },
    { id: 'r-rnd-e-out', lanes: eOutLanes, speedLimit: laneSpeed, startIntersectionId: 'rnd-ix', endIntersectionId: null },
    { id: 'r-rnd-w-in', lanes: wInLanes, speedLimit: laneSpeed, startIntersectionId: null, endIntersectionId: 'rnd-ix' },
    { id: 'r-rnd-w-out', lanes: wOutLanes, speedLimit: laneSpeed, startIntersectionId: 'rnd-ix', endIntersectionId: null },
    { id: 'r-rnd-n-in', lanes: [nIn], speedLimit: laneSpeed, startIntersectionId: null, endIntersectionId: 'rnd-ix' },
    { id: 'r-rnd-n-out', lanes: [nOut], speedLimit: laneSpeed, startIntersectionId: 'rnd-ix', endIntersectionId: null },
    { id: 'r-rnd-s-in', lanes: [sIn], speedLimit: laneSpeed, startIntersectionId: null, endIntersectionId: 'rnd-ix' },
    { id: 'r-rnd-s-out', lanes: [sOut], speedLimit: laneSpeed, startIntersectionId: 'rnd-ix', endIntersectionId: null },
  ];

  const lights: TrafficLight[] = [
    { id: 'tl-rnd-e', intersectionId: 'rnd-ix', controlledLaneIds: eInLanes.map(l => l.id), state: LightState.Green, stopPosition: eInLanes[0]!.length - 5 },
    { id: 'tl-rnd-w', intersectionId: 'rnd-ix', controlledLaneIds: wInLanes.map(l => l.id), state: LightState.Green, stopPosition: wInLanes[0]!.length - 5 },
    { id: 'tl-rnd-n', intersectionId: 'rnd-ix', controlledLaneIds: [nIn.id], state: LightState.Red, stopPosition: nIn.length - 5 },
    { id: 'tl-rnd-s', intersectionId: 'rnd-ix', controlledLaneIds: [sIn.id], state: LightState.Red, stopPosition: sIn.length - 5 },
  ];

  const duration = Math.floor(10 + rnd() * 14);
  const ix: Intersection = {
    id: 'rnd-ix',
    position: { x: 0, y: 0 },
    size: ISZ,
    phases: [
      { greenGroups: [eInLanes.map(l => l.id)], duration, yellowDuration: 3 },
      { greenGroups: [wInLanes.map(l => l.id)], duration, yellowDuration: 3 },
      { greenGroups: [[nIn.id]], duration: 8, yellowDuration: 2 },
      { greenGroups: [[sIn.id]], duration: 8, yellowDuration: 2 },
    ],
    currentPhase: 0,
    phaseTimer: 0,
    inYellow: false,
    lights,
  };

  const spawners: VehicleSpawner[] = [
    { laneId: eInLanes[0]!.id, rate: Math.floor(15 + rnd() * 25), routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }, { type: VehicleType.Truck, weight: 0.2 }, { type: VehicleType.Police, weight: 0.1 }] },
    { laneId: wInLanes[0]!.id, rate: Math.floor(15 + rnd() * 25), routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.Bajaj, weight: 0.3 }, { type: VehicleType.Bus, weight: 0.2 }, { type: VehicleType.Motorcycle, weight: 0.1 }] },
    { laneId: nIn.id, rate: Math.floor(8 + rnd() * 15), routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.5 }, { type: VehicleType.Motorcycle, weight: 0.3 }, { type: VehicleType.Police, weight: 0.2 }] },
    { laneId: sIn.id, rate: Math.floor(8 + rnd() * 15), routes: [], typeWeights: [{ type: VehicleType.Car, weight: 0.4 }, { type: VehicleType.Emergency, weight: 0.3 }, { type: VehicleType.MinibusTaxi, weight: 0.3 }] },
  ];

  return {
    name: `Sector #${seed.toString().slice(-4)} (Procedural)`,
    description: `Procedurally generated road network with ${numEastLanes + numWestLanes + 2} branches, seed #${seed}, and adaptive signal phases.`,
    roads,
    intersections: [ix],
    spawners,
    environment: {
      groundColor: '#0b0f19',
      grassColor: '#06b6d4',
      skyColor: '#3b0764',
      fogColor: '#1e1b4b',
      fogDensity: 0.012,
      sunColor: '#e879f9',
      sunIntensity: 1.6,
      sunPosition: [0, 80, 0],
      landmarkType: 'cyber_grid',
      weatherName: 'Procedural Cyber Sector',
    },
    seed,
  };
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
    case 'geda_plaza':
      return createAbaGedaScenario();
    case 'franco':
      return createFrancoScenario();
    case 'random':
      return createRandomScenario();
    case 'normal':
    case 'astu':
    default:
      return createAstuScenario();
  }
}
