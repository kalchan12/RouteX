import { Road, RoadStatus, RoadType } from '../shared/types';

export function createRoad(params: {
  id: string;
  source: string;
  destination: string;
  distance: number;
  speedLimit: number;
  capacity: number;
  lanes?: number;
  roadType?: RoadType;
  status?: RoadStatus;
  priority?: number;
}): Road {
  const {
    id,
    source,
    destination,
    distance,
    speedLimit,
    capacity,
    lanes = 1,
    roadType = RoadType.STREET,
    status = RoadStatus.OPEN,
    priority = 0,
  } = params;

  if (distance <= 0) throw new Error(`road ${id}: distance must be positive`);
  if (speedLimit <= 0) throw new Error(`road ${id}: speedLimit must be positive`);
  if (capacity <= 0) throw new Error(`road ${id}: capacity must be positive`);

  const baseTravelTime = distance / speedLimit;

  return {
    id,
    source,
    destination,
    distance,
    speedLimit,
    capacity,
    lanes,
    roadType,
    status,
    priority,
    currentVehicleCount: 0,
    congestion: 0,
    baseTravelTime,
    currentTravelTime: baseTravelTime,
  };
}

export function roadToDict(road: Road): Record<string, unknown> {
  return {
    id: road.id,
    source: road.source,
    destination: road.destination,
    distance: road.distance,
    speedLimit: road.speedLimit,
    capacity: road.capacity,
    lanes: road.lanes,
    roadType: road.roadType,
    status: road.status,
    currentVehicleCount: road.currentVehicleCount,
    congestion: road.congestion,
    baseTravelTime: road.baseTravelTime,
    currentTravelTime: road.currentTravelTime,
  };
}

export function isTraversable(road: Road): boolean {
  return road.status === RoadStatus.OPEN;
}

export function congestionFactor(congestion: number): number {
  if (congestion <= 0.3) return 1.0;
  if (congestion <= 0.7) return 1.0 + 2.0 * (congestion - 0.3);
  return 1.8 + 10.0 * (congestion - 0.7);
}

export function updateRoadDynamicState(road: Road, vehicleCount: number): void {
  road.currentVehicleCount = vehicleCount;
  road.congestion = road.capacity > 0 ? vehicleCount / road.capacity : 1.0;
  road.currentTravelTime = road.baseTravelTime * congestionFactor(road.congestion);
}