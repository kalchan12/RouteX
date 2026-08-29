import { SimulationEngine } from '../core/simulation/engine';
import { SimulationStatus, ScenarioConfig, SimulationConfig } from '../types';

interface EngineMessage {
  type: 'init' | 'step' | 'run' | 'pause' | 'resume' | 'stop' | 'reset' | 'getSnapshot' | 'setSpeed' | 'blockRoad' | 'spawnEmergency' | 'trafficSpike' | 'clearIncidents';
  payload?: any;
}

let engine: SimulationEngine | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let tickDelayMs = 50; // ~20 ticks per second

function stopLoop(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function startLoop(): void {
  stopLoop();
  if (!engine) return;

  engine.start();
  (self as unknown as Worker).postMessage({
    type: 'status',
    payload: { status: engine.getStatus(), tick: engine.getTick() },
  });

  intervalId = setInterval(() => {
    if (!engine) {
      stopLoop();
      return;
    }

    engine.step();
    const snap = engine.snapshot();
    (self as unknown as Worker).postMessage({ type: 'snapshot', payload: snap });

    if (engine.getStatus() === SimulationStatus.COMPLETED) {
      stopLoop();
      (self as unknown as Worker).postMessage({
        type: 'status',
        payload: { status: engine.getStatus(), tick: engine.getTick() },
      });
    }
  }, tickDelayMs);
}

self.onmessage = (event: MessageEvent<EngineMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'init': {
        stopLoop();
        const scenario: ScenarioConfig = payload.scenario;
        const config: Partial<SimulationConfig> = payload.config || {};

        engine = new SimulationEngine({
          scenario,
          scenarioId: scenario.id,
          algorithm: config.algorithm || 'dijkstra',
          seed: config.seed ?? 42,
          maxTicks: config.maxTicks || scenario.duration || 600,
          speed: config.speed || 1.0,
        });

        (self as unknown as Worker).postMessage({ type: 'ready', payload: null });
        (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
        break;
      }

      case 'resume': {
        if (!engine) return;
        startLoop();
        break;
      }

      case 'pause': {
        stopLoop();
        if (engine) {
          engine.pause();
          (self as unknown as Worker).postMessage({
            type: 'status',
            payload: { status: engine.getStatus(), tick: engine.getTick() },
          });
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
        }
        break;
      }

      case 'stop': {
        stopLoop();
        if (engine) {
          engine.stop();
          (self as unknown as Worker).postMessage({
            type: 'status',
            payload: { status: engine.getStatus(), tick: engine.getTick() },
          });
        }
        break;
      }

      case 'step': {
        stopLoop();
        if (engine) {
          engine.start();
          engine.step();
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
          if (engine.getStatus() === SimulationStatus.COMPLETED) {
            (self as unknown as Worker).postMessage({
              type: 'status',
              payload: { status: engine.getStatus(), tick: engine.getTick() },
            });
          }
        }
        break;
      }

      case 'run': {
        stopLoop();
        if (engine) {
          const steps = payload?.steps || 100;
          engine.run(steps);
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
          if (engine.getStatus() === SimulationStatus.COMPLETED) {
            (self as unknown as Worker).postMessage({
              type: 'status',
              payload: { status: engine.getStatus(), tick: engine.getTick() },
            });
          }
        }
        break;
      }

      case 'reset': {
        stopLoop();
        if (engine) {
          engine.rebuild();
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
          (self as unknown as Worker).postMessage({
            type: 'status',
            payload: { status: engine.getStatus(), tick: engine.getTick() },
          });
        }
        break;
      }

      case 'getSnapshot': {
        if (engine) {
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
        }
        break;
      }

      case 'setSpeed': {
        if (payload?.speed) {
          tickDelayMs = Math.max(10, Math.round(50 / payload.speed));
          if (intervalId !== null) {
            startLoop();
          }
        }
        break;
      }

      case 'blockRoad': {
        if (engine) {
          if (payload?.roadId) {
            engine.injectEvent({
              type: 'road_closure' as any,
              tick: engine.getTick(),
              duration: 300,
              roadId: payload.roadId,
              nodeId: null,
              payload: {},
            });
          } else {
            engine.blockRandomRoad();
          }
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
        }
        break;
      }

      case 'spawnEmergency': {
        if (engine) {
          engine.injectEvent({
            type: 'emergency_vehicle' as any,
            tick: engine.getTick(),
            duration: 0,
            roadId: null,
            nodeId: null,
            payload: { count: payload?.count || 2 },
          });
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
        }
        break;
      }

      case 'trafficSpike': {
        if (engine) {
          engine.injectEvent({
            type: 'traffic_spike' as any,
            tick: engine.getTick(),
            duration: payload?.duration || 100,
            roadId: null,
            nodeId: null,
            payload: { count: payload?.count || 4 },
          });
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
        }
        break;
      }

      case 'clearIncidents': {
        if (engine) {
          engine.clearAllIncidents();
          (self as unknown as Worker).postMessage({ type: 'snapshot', payload: engine.snapshot() });
        }
        break;
      }
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      payload: { message: err instanceof Error ? err.message : 'Unknown error in simulation worker' },
    });
  }
};

export {};