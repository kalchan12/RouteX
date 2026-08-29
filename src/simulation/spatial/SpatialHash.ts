import { Vector2 } from '../camera/Camera';

export interface Positionable {
  position: Vector2;
  id: string;
}

export class SpatialHash<T extends Positionable> {
  private cellSize: number;
  private map: Map<string, T[]> = new Map();
  private countTotal = 0;

  constructor(cellSize: number = 20) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  public clear(): void {
    this.map.clear();
    this.countTotal = 0;
  }

  public insert(entity: T): void {
    const key = this.getKey(entity.position.x, entity.position.y);
    let cell = this.map.get(key);
    if (!cell) {
      cell = [];
      this.map.set(key, cell);
    }
    cell.push(entity);
    this.countTotal++;
  }

  public insertAll(entities: T[]): void {
    for (const entity of entities) {
      this.insert(entity);
    }
  }

  public queryRadius(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);
    const r2 = radius * radius;

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const key = `${cx},${cy}`;
        const cell = this.map.get(key);
        if (cell) {
          for (const entity of cell) {
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            if (dx * dx + dy * dy <= r2) {
              results.push(entity);
            }
          }
        }
      }
    }
    return results;
  }

  public queryRect(minX: number, minY: number, maxX: number, maxY: number): T[] {
    const results: T[] = [];
    const startX = Math.floor(minX / this.cellSize);
    const endX = Math.floor(maxX / this.cellSize);
    const startY = Math.floor(minY / this.cellSize);
    const endY = Math.floor(maxY / this.cellSize);

    for (let cy = startY; cy <= endY; cy++) {
      for (let cx = startX; cx <= endX; cx++) {
        const key = `${cx},${cy}`;
        const cell = this.map.get(key);
        if (cell) {
          for (const entity of cell) {
            const ex = entity.position.x;
            const ey = entity.position.y;
            if (ex >= minX && ex <= maxX && ey >= minY && ey <= maxY) {
              results.push(entity);
            }
          }
        }
      }
    }
    return results;
  }

  public nearest(x: number, y: number, maxRadius: number = 100): T | null {
    let best: T | null = null;
    let bestDist2 = maxRadius * maxRadius;

    const minX = Math.floor((x - maxRadius) / this.cellSize);
    const maxX = Math.floor((x + maxRadius) / this.cellSize);
    const minY = Math.floor((y - maxRadius) / this.cellSize);
    const maxY = Math.floor((y + maxRadius) / this.cellSize);

    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const key = `${cx},${cy}`;
        const cell = this.map.get(key);
        if (cell) {
          for (const entity of cell) {
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= bestDist2) {
              bestDist2 = d2;
              best = entity;
            }
          }
        }
      }
    }
    return best;
  }

  public count(): number {
    return this.countTotal;
  }
}
