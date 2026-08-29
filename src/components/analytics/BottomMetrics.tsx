import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useSimulationStore } from '../../stores';
import { SimulationSnapshot } from '../../types';

interface BottomMetricsProps {
  snapshot: SimulationSnapshot | null;
}

// Custom Cyberpunk Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-highest border border-outline-variant p-2 rounded shadow-lg font-data-sm text-data-sm text-on-surface">
        <div className="text-on-surface-variant font-mono mb-1 text-[11px]">Time: {label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[12px]">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono font-bold text-on-surface">
              {entry.value} {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const BottomMetrics: React.FC<BottomMetricsProps> = ({ snapshot }) => {
  const { viewMode, timeSeriesData } = useSimulationStore();
  const isMap = viewMode === 'map';

  // Metrics calculation
  const m1Label = isMap ? 'Active Regions' : 'Active Vehicles';
  const m1Value = isMap ? '12' : `${snapshot?.vehicleCount ?? 0}`;

  const m2Label = isMap ? 'Regional Avg Speed' : 'Avg Speed';
  const m2Value = isMap 
    ? '45 km/h' 
    : `${snapshot ? Math.round(snapshot.metrics.avgSpeed * 3.6) : 38} km/h`;

  const congestionPct = snapshot ? Math.round(snapshot.metrics.avgCongestion * 100) : 18;
  const m3Label = isMap ? 'Global Congestion' : 'Congestion';
  const m3Value = isMap ? '18%' : `${congestionPct}%`;
  const m3ColorClass = congestionPct > 60 
    ? 'text-error' 
    : congestionPct > 30 
    ? 'text-tertiary' 
    : 'text-emerald-400';

  const m4Label = isMap ? 'Active Incidents' : 'Avg Travel Time';
  const m4Value = isMap 
    ? `${snapshot?.networkSummary.closed ?? 3}` 
    : `${snapshot ? snapshot.metrics.avgTravelTime.toFixed(0) : 185}s`;

  // Fallback chart mock data if simulation just started or in map mode
  const chartData = timeSeriesData.length > 2
    ? timeSeriesData
    : [
        { time: '0s', throughput: 12, speed: 45, congestion: 18, vehicles: 45 },
        { time: '10s', throughput: 28, speed: 42, congestion: 22, vehicles: 78 },
        { time: '20s', throughput: 54, speed: 40, congestion: 26, vehicles: 120 },
        { time: '30s', throughput: 85, speed: 38, congestion: 30, vehicles: 165 },
        { time: '40s', throughput: 112, speed: 36, congestion: 28, vehicles: 190 },
        { time: '50s', throughput: 145, speed: 39, congestion: 25, vehicles: 210 },
        { time: '60s', throughput: 180, speed: 42, congestion: 20, vehicles: 240 },
      ];

  return (
    <div className="h-[250px] bg-surface-container border-t border-outline-variant shrink-0 p-md flex gap-md z-30 relative select-none">
      {/* KPI 4-Card Grid */}
      <div className="w-[360px] flex flex-col gap-sm shrink-0">
        <div className="font-label-caps text-label-caps text-on-surface-variant flex items-center justify-between">
          <span>{isMap ? 'REGIONAL NETWORK METRICS' : 'LOCAL ZONE METRICS'}</span>
          <span className="w-2 h-2 rounded-full bg-primary glow-cyan animate-ping" />
        </div>
        <div className="grid grid-cols-2 gap-sm flex-1">
          {/* Card 1 */}
          <div className="bg-surface rounded border border-outline-variant p-sm flex flex-col justify-center transition-colors hover:border-primary/40">
            <span className="font-data-sm text-[12px] text-on-surface-variant">{m1Label}</span>
            <span className="font-data-lg text-[22px] text-primary mt-1 font-mono font-bold">
              {m1Value}
            </span>
          </div>

          {/* Card 2 */}
          <div className="bg-surface rounded border border-outline-variant p-sm flex flex-col justify-center transition-colors hover:border-primary/40">
            <span className="font-data-sm text-[12px] text-on-surface-variant">{m2Label}</span>
            <span className="font-data-lg text-[22px] text-on-surface mt-1 font-mono font-bold">
              {m2Value}
            </span>
          </div>

          {/* Card 3 */}
          <div className="bg-surface rounded border border-outline-variant p-sm flex flex-col justify-center transition-colors hover:border-tertiary/40">
            <span className="font-data-sm text-[12px] text-on-surface-variant">{m3Label}</span>
            <span className={`font-data-lg text-[22px] mt-1 font-mono font-bold ${m3ColorClass}`}>
              {m3Value}
            </span>
          </div>

          {/* Card 4 */}
          <div className="bg-surface rounded border border-outline-variant p-sm flex flex-col justify-center transition-colors hover:border-error/40">
            <span className="font-data-sm text-[12px] text-on-surface-variant">{m4Label}</span>
            <span className="font-data-lg text-[22px] text-tertiary mt-1 font-mono font-bold">
              {m4Value}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Recharts Chart */}
      <div className="flex-1 bg-surface rounded border border-outline-variant p-sm flex flex-col min-w-0">
        <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 flex items-center justify-between">
          <span>{isMap ? 'REGIONAL THROUGHPUT VS TIME' : 'THROUGHPUT & CONGESTION VS TIME'}</span>
          <div className="flex items-center gap-4 font-data-sm text-[11px]">
            <span className="flex items-center gap-1 text-primary">
              <span className="w-2.5 h-1 rounded bg-primary" /> Throughput
            </span>
            <span className="flex items-center gap-1 text-tertiary">
              <span className="w-2.5 h-1 rounded bg-tertiary" /> Congestion %
            </span>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4cd7f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4cd7f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffb873" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ffb873" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#292931" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#869397"
                fontSize={11}
                tickLine={false}
                fontFamily="JetBrains Mono"
              />
              <YAxis
                stroke="#869397"
                fontSize={11}
                tickLine={false}
                fontFamily="JetBrains Mono"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="throughput"
                stroke="#4cd7f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cyanGradient)"
                name="Throughput"
              />
              <Area
                type="monotone"
                dataKey="congestion"
                stroke="#ffb873"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#amberGradient)"
                name="Congestion"
                unit="%"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
