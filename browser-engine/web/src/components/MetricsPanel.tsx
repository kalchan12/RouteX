import type { SimulationSnapshot } from '@routex/shared/types';

interface MetricsPanelProps {
  snapshot: SimulationSnapshot | null;
}

export function MetricsPanel({ snapshot }: MetricsPanelProps) {
  if (!snapshot) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Metrics</h3>
        <div style={{ color: '#64748b', fontSize: 13 }}>No simulation data yet</div>
      </div>
    );
  }

  const m = snapshot.metrics;
  const items = [
    { label: 'Avg Travel Time', value: `${m.avgTravelTime.toFixed(1)}s`, color: '#3b82f6' },
    { label: 'Avg Speed', value: `${m.avgSpeed.toFixed(1)} m/s`, color: '#22c55e' },
    { label: 'Throughput', value: `${m.totalThroughput}`, color: '#8b5cf6' },
    { label: 'Avg Congestion', value: `${(m.avgCongestion * 100).toFixed(1)}%`, color: congestionColor(m.avgCongestion) },
    { label: 'Waiting Time', value: `${m.totalWaitingTime}`, color: '#f59e0b' },
    { label: 'Emergency Response', value: m.emergencyResponseTime ? `${m.emergencyResponseTime.toFixed(1)}s` : 'N/A', color: '#f43f5e' },
    { label: 'Network', value: `${snapshot.networkSummary.nodes}n / ${snapshot.networkSummary.edges}e / ${snapshot.networkSummary.closed} closed`, color: '#64748b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Metrics</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(({ label, value, color }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 10px', background: '#1e293b', borderRadius: 6, fontSize: 13,
          }}>
            <span style={{ color: '#94a3b8' }}>{label}</span>
            <span style={{ color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          </div>
        ))}
      </div>

      {snapshot.tick > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Progress</div>
          <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#3b82f6', borderRadius: 3,
              width: `${Math.min(100, (snapshot.tick / 600) * 100)}%`,
              transition: 'width 0.1s',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function congestionColor(c: number): string {
  if (c < 0.3) return '#22c55e';
  if (c < 0.6) return '#3b82f6';
  if (c < 0.8) return '#f59e0b';
  return '#ef4444';
}