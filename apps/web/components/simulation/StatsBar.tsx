"use client";

import type { MetricsSummary } from "@/types/simulation";
import { formatDuration, formatNumber } from "@/lib/utils";

interface Props {
  metrics: MetricsSummary;
}

function Stat({
  label,
  value,
  tone = "text-gray-200",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className={`mt-0.5 text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

export function StatsBar({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
      <Stat
        label="Vehicles"
        value={`${metrics.active_vehicles} / ${metrics.total_vehicles}`}
      />
      <Stat
        label="Completed"
        value={formatNumber(metrics.completed_vehicles, 0)}
        tone="text-success"
      />
      <Stat
        label="Avg travel time"
        value={formatDuration(metrics.avg_travel_time)}
      />
      <Stat label="Avg speed" value={`${formatNumber(metrics.avg_speed)} m/s`} />
      <Stat
        label="Max congestion"
        value={formatNumber(metrics.max_congestion * 100, 0) + "%"}
        tone="text-warning"
      />
      <Stat
        label="Throughput"
        value={`${formatNumber(metrics.throughput, 2)} /s`}
      />
    </div>
  );
}
