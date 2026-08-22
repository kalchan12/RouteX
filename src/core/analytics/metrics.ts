import { SimulationSnapshot } from '../simulation/state';

export interface TimeSeriesPoint {
  tick: number;
  value: number;
}

export interface MetricsData {
  travelTime: TimeSeriesPoint[];
  speed: TimeSeriesPoint[];
  throughput: TimeSeriesPoint[];
  congestion: TimeSeriesPoint[];
  waitingTime: TimeSeriesPoint[];
  emergencyResponse: TimeSeriesPoint[];
  vehicleCount: TimeSeriesPoint[];
  arrivedCount: TimeSeriesPoint[];
}

export class MetricsTracker {
  private data: MetricsData = {
    travelTime: [],
    speed: [],
    throughput: [],
    congestion: [],
    waitingTime: [],
    emergencyResponse: [],
    vehicleCount: [],
    arrivedCount: [],
  };

  update(snapshot: SimulationSnapshot): void {
    this.data.travelTime.push({ tick: snapshot.tick, value: snapshot.metrics.avgTravelTime });
    this.data.speed.push({ tick: snapshot.tick, value: snapshot.metrics.avgSpeed });
    this.data.throughput.push({ tick: snapshot.tick, value: snapshot.metrics.totalThroughput });
    this.data.congestion.push({ tick: snapshot.tick, value: snapshot.metrics.avgCongestion });
    this.data.waitingTime.push({ tick: snapshot.tick, value: snapshot.metrics.totalWaitingTime });
    this.data.emergencyResponse.push({ tick: snapshot.tick, value: snapshot.metrics.emergencyResponseTime ?? 0 });
    this.data.vehicleCount.push({ tick: snapshot.tick, value: snapshot.vehicleCount });
    this.data.arrivedCount.push({ tick: snapshot.tick, value: snapshot.arrivedCount });
  }

  getData(): MetricsData {
    return { ...this.data };
  }

  getSeries(key: keyof MetricsData): TimeSeriesPoint[] {
    return [...this.data[key]];
  }

  reset(): void {
    for (const key of Object.keys(this.data) as Array<keyof MetricsData>) {
      this.data[key] = [];
    }
  }

  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    
    for (const [key, series] of Object.entries(this.data)) {
      if (series.length === 0) {
        summary[key] = 0;
        continue;
      }
      const values = series.map(p => p.value);
      const sum = values.reduce((a, b) => a + b, 0);
      summary[`${key}_avg`] = sum / values.length;
      summary[`${key}_max`] = Math.max(...values);
      summary[`${key}_min`] = Math.min(...values);
      summary[`${key}_last`] = values[values.length - 1];
    }
    
    return summary;
  }
}

export function createMetricsTracker(): MetricsTracker {
  return new MetricsTracker();
}