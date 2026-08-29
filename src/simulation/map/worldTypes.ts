import { WorldCoord } from './projections/enu';

export interface RoadSegment {
  id: string;
  osmWayId: number;
  points: WorldCoord[];
  width: number;
  lanes: number;
  laneWidth: number;
  direction: 'oneway' | 'twoway';
  hierarchy: 'motorway' | 'trunk' | 'primary' | 'secondary' | 'tertiary' | 'residential' | 'service' | 'footway';
  speedLimit: number;
  name: string | null;
  color: number;
  opacity: number;
}

export interface Building {
  id: string;
  polygon: WorldCoord[];
  levels: number;
  color: number;
  opacity: number;
}

export interface TrafficSignal {
  id: string;
  position: WorldCoord;
  state: 'red' | 'green' | 'yellow';
  timer: number;
}

export interface Crossing {
  id: string;
  position: WorldCoord;
  width: number;
}

export interface Tree {
  id: string;
  position: WorldCoord;
  radius: number;
}

export interface Park {
  id: string;
  polygon: WorldCoord[];
}

export interface WaterBody {
  id: string;
  polygon: WorldCoord[];
}

export interface POI {
  id: string;
  position: WorldCoord;
  type: string;
  name: string;
}

export interface SimulationWorld {
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  roads: RoadSegment[];
  buildings: Building[];
  signals: TrafficSignal[];
  crossings: Crossing[];
  trees: Tree[];
  parks: Park[];
  water: WaterBody[];
  pois: POI[];
}
