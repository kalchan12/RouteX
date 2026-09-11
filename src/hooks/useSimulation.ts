import { useEffect, useCallback } from 'react';
import { defaultScenarios } from '../scenarios/defaultScenarios';
import { useSimulationStore } from '../stores';
import {
  startSimulation,
  pauseSimulation,
  resetSimulation,
  stepSimulation,
  setSimulationSpeed,
  loadSimulationScenario,
  blockRoadLane,
  spawnEmergencyUnits,
  triggerTrafficSurge,
  clearAllIncidents,
  getSimulationEngine,
  setSimulationAlgorithm,
  spawnPoliceUnits,
  spawnMotorcycleUnits,
} from '../services/simulationService';

export function useSimulation() {
  const {
    status,
    snapshot,
    selectedScenarioId,
    scenarios,
    setSelectedScenarioId,
    setScenarios,
    setIsWorkerReady,
  } = useSimulationStore();

  useEffect(() => {
    setScenarios(defaultScenarios);
    setIsWorkerReady(true);
    // Ensure 3D engine singleton is initialized
    getSimulationEngine();
    if (!useSimulationStore.getState().selectedScenarioId && defaultScenarios[0]) {
      setSelectedScenarioId(defaultScenarios[0].id);
    }
  }, [setScenarios, setIsWorkerReady, setSelectedScenarioId]);

  const start = useCallback(() => {
    startSimulation();
  }, []);

  const pause = useCallback(() => {
    pauseSimulation();
  }, []);

  const reset = useCallback(() => {
    resetSimulation();
  }, []);

  const step = useCallback(() => {
    stepSimulation();
  }, []);

  const run = useCallback((_steps = 100) => {
    startSimulation();
  }, []);

  const changeSpeed = useCallback((speed: number) => {
    setSimulationSpeed(speed);
  }, []);

  const selectScenario = useCallback((scenarioId: string) => {
    loadSimulationScenario(scenarioId);
  }, []);

  const changeAlgorithm = useCallback((algo: 'dijkstra' | 'astar' | 'dynamic_hld') => {
    setSimulationAlgorithm(algo);
  }, []);

  const blockRoad = useCallback((roadId?: string) => {
    blockRoadLane(roadId);
  }, []);

  const spawnEmergency = useCallback((count = 2) => {
    spawnEmergencyUnits(count);
  }, []);

  const spawnPolice = useCallback((count = 1) => {
    spawnPoliceUnits(count);
  }, []);

  const spawnMotorcycle = useCallback((count = 1) => {
    spawnMotorcycleUnits(count);
  }, []);

  const triggerTrafficSpike = useCallback((multiplier = 2.5, duration = 15) => {
    triggerTrafficSurge(multiplier, duration);
  }, []);

  const clearIncidents = useCallback(() => {
    clearAllIncidents();
  }, []);

  return {
    snapshot,
    status,
    isWorkerReady: true,
    start,
    pause,
    reset,
    step,
    run,
    changeSpeed,
    selectScenario,
    changeAlgorithm,
    blockRoad,
    spawnEmergency,
    spawnPolice,
    spawnMotorcycle,
    triggerTrafficSpike,
    clearIncidents,
    scenarios,
    selectedScenarioId,
  };
}
