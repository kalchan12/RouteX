"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";

import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatDuration, formatNumber } from "@/lib/utils";
import type { SimulationSummary } from "@/types/simulation";

export default function DashboardPage() {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<SimulationSummary[]>("/simulations")
      .then(setSimulations)
      .catch(() => setSimulations([]))
      .finally(() => setLoading(false));
  }, []);

  const active = simulations.filter((s) => s.status === "running").length;
  const avgCongestion = simulations.reduce(
    (sum, s) => sum + (s.metrics_summary?.max_congestion ?? 0),
    0
  );
  const vehicles = simulations.reduce(
    (sum, s) => sum + (s.metrics_summary?.total_vehicles ?? 0),
    0
  );

  const stats = [
    { label: "Active simulations", value: formatNumber(active, 0), tone: "text-success" },
    { label: "Avg max congestion", value: formatNumber(avgCongestion * 100, 0) + "%", tone: "text-warning" },
    { label: "Vehicles simulated", value: formatNumber(vehicles, 0), tone: "text-secondary" },
    { label: "Experiments", value: formatNumber(simulations.length, 0) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-muted">
          Traffic & route optimization simulator — simulation and algorithm research.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="text-xs text-muted">{stat.label}</div>
            <div className={`mt-1 text-2xl font-semibold ${stat.tone}`}>
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Recent simulations</CardTitle>
            <CardDescription>Runs from the local experiment database.</CardDescription>
          </div>
          <Link href="/simulations">
            <Button variant="outline" size="sm">
              <Play size={14} /> New simulation
            </Button>
          </Link>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Loading…</p>
        ) : simulations.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No simulations yet. Create one to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Scenario</th>
                  <th className="px-3 py-2">Algorithm</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Completed</th>
                  <th className="px-3 py-2">Avg travel time</th>
                </tr>
              </thead>
              <tbody>
                {simulations.slice(0, 10).map((sim) => (
                  <tr key={sim.id} className="border-b border-border/50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/simulations/${sim.id}`}
                        className="font-mono text-xs text-secondary hover:underline"
                      >
                        {sim.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 capitalize">{sim.scenario_id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{sim.algorithm}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(sim.status)}>{sim.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {formatNumber(sim.metrics_summary?.completed_vehicles, 0)}
                    </td>
                    <td className="px-3 py-2">
                      {formatDuration(sim.metrics_summary?.avg_travel_time)}
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
