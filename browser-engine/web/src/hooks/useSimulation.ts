import { useState, useEffect, useCallback, useRef } from 'react';
import type { ScenarioConfig, SimulationSnapshot, SimulationStatus, SimulationConfig } from '@routex/shared/types';
import { defaultScenarios } from '../scenarios/defaultScenarios';

interface WorkerMessage {
  type: 'init' | 'step' | 'run' | 'pause' | 'resume' | 'stop' | 'reset' | 'getSnapshot' | 'setConfig';
  payload?: unknown;
}

interface WorkerResponse {
  type: 'snapshot' | 'status' | 'tickEvents' | 'error' | 'ready';
  payload: unknown;
}

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [status, setStatus] = useState<SimulationStatus>('pending');
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [scenarios] = useState(defaultScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(defaultScenarios[0]?.id || '');
  const [pendingScenario, setPendingScenario] = useState<ScenarioConfig | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('@routex/worker/simulationWorker', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'ready':
          setIsWorkerReady(true);
          if (pendingScenario) {
            worker.postMessage({ type: 'init', payload: { scenario: pendingScenario } });
            setPendingScenario(null);
          }
          break;
        case 'snapshot':
          setSnapshot(payload as SimulationSnapshot);
          setStatus((payload as SimulationSnapshot).status as SimulationStatus);
          break;
        case 'status':
          setStatus((payload as { status: SimulationStatus }).status);
          break;
        case 'error':
          console.error('Worker error:', payload);
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
    };

    return () => {
      worker.terminate();
    };
  }, [pendingScenario]);

  const initWorker = useCallback((scenario: ScenarioConfig, config?: Partial<SimulationConfig>) => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({ type: 'init', payload: { scenario, config } });
    } else {
      setPendingScenario(scenario);
    }
  }, [isWorkerReady]);

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