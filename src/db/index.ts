import Dexie, { Table } from 'dexie';
import { ScenarioConfig, SimulationSnapshot, ScenarioNetwork } from '../types';

export interface SavedSimulation {
  id?: number;
  name: string;
  scenarioId: string;
  createdAt: number;
  completedAt?: number;
  metrics: {
    totalVehicles: number;
    arrivedVehicles: number;
    averageSpeed: number;
    averageTravelTime: number;
    averageCongestion: number;
  };
  snapshots?: SimulationSnapshot[];
}

export interface SavedNetwork {
  id: string;
  name: string;
  description?: string;
  network: ScenarioNetwork;
  createdAt: number;
  updatedAt: number;
}

export interface BenchmarkRecord {
  id?: number;
  scenarioId: string;
  algorithm: string;
  averageTravelTime: number;
  averageCongestion: number;
  throughput: number;
  executionTimeMs: number;
  createdAt: number;
}

export class RouteXDatabase extends Dexie {
  simulations!: Table<SavedSimulation, number>;
  networks!: Table<SavedNetwork, string>;
  scenarios!: Table<ScenarioConfig, string>;
  benchmarks!: Table<BenchmarkRecord, number>;

  constructor() {
    super('RouteXDatabase');
    this.version(1).stores({
      simulations: '++id, scenarioId, name, createdAt',
      networks: 'id, name, createdAt',
      scenarios: 'id, name, type',
      benchmarks: '++id, scenarioId, algorithm, createdAt',
    });
  }
}

export const db = new RouteXDatabase();
