import { ScenarioTrafficLight } from '../../types';

export interface TrafficLight {
  nodeId: string;
  greenDuration: number;
  redDuration: number;
  offset: number;
  state: 'green' | 'red';
  stateTimer: number;
}

export function buildLights(
  scenarioLights: ScenarioTrafficLight[]
): Map<string, TrafficLight> {
  const lights = new Map<string, TrafficLight>();
  
  for (const lightConfig of scenarioLights) {
    lights.set(lightConfig.nodeId, {
      nodeId: lightConfig.nodeId,
      greenDuration: lightConfig.greenDuration,
      redDuration: lightConfig.redDuration,
      offset: lightConfig.offset,
      state: 'green',
      stateTimer: lightConfig.offset,
    });
  }
  
  return lights;
}

export function stepLights(lights: Map<string, TrafficLight>): void {
  for (const light of lights.values()) {
    light.stateTimer++;
    
    if (light.state === 'green' && light.stateTimer >= light.greenDuration) {
      light.state = 'red';
      light.stateTimer = 0;
    } else if (light.state === 'red' && light.stateTimer >= light.redDuration) {
      light.state = 'green';
      light.stateTimer = 0;
    }
  }
}

export function getLightForNode(lights: Map<string, TrafficLight>, nodeId: string): TrafficLight | null {
  return lights.get(nodeId) ?? null;
}

export function isGreen(light: TrafficLight | null): boolean {
  return light?.state === 'green';
}