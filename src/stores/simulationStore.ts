import { create } from 'zustand';
import { SimulationSnapshot, ScenarioConfig, SimulationStatus } from '../types';

interface SimulationStoreState {
  status: SimulationStatus;
  snapshot: SimulationSnapshot | null;
  selectedScenarioId: string;
  scenarios: ScenarioConfig[];
  isWorkerReady: boolean;
  selectedVehicleId: string | null;
  selectedRoadId: string | null;
  
  // Actions
  setStatus: (status: SimulationStatus) => void;
  setSnapshot: (snapshot: SimulationSnapshot | null) => void;
  setSelectedScenarioId: (id: string) => void;
  setScenarios: (scenarios: ScenarioConfig[]) => void;
  setIsWorkerReady: (ready: boolean) => void;
  setSelectedVehicleId: (id: string | null) => void;
  setSelectedRoadId: (id: string | null) => void;
  resetSelection: () => void;
}

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  status: SimulationStatus.PENDING,
  snapshot: null,
  selectedScenarioId: 'normal',
  scenarios: [],
  isWorkerReady: false,
  selectedVehicleId: null,
  selectedRoadId: null,

  setStatus: (status) => set({ status }),
  setSnapshot: (snapshot) => set({ snapshot }),
  setSelectedScenarioId: (selectedScenarioId) => set({ selectedScenarioId }),
  setScenarios: (scenarios) => set({ scenarios }),
  setIsWorkerReady: (isWorkerReady) => set({ isWorkerReady }),
  setSelectedVehicleId: (selectedVehicleId) => set({ selectedVehicleId }),
  setSelectedRoadId: (selectedRoadId) => set({ selectedRoadId }),
  resetSelection: () => set({ selectedVehicleId: null, selectedRoadId: null }),
}));
