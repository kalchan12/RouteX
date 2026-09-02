// 3D Simulation Engine — barrel export
export { SimulationEngine } from './SimulationEngine';
export { RoadNetwork } from './RoadNetwork';
export { TrafficLightController } from './TrafficLightController';
export { createDefaultScenario } from './defaultScenario';
export { createVehicle, vehicleIDM, resetIds } from './Vehicle';
export { idmAcceleration, idmFreeAccel, CAR_PARAMS, TRUCK_PARAMS, BUS_PARAMS } from './IDM';
export { shouldChangeLane } from './MOBIL';
export { computePedestrianForces } from './SocialForce';
export { canSafelyTurn } from './GapAcceptance';
export type {
  Vec2, VehicleState, IDMParams, Lane, LaneConnection, Road,
  TrafficLight, Phase, Intersection, VehicleSpawner, Scenario,
  SimulationSnapshot as Sim3DSnapshot, PedestrianState,
} from './types';
export { VehicleType, LightState } from './types';
