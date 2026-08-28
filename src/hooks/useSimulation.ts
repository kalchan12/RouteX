import { useEffect, useCallback, useRef } from 'react';
import { ScenarioConfig, SimulationSnapshot, SimulationStatus, SimulationConfig } from '../types';
import { defaultScenarios } from '../scenarios/defaultScenarios';
import { useSimulationStore } from '../stores';

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

  const {
    status,
    snapshot,
    selectedScenarioId,
    scenarios,
    isWorkerReady,
    setStatus,
    setSnapshot,
    setSelectedScenarioId,
    setScenarios,
    setIsWorkerReady,
  } = useSimulationStore();

  useEffect(() => {
    setScenarios(defaultScenarios);
    if (!selectedScenarioId && defaultScenarios[0]) {
      setSelectedScenarioId(defaultScenarios[0].id);
    }
  }, [setScenarios, setSelectedScenarioId, selectedScenarioId]);

  useEffect(() => {
    // Guard against stale messages from terminated workers (React StrictMode)
    let cancelled = false;

    const worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (cancelled) return;

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
      if (!cancelled) {
        console.error('Worker error:', error);
      }
    };

    const initialScenario = defaultScenarios.find(s => s.id === selectedScenarioId) || defaultScenarios[0];
    if (initialScenario) {
      worker.postMessage({ type: 'init', payload: { scenario: initialScenario } });
    }

    return () => {
      cancelled = true;
      worker.terminate();
      workerRef.current = null;
      setIsWorkerReady(false);
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
  }, [scenarios, setSelectedScenarioId, initWorker]);

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
