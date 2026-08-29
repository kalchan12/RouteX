import { OSMResponse } from '../providers/OverpassProvider';
import { createENUProjection } from '../projections/enu';
import { SimulationWorld, RoadSegment } from '../worldTypes';

export function parseOSMToWorld(
  osmData: OSMResponse,
  centerLat: number,
  centerLng: number,
): SimulationWorld {
  const proj = createENUProjection(centerLat, centerLng);
  const nodesMap = new Map<number, { lat: number; lon: number }>();
  
  for (const el of osmData.elements) {
    if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
      nodesMap.set(el.id, { lat: el.lat, lon: el.lon });
    }
  }

  const world: SimulationWorld = {
    bounds: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    roads: [],
    buildings: [],
    signals: [],
    crossings: [],
    trees: [],
    parks: [],
    water: [],
    pois: []
  };

  const updateBounds = (x: number, y: number) => {
    if (x < world.bounds.minX) world.bounds.minX = x;
    if (x > world.bounds.maxX) world.bounds.maxX = x;
    if (y < world.bounds.minY) world.bounds.minY = y;
    if (y > world.bounds.maxY) world.bounds.maxY = y;
  };

  const getPoints = (nodeIds: number[] | undefined) => {
    if (!nodeIds) return [];
    const pts = [];
    for (const nid of nodeIds) {
      const node = nodesMap.get(nid);
      if (node) {
        const pt = proj.project(node.lat, node.lon);
        updateBounds(pt.x, pt.y);
        pts.push(pt);
      }
    }
    return pts;
  };

  for (const el of osmData.elements) {
    if (el.type === 'way' && el.tags) {
      if (el.tags['highway']) {
        const type = el.tags['highway'];
        const points = getPoints(el.nodes);
        if (points.length < 2) continue;

        let width = 6;
        let hierarchy: RoadSegment['hierarchy'] = 'residential';
        let color = 0x555555;
        
        switch (type) {
          case 'motorway': width = 14; hierarchy = 'motorway'; color = 0x333333; break;
          case 'trunk': width = 12; hierarchy = 'trunk'; color = 0x444444; break;
          case 'primary': width = 10; hierarchy = 'primary'; color = 0x555555; break;
          case 'secondary': width = 8; hierarchy = 'secondary'; color = 0x666666; break;
          case 'tertiary': width = 7; hierarchy = 'tertiary'; color = 0x777777; break;
          case 'residential': width = 6; hierarchy = 'residential'; color = 0x888888; break;
          case 'service': width = 4; hierarchy = 'service'; color = 0x999999; break;
          case 'footway': width = 2; hierarchy = 'footway'; color = 0xaaaaaa; break;
          default: width = 6; hierarchy = 'residential'; break;
        }

        let speedLimit = 30;
        if (el.tags['maxspeed']) {
          const parsed = parseInt(el.tags['maxspeed']);
          if (!isNaN(parsed)) speedLimit = parsed;
        } else if (hierarchy === 'primary') {
          speedLimit = 50;
        }
        
        const lanes = el.tags['lanes'] ? parseInt(el.tags['lanes']) || 1 : 1;

        world.roads.push({
          id: `road_${el.id}`,
          osmWayId: el.id,
          points,
          width,
          lanes,
          laneWidth: width / lanes,
          direction: el.tags['oneway'] === 'yes' ? 'oneway' : 'twoway',
          hierarchy,
          speedLimit,
          name: el.tags['name'] || null,
          color,
          opacity: 1
        });
      } else if (el.tags['building']) {
        const points = getPoints(el.nodes);
        if (points.length < 3) continue;

        const levels = parseInt(el.tags['building:levels'] || '0');
        const finalLevels = levels ? levels : 2;
        const bType = el.tags['building'];
        let color = 0x333333;

        if (bType === 'residential') { color = 0x22222d; }
        else if (bType === 'commercial' || bType === 'retail') { color = 0x252530; }
        else if (bType === 'industrial') { color = 0x2a2a35; }
        else if (bType === 'public') { color = 0x303040; }

        world.buildings.push({
          id: `bldg_${el.id}`,
          polygon: points,
          levels: finalLevels,
          color,
          opacity: 1
        });
      } else if (el.tags['leisure'] === 'park' || el.tags['landuse'] === 'grass') {
        const points = getPoints(el.nodes);
        if (points.length >= 3) {
          world.parks.push({
            id: `park_${el.id}`,
            polygon: points,
          });
        }
      } else if (el.tags['natural'] === 'water') {
        const points = getPoints(el.nodes);
        if (points.length >= 3) {
          world.water.push({
            id: `water_${el.id}`,
            polygon: points,
          });
        }
      }
    } else if (el.type === 'node' && el.tags && el.lat && el.lon) {
      const pt = proj.project(el.lat, el.lon);
      updateBounds(pt.x, pt.y);

      if (el.tags['highway'] === 'traffic_signals') {
        world.signals.push({
          id: `signal_${el.id}`,
          position: pt,
          state: 'red',
          timer: 30
        });
      } else if (el.tags['highway'] === 'crossing') {
        world.crossings.push({
          id: `crossing_${el.id}`,
          position: pt,
          width: 4,
        });
      } else if (el.tags['natural'] === 'tree') {
        world.trees.push({
          id: `tree_${el.id}`,
          position: pt,
          radius: 2,
        });
      }
    }
  }

  if (world.bounds.minX === Infinity) {
    world.bounds = { minX: -100, minY: -100, maxX: 100, maxY: 100 };
  }

  return world;
}
