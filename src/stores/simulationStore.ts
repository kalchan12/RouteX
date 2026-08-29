import { create } from 'zustand';
import { SimulationSnapshot, ScenarioConfig, SimulationStatus } from '../types';

export interface TelemetryPoint {
  tick: number;
  time: string;
  throughput: number;
  speed: number;
  congestion: number;
  vehicles: number;
}

interface SimulationStoreState {
  status: SimulationStatus;
  snapshot: SimulationSnapshot | null;
  selectedScenarioId: string;
  scenarios: ScenarioConfig[];
  isWorkerReady: boolean;
  selectedVehicleId: string | null;
  selectedRoadId: string | null;
  
  // Dashboard & Navigation State
  viewMode: 'map' | 'simulation';
  activeTab: 'controls' | 'network' | 'algorithms' | 'incidents';
  selectedAlgorithm: 'dijkstra' | 'astar' | 'dynamic_hld';
  simSpeed: number;
  highFidelity3D: boolean;
  activeRegionId: string | null;
  timeSeriesData: TelemetryPoint[];
  notificationCount: number;

  // Actions
  setStatus: (status: SimulationStatus) => void;
  setSnapshot: (snapshot: SimulationSnapshot | null) => void;
  setSelectedScenarioId: (id: string) => void;
  setScenarios: (scenarios: ScenarioConfig[]) => void;
  setIsWorkerReady: (ready: boolean) => void;
  setSelectedVehicleId: (id: string | null) => void;
  setSelectedRoadId: (id: string | null) => void;
  resetSelection: () => void;
  setViewMode: (mode: 'map' | 'simulation') => void;
  setActiveTab: (tab: 'controls' | 'network' | 'algorithms' | 'incidents') => void;
  setSelectedAlgorithm: (algo: 'dijkstra' | 'astar' | 'dynamic_hld') => void;
  setSimSpeed: (speed: number) => void;
  setHighFidelity3D: (enabled: boolean) => void;
  setActiveRegionId: (regionId: string | null) => void;
  addTelemetryPoint: (point: TelemetryPoint) => void;
  clearTimeSeriesData: () => void;
  setNotificationCount: (count: number) => void;
}

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  status: SimulationStatus.PENDING,
  snapshot: null,
  selectedScenarioId: 'normal',
  scenarios: [],
  isWorkerReady: false,
  selectedVehicleId: null,
  selectedRoadId: null,

  viewMode: 'map',
  activeTab: 'controls',
  selectedAlgorithm: 'astar',
  simSpeed: 1,
  highFidelity3D: true,
  activeRegionId: null,
  timeSeriesData: [],
  notificationCount: 3,

  setStatus: (status) => set({ status }),
  setSnapshot: (snapshot) => {
    set((state) => {
      if (!snapshot) return { snapshot };

      let nextSeries = state.timeSeriesData;
      if (snapshot.tick % 5 === 0) {
        const newPoint: TelemetryPoint = {
          tick: snapshot.tick,
          time: `${Math.floor(snapshot.tick / 10)}s`,
          throughput: snapshot.metrics.totalThroughput,
          speed: Math.round(snapshot.metrics.avgSpeed * 3.6), // km/h
          congestion: Math.round(snapshot.metrics.avgCongestion * 100),
          vehicles: snapshot.vehicleCount,
        };
        // Keep last 30 points
        nextSeries = [...state.timeSeriesData.slice(-29), newPoint];
      }

      return {
        snapshot,
        timeSeriesData: nextSeries,
      };
    });
  },
  setSelectedScenarioId: (selectedScenarioId) => set({ selectedScenarioId }),
  setScenarios: (scenarios) => set({ scenarios }),
  setIsWorkerReady: (isWorkerReady) => set({ isWorkerReady }),
  setSelectedVehicleId: (selectedVehicleId) => set({ selectedVehicleId }),
  setSelectedRoadId: (selectedRoadId) => set({ selectedRoadId }),
  resetSelection: () => set({ selectedVehicleId: null, selectedRoadId: null }),
  setViewMode: (viewMode) => set({ viewMode }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedAlgorithm: (selectedAlgorithm) => set({ selectedAlgorithm }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  setHighFidelity3D: (highFidelity3D) => set({ highFidelity3D }),
  setActiveRegionId: (activeRegionId) => set({ activeRegionId }),
  addTelemetryPoint: (point) =>
    set((state) => ({ timeSeriesData: [...state.timeSeriesData.slice(-29), point] })),
  clearTimeSeriesData: () => set({ timeSeriesData: [] }),
  setNotificationCount: (notificationCount) => set({ notificationCount }),
}));
