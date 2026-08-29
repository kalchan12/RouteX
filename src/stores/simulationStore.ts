import { create } from 'zustand';
import { SimulationSnapshot, ScenarioConfig, SimulationStatus, ActiveIncident, SimulationMode } from '../types';

export interface TelemetryPoint {
  tick: number;
  time: string;
  throughput: number;
  speed: number;
  congestion: number;
  vehicles: number;
}

export interface OperatorLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'gps' | 'simulated';
}

interface SimulationStoreState {
  // Auth & Operator State
  isAuthenticated: boolean;
  operatorId: string;
  operatorClearance: string;
  operatorLocation: OperatorLocation | null;

  status: SimulationStatus;
  snapshot: SimulationSnapshot | null;
  selectedScenarioId: string;
  scenarios: ScenarioConfig[];
  isWorkerReady: boolean;
  selectedVehicleId: string | null;
  selectedRoadId: string | null;
  
  // Dashboard & Navigation State
  viewMode: 'map' | 'simulation';
  mapLayerType: 'dark' | 'satellite' | 'hybrid';
  activeTab: 'controls' | 'network' | 'algorithms' | 'incidents';
  selectedAlgorithm: 'dijkstra' | 'astar' | 'dynamic_hld';
  simSpeed: number;
  highFidelity3D: boolean;
  activeRegionId: string | null;
  timeSeriesData: TelemetryPoint[];
  notificationCount: number;

  // Actions
  login: (id?: string) => void;
  logout: () => void;
  setOperatorLocation: (loc: OperatorLocation | null) => void;
  setMapLayerType: (layer: 'dark' | 'satellite' | 'hybrid') => void;
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

  // Incident Simulation State
  simulationMode: SimulationMode;
  activeIncident: ActiveIncident | null;
  panelsVisible: boolean;
  selectedEntityId: string | null;
  selectedEntityType: 'vehicle' | 'signal' | 'pedestrian' | 'incident' | null;

  // Incident Simulation Actions
  enterIncidentSimulation: (incident: ActiveIncident) => void;
  exitIncidentSimulation: () => void;
  onTransitionComplete: () => void;
  setSelectedEntity: (id: string | null, type?: 'vehicle' | 'signal' | 'pedestrian' | 'incident' | null) => void;
  clearSelectedEntity: () => void;
}

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  isAuthenticated: false,
  operatorId: 'RX-8842',
  operatorClearance: 'LEVEL-4 TACTICAL CHIEF',
  operatorLocation: null,

  status: SimulationStatus.PENDING,
  snapshot: null,
  selectedScenarioId: 'normal',
  scenarios: [],
  isWorkerReady: false,
  selectedVehicleId: null,
  selectedRoadId: null,

  viewMode: 'map',
  mapLayerType: 'dark',
  activeTab: 'controls',
  selectedAlgorithm: 'astar',
  simSpeed: 1,
  highFidelity3D: true,
  activeRegionId: null,
  timeSeriesData: [],
  notificationCount: 3,

  simulationMode: 'dashboard',
  activeIncident: null,
  panelsVisible: true,
  selectedEntityId: null,
  selectedEntityType: null,

  login: (id = 'RX-8842') => set({ isAuthenticated: true, operatorId: id }),
  logout: () => set({ isAuthenticated: false }),
  setOperatorLocation: (operatorLocation) => set({ operatorLocation }),
  setMapLayerType: (mapLayerType) => set({ mapLayerType }),

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
  
  enterIncidentSimulation: (incident) => set({ 
    simulationMode: 'transitioning_in',
    activeIncident: incident,
    panelsVisible: false 
  }),
  
  exitIncidentSimulation: () => set({ 
    simulationMode: 'transitioning_out',
    panelsVisible: true
  }),
  
  onTransitionComplete: () => set((state) => {
    if (state.simulationMode === 'transitioning_in') {
      return { simulationMode: 'simulation' };
    }
    if (state.simulationMode === 'transitioning_out') {
      return { 
        simulationMode: 'dashboard', 
        activeIncident: null,
        panelsVisible: true 
      };
    }
    return {};
  }),

  setSelectedEntity: (id, type) => set({ selectedEntityId: id, selectedEntityType: type || null }),
  clearSelectedEntity: () => set({ selectedEntityId: null, selectedEntityType: null }),
}));
