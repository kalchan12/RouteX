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
} from '../services/simulationService';

export function useSimulation() {
  const {
    status,
    snapshot,
    selectedScenarioId,
    scenarios,
    setSelectedScenarioId,
    setScenarios,
    setSelectedAlgorithm,
    setIsWorkerReady,
  } = useSimulationStore();

  useEffect(() => {
    setScenarios(defaultScenarios);
    setIsWorkerReady(true);
    // Ensure 3D engine singleton is initialized
    getSimulationEngine();
    if (!selectedScenarioId && defaultScenarios[0]) {
      setSelectedScenarioId(defaultScenarios[0].id);
    }
  }, [setScenarios, setIsWorkerReady, setSelectedScenarioId, selectedScenarioId]);

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
    setSelectedAlgorithm(algo);
  }, [setSelectedAlgorithm]);

  const blockRoad = useCallback((roadId?: string) => {
    blockRoadLane(roadId);
  }, []);

  const spawnEmergency = useCallback((count = 2) => {
    spawnEmergencyUnits(count);
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
    triggerTrafficSpike,
    clearIncidents,
    scenarios,
    selectedScenarioId,
  };
}
