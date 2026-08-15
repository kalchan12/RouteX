"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";

import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatDuration, formatNumber } from "@/lib/utils";
import type {
  AlgorithmSummary,
  ScenarioSummary,
  SimulationSummary,
} from "@/types/simulation";

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [algorithms, setAlgorithms] = useState<AlgorithmSummary[]>([]);
  const [scenarioId, setScenarioId] = useState("normal");
  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [seed, setSeed] = useState("42");
  const [speed, setSpeed] = useState("10");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get<SimulationSummary[]>("/simulations").then(setSimulations).catch(() => {});
    api.get<ScenarioSummary[]>("/scenarios").then(setScenarios).catch(() => {});
    api.get<AlgorithmSummary[]>("/algorithms").then(setAlgorithms).catch(() => {});
  }, []);

  async function createSimulation() {
    setCreating(true);
    try {
      const created = await api.post<SimulationSummary>("/simulations", {
        scenario_id: scenarioId,
        algorithm,
        seed: Number(seed),
        speed: Number(speed),
      });
      window.location.href = `/simulations/${created.id}`;
    } catch (error) {
      console.error(error);
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Simulations</h1>
        <p className="text-sm text-muted">
          Create a simulation run and open its live view.
        </p>
      </header>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">New simulation</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <label className="text-xs">
            <span className="mb-1 block text-muted">Scenario</span>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface-raised px-2 text-sm text-gray-200"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted">Algorithm</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface-raised px-2 text-sm text-gray-200"
            >
              {algorithms.map((algo) => (
                <option key={algo.id} value={algo.id}>
                  {algo.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted">Seed</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface-raised px-2 text-sm text-gray-200"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted">Speed (ticks/s)</span>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface-raised px-2 text-sm text-gray-200"
            />
          </label>
          <div className="flex items-end">
            <Button onClick={createSimulation} disabled={creating} className="w-full">
              <Play size={14} /> {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">
          Runs ({simulations.length})
        </h2>
        {simulations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No simulation runs yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-3 py-2">Scenario</th>
                  <th className="px-3 py-2">Algorithm</th>
                  <th className="px-3 py-2">Seed</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Completed</th>
                  <th className="px-3 py-2">Avg time</th>
                  <th className="px-3 py-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((sim) => (
                  <tr key={sim.id} className="border-b border-border/50">
                    <td className="px-3 py-2 capitalize">{sim.scenario_id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{sim.algorithm}</td>
                    <td className="px-3 py-2 font-mono text-xs">{sim.seed}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(sim.status)}>{sim.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {formatNumber(sim.metrics_summary?.completed_vehicles, 0)}
                    </td>
                    <td className="px-3 py-2">
                      {formatDuration(sim.metrics_summary?.avg_travel_time)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/simulations/${sim.id}`}
                        className="text-secondary hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
