import Dexie, { Table } from 'dexie';
import { OSMResponse } from '../providers/OverpassProvider';

export interface CacheEntry {
  key: string;
  lat: number;
  lng: number;
  radius: number;
  timestamp: number;
  data: OSMResponse;
}

export class OSMCacheDB extends Dexie {
  osmCache!: Table<CacheEntry, string>;

  constructor() {
    super('RouteX_OSMCache');
    this.version(1).stores({
      osmCache: 'key, timestamp'
    });
  }
}

const db = new OSMCacheDB();

export class OSMCache {
  private getGridKey(lat: number, lng: number, radius: number): string {
    const rLat = Math.round(lat / 0.005) * 0.005;
    const rLng = Math.round(lng / 0.005) * 0.005;
    return `${rLat.toFixed(4)}_${rLng.toFixed(4)}_${radius}`;
  }

  async get(lat: number, lng: number, radius: number): Promise<OSMResponse | null> {
    try {
      const key = this.getGridKey(lat, lng, radius);
      const entry = await db.osmCache.get(key);
      
      if (entry) {
        const age = Date.now() - entry.timestamp;
        if (age < 7 * 24 * 60 * 60 * 1000) {
          return entry.data;
        } else {
          await db.osmCache.delete(key);
        }
      }
    } catch (e) {
      console.warn('Failed to read from OSM Cache', e);
    }
    return null;
  }

  async set(lat: number, lng: number, radius: number, data: OSMResponse): Promise<void> {
    try {
      const key = this.getGridKey(lat, lng, radius);
      await db.osmCache.put({
        key,
        lat,
        lng,
        radius,
        timestamp: Date.now(),
        data
      });
    } catch (e) {
      console.warn('Failed to write to OSM Cache', e);
    }
  }

  async clear(): Promise<void> {
    try {
      await db.osmCache.clear();
    } catch (e) {
      console.warn('Failed to clear OSM Cache', e);
    }
  }
}
