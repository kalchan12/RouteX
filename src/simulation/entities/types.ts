import { Vector2 } from '../camera/Camera';

export enum EntityType {
  CAR,
  TRUCK,
  BUS,
  AMBULANCE,
  POLICE,
  FIRE_TRUCK,
  PEDESTRIAN
}

export enum VehicleState {
  CRUISING,
  ACCELERATING,
  DECELERATING,
  STOPPED_SIGNAL,
  STOPPED_TRAFFIC,
  TURNING,
  YIELDING,
  EMERGENCY_PULL_OVER,
  ARRIVED,
  RESPONDING
}

export interface SimVehicle {
  id: string;
  type: EntityType;
  position: Vector2;
  velocity: Vector2;
  heading: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  length: number;
  width: number;
  color: number;
  route: Vector2[];
  state: VehicleState;
}

export interface SimPedestrian {
  id: string;
  type: EntityType.PEDESTRIAN;
  position: Vector2;
  velocity: Vector2;
  heading: number;
  speed: number;
  maxSpeed: number;
  radius: number;
  color: number;
  route: Vector2[];
}

export const VEHICLE_DEFAULTS: Record<EntityType, Partial<SimVehicle | SimPedestrian>> = {
  [EntityType.CAR]: {
    maxSpeed: 15,
    acceleration: 2,
    deceleration: 3,
    length: 4.5,
    width: 2,
    color: 0x3366ff
  },
  [EntityType.TRUCK]: {
    maxSpeed: 10,
    acceleration: 1,
    deceleration: 2,
    length: 8,
    width: 2.5,
    color: 0xcc6600
  },
  [EntityType.BUS]: {
    maxSpeed: 12,
    acceleration: 1.5,
    deceleration: 2.5,
    length: 12,
    width: 2.5,
    color: 0x00cc66
  },
  [EntityType.AMBULANCE]: {
    maxSpeed: 20,
    acceleration: 3,
    deceleration: 4,
    length: 5.5,
    width: 2.2,
    color: 0xff3333
  },
  [EntityType.POLICE]: {
    maxSpeed: 22,
    acceleration: 4,
    deceleration: 5,
    length: 4.8,
    width: 2,
    color: 0x0000ff
  },
  [EntityType.FIRE_TRUCK]: {
    maxSpeed: 18,
    acceleration: 2.5,
    deceleration: 3.5,
    length: 10,
    width: 2.5,
    color: 0xff0000
  },
  [EntityType.PEDESTRIAN]: {
    maxSpeed: 1.5,
    radius: 0.5,
    color: 0xffffff
  }
};
