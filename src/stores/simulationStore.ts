import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  loginTimestamp: number | null;

  status: SimulationStatus;
  snapshot: SimulationSnapshot | null;
  selectedScenarioId: string;
  scenarios: ScenarioConfig[];
  isWorkerReady: boolean;
  selectedVehicleId: string | null;
  selectedRoadId: string | null;
  
  // Dashboard & Navigation State
  viewMode: 'map' | 'simulation';
  viewDensity: 'full' | 'minimal';
  mapLayerType: 'dark' | 'satellite' | 'hybrid';
  activeTab: 'controls' | 'network' | 'algorithms' | 'incidents';
  selectedAlgorithm: 'dijkstra' | 'astar' | 'dynamic_hld';
  simSpeed: number;
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
  setViewDensity: (density: 'full' | 'minimal') => void;
  toggleViewDensity: () => void;
  setActiveTab: (tab: 'controls' | 'network' | 'algorithms' | 'incidents') => void;
  setSelectedAlgorithm: (algo: 'dijkstra' | 'astar' | 'dynamic_hld') => void;
  setSimSpeed: (speed: number) => void;
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
  actionCamTargetId: string | null;

  // Incident Simulation Actions
  enterIncidentSimulation: (incident: ActiveIncident) => void;
  exitIncidentSimulation: () => void;
  onTransitionComplete: () => void;
  setSelectedEntity: (id: string | null, type?: 'vehicle' | 'signal' | 'pedestrian' | 'incident' | null) => void;
  clearSelectedEntity: () => void;
  setActionCamTargetId: (id: string | null) => void;
  setPanelsVisible: (visible: boolean) => void;
}

export const useSimulationStore = create<SimulationStoreState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      operatorId: 'RX-8842',
      operatorClearance: 'LEVEL-4 TACTICAL CHIEF',
      operatorLocation: null,
      loginTimestamp: null,

      status: SimulationStatus.PENDING,
      snapshot: null,
      selectedScenarioId: 'normal',
      scenarios: [],
      isWorkerReady: false,
      selectedVehicleId: null,
      selectedRoadId: null,

      viewMode: 'map',
      viewDensity: 'full',
      mapLayerType: 'dark',
      activeTab: 'controls',
      selectedAlgorithm: 'astar',
      simSpeed: 1,
      activeRegionId: null,
      timeSeriesData: [],
      notificationCount: 3,

      simulationMode: 'dashboard',
      activeIncident: null,
      panelsVisible: true,
      selectedEntityId: null,
      selectedEntityType: null,
      actionCamTargetId: null,

      login: (id = 'RX-8842') => set({ isAuthenticated: true, operatorId: id, loginTimestamp: Date.now() }),
      logout: () => set({ isAuthenticated: false, loginTimestamp: null }),
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
      setViewDensity: (viewDensity) => set({ viewDensity }),
      toggleViewDensity: () => set((state) => ({ viewDensity: state.viewDensity === 'full' ? 'minimal' : 'full' })),
      setActiveTab: (activeTab) => set({ activeTab }),
      setSelectedAlgorithm: (selectedAlgorithm) => set({ selectedAlgorithm }),
      setSimSpeed: (simSpeed) => set({ simSpeed }),
      setActiveRegionId: (activeRegionId) => set({ activeRegionId }),
      addTelemetryPoint: (point) =>
        set((state) => ({ timeSeriesData: [...state.timeSeriesData.slice(-29), point] })),
      clearTimeSeriesData: () => set({ timeSeriesData: [] }),
      setNotificationCount: (notificationCount) => set({ notificationCount }),
      
      enterIncidentSimulation: (incident) => set({ 
        simulationMode: 'transitioning_in',
        activeIncident: incident,
        panelsVisible: true
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
      setActionCamTargetId: (actionCamTargetId) => set({ actionCamTargetId }),
      setPanelsVisible: (panelsVisible) => set({ panelsVisible }),
    }),
    {
      name: 'routex_session_state',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        operatorId: state.operatorId,
        operatorClearance: state.operatorClearance,
        selectedScenarioId: state.selectedScenarioId,
        viewDensity: state.viewDensity,
        loginTimestamp: state.loginTimestamp,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 24 hour session expiration check
          if (state.loginTimestamp && Date.now() - state.loginTimestamp > 24 * 60 * 60 * 1000) {
            state.isAuthenticated = false;
            state.loginTimestamp = null;
          }
          // On refresh/reload, return directly to map view as requested
          if (state.isAuthenticated) {
            state.viewMode = 'map';
          }
        }
      },
    }
  )
);
