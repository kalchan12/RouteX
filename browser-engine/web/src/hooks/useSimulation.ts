import { useState, useEffect, useCallback, useRef } from 'react';
import { ScenarioConfig, SimulationSnapshot, SimulationStatus, SimulationConfig } from '@routex/shared/types';
import { defaultScenarios } from '../scenarios/defaultScenarios';

interface WorkerMessage {
  type: 'init' | 'step' | 'run' | 'pause' | 'resume' | 'stop' | 'reset' | 'getSnapshot' | 'setSpeed';
  payload?: unknown;
}

interface WorkerResponse {
  type: 'snapshot' | 'status' | 'ready' | 'error';
  payload: unknown;
}

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.PENDING);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [scenarios] = useState<ScenarioConfig[]>(defaultScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(defaultScenarios[0]?.id || '');

  useEffect(() => {
    const worker = new Worker(new URL('../../../worker/simulationWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'ready':
          setIsWorkerReady(true);
          break;
        case 'snapshot': {
          const snap = payload as SimulationSnapshot;
          setSnapshot(snap);
          if (snap.status) {
            setStatus(snap.status as SimulationStatus);
          }
          break;
        }
        case 'status': {
          const s = (payload as { status: SimulationStatus }).status;
          if (s) setStatus(s);
          break;
        }
        case 'error':
          console.error('Worker error:', payload);
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
    };

    // Immediately initialize with the default scenario
    const initialScenario = defaultScenarios.find(s => s.id === selectedScenarioId) || defaultScenarios[0];
    if (initialScenario) {
      worker.postMessage({ type: 'init', payload: { scenario: initialScenario } });
    }

    return () => {
      worker.terminate();
    };
  }, []);

  const initWorker = useCallback((scenario: ScenarioConfig, config?: Partial<SimulationConfig>) => {
    workerRef.current?.postMessage({ type: 'init', payload: { scenario, config } });
  }, []);

  const selectScenario = useCallback((scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setSelectedScenarioId(scenarioId);
      initWorker(scenario);
    }
  }, [scenarios, initWorker]);

  const sendCommand = useCallback((type: WorkerMessage['type'], payload?: unknown) => {
    workerRef.current?.postMessage({ type, payload });
  }, []);

  const start = useCallback(() => sendCommand('resume'), [sendCommand]);
  const pause = useCallback(() => sendCommand('pause'), [sendCommand]);
  const reset = useCallback(() => {
    sendCommand('reset');
    if (selectedScenarioId) {
      const scenario = scenarios.find(s => s.id === selectedScenarioId);
      if (scenario) initWorker(scenario);
    }
  }, [sendCommand, selectedScenarioId, scenarios, initWorker]);
  const step = useCallback(() => sendCommand('step'), [sendCommand]);
  const run = useCallback((steps = 100) => sendCommand('run', { steps }), [sendCommand]);

  useEffect(() => {
    if (isWorkerReady && selectedScenarioId) {
      const scenario = scenarios.find(s => s.id === selectedScenarioId);
      if (scenario) initWorker(scenario);
    }
  }, [isWorkerReady, selectedScenarioId, scenarios, initWorker]);

  return {
    snapshot,
    status,
    isWorkerReady,
    start,
    pause,
    reset,
    step,
    run,
    selectScenario,
    scenarios,
    selectedScenarioId,
  };
}