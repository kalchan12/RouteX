"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatDuration, formatNumber } from "@/lib/utils";
import type {
  AlgorithmSummary,
  BenchmarkResult,
  BenchmarkSummary,
  ScenarioSummary,
} from "@/types/simulation";

export default function BenchmarksPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [algorithms, setAlgorithms] = useState<AlgorithmSummary[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkSummary[]>([]);
  const [scenarioId, setScenarioId] = useState("normal");
  const [selected, setSelected] = useState<string[]>(["dijkstra"]);
  const [runs, setRuns] = useState("1");
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState<BenchmarkSummary | null>(null);

  useEffect(() => {
    api.get<ScenarioSummary[]>("/scenarios").then(setScenarios).catch(() => {});
    api.get<AlgorithmSummary[]>("/algorithms").then(setAlgorithms).catch(() => {});
    api.get<BenchmarkSummary[]>("/benchmarks").then(setBenchmarks).catch(() => {});
  }, []);

  async function runBenchmark() {
    setRunning(true);
    try {
      const result = await api.post<BenchmarkSummary>("/benchmarks", {
        scenario_id: scenarioId,
        algorithms: selected.length > 0 ? selected : null,
        runs: Number(runs),
      });
      setLatest(result);
      setBenchmarks((prev) => [result, ...prev]);
    } catch (error) {
      console.error(error);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Benchmarks</h1>
        <p className="text-sm text-muted">
          Headless algorithm comparison on a scenario with real metrics.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Run a comparison</CardTitle>
          <CardDescription>
            Each algorithm runs the scenario to completion; results are computed,
            not fabricated.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs">
            <span className="mb-1 block text-muted">Scenario</span>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="h-9 rounded-md border border-border bg-surface-raised px-2 text-sm text-gray-200"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </label>
          <div className="text-xs">
            <span className="mb-1 block text-muted">Algorithms</span>
            <div className="flex gap-3">
              {algorithms.map((algorithm) => (
                <label key={algorithm.id} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={selected.includes(algorithm.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, algorithm.id]
                          : prev.filter((id) => id !== algorithm.id)
                      )
                    }
                  />
                  <span className="text-sm text-gray-200">{algorithm.name}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="text-xs">
            <span className="mb-1 block text-muted">Runs</span>
            <input
              type="number"
              min={1}
              value={runs}
              onChange={(e) => setRuns(e.target.value)}
              className="h-9 w-16 rounded-md border border-border bg-surface-raised px-2 text-sm text-gray-200"
            />
          </label>
          <Button onClick={runBenchmark} disabled={running || selected.length === 0}>
            <FlaskConical size={14} />
            {running ? "Running…" : "Run benchmark"}
          </Button>
        </div>
      </Card>

      {latest && (
        <Card>
          <CardHeader>
            <CardTitle>
              Latest results — {latest.scenario_id} (
              {formatNumber(latest.results.length, 0)} runs)
            </CardTitle>
          </CardHeader>
          <BenchmarkTable results={latest.results} />
        </Card>
      )}

      {benchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous benchmarks</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {benchmarks.map((benchmark) => (
              <div
                key={benchmark.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface-raised px-3 py-2 text-sm"
              >
                <span className="capitalize text-gray-200">
                  {benchmark.scenario_id}
                </span>
                <span className="font-mono text-xs text-muted">
                  {benchmark.id.slice(0, 8)} · {benchmark.results.length} runs ·{" "}
                  {new Date(benchmark.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function BenchmarkTable({ results }: { results: BenchmarkResult[] }) {
  const byAlgorithm = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    const list = byAlgorithm.get(result.algorithm) ?? [];
    list.push(result);
    byAlgorithm.set(result.algorithm, list);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <th className="px-3 py-2">Algorithm</th>
            <th className="px-3 py-2">Avg travel time</th>
            <th className="px-3 py-2">Completed</th>
            <th className="px-3 py-2">Max congestion</th>
            <th className="px-3 py-2">Avg speed</th>
            <th className="px-3 py-2">Route compute</th>
          </tr>
        </thead>
        <tbody>
          {[...byAlgorithm.entries()].map(([name, list]) => {
            const avg = (key: keyof typeof list[0]["metrics"]) =>
              list.reduce(
                (sum, r) => sum + (r.metrics[key] as number),
                0
              ) / list.length;
            return (
              <tr key={name} className="border-b border-border/50">
                <td className="px-3 py-2 font-mono text-secondary">{name}</td>
                <td className="px-3 py-2">
                  {formatDuration(avg("avg_travel_time"))}
                </td>
                <td className="px-3 py-2">
                  {formatNumber(avg("completed_vehicles"), 0)}
                </td>
                <td className="px-3 py-2">
                  {formatNumber(avg("max_congestion") * 100, 0)}%
                </td>
                <td className="px-3 py-2">
                  {formatNumber(avg("avg_speed"))} m/s
                </td>
                <td className="px-3 py-2">
                  {formatNumber(avg("route_computation_ms"), 2)} ms
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
