"use client";

import { useEffect, useState } from "react";

import { LineChart } from "@/components/charts/LineChart";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatDuration, formatNumber } from "@/lib/utils";
import type {
  MetricsSummary,
  SimulationSummary,
} from "@/types/simulation";

interface MetricsResponse {
  summary: MetricsSummary;
  history: Array<{ tick: number; time: number; avg_congestion: number; max_congestion: number; avg_speed: number }>;
}

export default function AnalyticsPage() {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<SimulationSummary[]>("/simulations").then(setSimulations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      return;
    }
    setLoading(true);
    api
      .get<MetricsResponse>(`/simulations/${selectedId}/metrics`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const selected = simulations.find((s) => s.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-muted">
          Per-run metrics and time-series charts from the simulation engine.
        </p>
      </header>

      <Card>
        <label className="text-xs">
          <span className="mb-1 block text-muted">Simulation</span>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="h-9 rounded-md border border-border bg-surface-raised px-2 text-sm text-gray-200"
          >
            <option value="">Select a simulation…</option>
            {simulations.map((simulation) => (
              <option key={simulation.id} value={simulation.id}>
                {simulation.scenario_id} · {simulation.id.slice(0, 8)} ·{" "}
                {simulation.status}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {!selectedId && (
        <p className="text-center text-sm text-muted">
          Select a simulation to view its metrics.
        </p>
      )}

      {selectedId && loading && (
        <p className="text-center text-sm text-muted">Loading…</p>
      )}

      {selectedId && !loading && data && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Avg travel time" value={formatDuration(data.summary.avg_travel_time)} />
            <StatCard label="Max congestion" value={formatNumber(data.summary.max_congestion * 100, 0) + "%"} />
            <StatCard label="Avg speed" value={`${formatNumber(data.summary.avg_speed)} m/s`} />
            <StatCard label="Completed" value={formatNumber(data.summary.completed_vehicles, 0)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Congestion over time</CardTitle>
              <CardDescription>Average and max road congestion per tick.</CardDescription>
            </CardHeader>
            <LineChart
              points={data.history.map((h) => ({
                x: h.tick,
                y: h.avg_congestion,
              }))}
              stroke="#8B5CF6"
              xLabel="tick"
            />
            <div className="mt-3">
              <LineChart
                points={data.history.map((h) => ({
                  x: h.tick,
                  y: h.max_congestion,
                }))}
                stroke="#EF4444"
                xLabel="tick"
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average vehicle speed</CardTitle>
            </CardHeader>
            <LineChart
              points={data.history.map((h) => ({ x: h.tick, y: h.avg_speed }))}
              stroke="#22D3EE"
              xLabel="tick"
            />
          </Card>
        </>
      )}

      {selectedId && !loading && !data && (
        <p className="text-center text-sm text-warning">
          No metrics available for this simulation yet.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-200">{value}</div>
    </Card>
  );
}
