import type { SimulationStatus } from '@routex/shared/types';

interface ControlPanelProps {
  status: SimulationStatus;
  isReady: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onRun: (steps?: number) => void;
}

export function ControlPanel({ status, isReady, onStart, onPause, onReset, onStep, onRun }: ControlPanelProps) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const canStart = isReady && (status === 'pending' || isPaused);
  const canPause = isReady && isRunning;
  const canStep = isReady && !isRunning;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Controls</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {canStart && (
          <button onClick={onStart} style={btnStyle('#22c55e')}>
            {isPaused ? 'Resume' : 'Start'}
          </button>
        )}
        {canPause && (
          <button onClick={onPause} style={btnStyle('#f59e0b')}>Pause</button>
        )}
        <button onClick={onStep} disabled={!canStep} style={btnStyle('#64748b', !canStep)}>
          Step
        </button>
        <button onClick={() => onRun(100)} disabled={!isReady} style={btnStyle('#3b82f6', !isReady)}>
          Run 100
        </button>
        <button onClick={() => onRun(500)} disabled={!isReady} style={btnStyle('#8b5cf6', !isReady)}>
          Run 500
        </button>
        <button onClick={onReset} disabled={!isReady} style={btnStyle('#ef4444', !isReady)}>
          Reset
        </button>
      </div>

      <div style={{
        padding: '8px 12px', background: '#1e293b', borderRadius: 8,
        fontSize: 12, color: '#94a3b8', display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Status:</span>
        <span style={{
          color: status === 'running' ? '#22c55e' : status === 'completed' ? '#3b82f6' : '#f59e0b',
          fontWeight: 600,
        }}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function btnStyle(color: string, disabled = false): React.CSSProperties {
  return {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    background: disabled ? '#334155' : color,
    color: disabled ? '#64748b' : '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s',
  };
}