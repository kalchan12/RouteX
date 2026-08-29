import { SimulationWorld } from '../worldTypes';
import { fetchOSMData } from '../providers/OverpassProvider';
import { parseOSMToWorld } from '../parsers/OSMParser';

export interface WorldBuildResult {
  world: SimulationWorld;
  loadTimeMs: number;
  featureCounts: {
    roads: number;
    buildings: number;
    signals: number;
    crossings: number;
    trees: number;
    parks: number;
    water: number;
  };
}

export async function buildWorldFromGPS(
  lat: number,
  lng: number,
  radiusMeters: number = 800,
): Promise<WorldBuildResult> {
  const start = performance.now();
  
  try {
    const osmData = await fetchOSMData(lat, lng, radiusMeters);
    const world = parseOSMToWorld(osmData, lat, lng);
    
    const loadTimeMs = performance.now() - start;
    
    return {
      world,
      loadTimeMs,
      featureCounts: {
        roads: world.roads.length,
        buildings: world.buildings.length,
        signals: world.signals.length,
        crossings: world.crossings.length,
        trees: world.trees.length,
        parks: world.parks.length,
        water: world.water.length,
      }
    };
  } catch (error) {
    console.error('Failed to build world from GPS:', error);
    throw error;
  }
}
