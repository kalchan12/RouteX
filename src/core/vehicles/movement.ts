import { Vehicle, RoadNetwork, VehicleState } from '../../types';
import { TrafficLight, getLightForNode } from '../traffic/trafficLights';

const DT = 1.0;
const VEHICLE_LENGTH = 5.0; // meters
const SAFE_FOLLOWING_TIME = 1.5; // seconds

export function updateVehicleKinematics(
  vehicles: Vehicle[],
  network: RoadNetwork,
  lights: Map<string, TrafficLight>,
  advanceCallback: (v: Vehicle) => void
): void {
  const edgeVehicles = new Map<string, Vehicle[]>();

  for (const v of vehicles) {
    if (v.arrived || !v.currentEdge) continue;
    let list = edgeVehicles.get(v.currentEdge);
    if (!list) {
      list = [];
      edgeVehicles.set(v.currentEdge, list);
    }
    list.push(v);
  }

  for (const [edgeId, list] of edgeVehicles) {
    const edge = network.edges.get(edgeId);
    if (!edge) continue;

    list.sort((a, b) => b.progress - a.progress);

    const light = getLightForNode(lights, edge.destination);
    const hasRedLight = light && light.state !== 'green';

    let leaderDistance = hasRedLight ? edge.distance : Infinity;
    let leaderSpeed = 0;

    for (const vehicle of list) {
      const position = vehicle.progress * edge.distance;
      const distanceToLeader = leaderDistance - position - VEHICLE_LENGTH;

      let targetSpeed = Math.min(vehicle.maxSpeed, edge.speedLimit);

      if (distanceToLeader < 50) {
        const requiredBrakingDist = (vehicle.speed * vehicle.speed) / (2 * vehicle.deceleration);
        const safeDist = requiredBrakingDist + (vehicle.speed * SAFE_FOLLOWING_TIME);

        if (distanceToLeader < safeDist) {
           targetSpeed = Math.min(targetSpeed, leaderSpeed);
        }
        
        if (distanceToLeader < 5) {
           targetSpeed = 0;
        }
      }

      if (vehicle.speed < targetSpeed) {
        vehicle.speed = Math.min(vehicle.speed + vehicle.acceleration * DT, targetSpeed);
        vehicle.state = VehicleState.MOVING;
      } else if (vehicle.speed > targetSpeed) {
        vehicle.speed = Math.max(vehicle.speed - vehicle.deceleration * DT, targetSpeed);
        vehicle.state = VehicleState.SLOWING;
      }

      if (vehicle.speed < 0.1 && targetSpeed === 0) {
        vehicle.speed = 0;
        vehicle.state = VehicleState.STOPPED;
      }

      const distanceMoved = vehicle.speed * DT;
      vehicle.progress += distanceMoved / edge.distance;

      leaderDistance = position;
      leaderSpeed = vehicle.speed;

      if (vehicle.progress >= 1.0) {
        advanceCallback(vehicle);
      }
    }
  }
}
