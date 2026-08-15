"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SimulationCanvas } from "@/components/simulation/SimulationCanvas";
import { SimulationControls } from "@/components/simulation/SimulationControls";
import { StatsBar } from "@/components/simulation/StatsBar";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useSimulation } from "@/features/simulations/useSimulation";
import { cn, formatNumber } from "@/lib/utils";
import type {
  MetricsSummary,
  ScenarioSummary,
  SimulationSummary,
  VehicleState,
} from "@/types/simulation";

const EMPTY_METRICS: MetricsSummary = {
  total_vehicles: 0,
  active_vehicles: 0,
  waiting_vehicles: 0,
  completed_vehicles: 0,
  total_travel_time: 0,
  avg_travel_time: 0,
  total_waiting_time: 0,
  avg_speed: 0,
  max_congestion: 0,
  throughput: 0,
  emergency_response_time: 0,
  route_computation_ms: 0,
  elapsed: 0,
};

export default function SimulationPage() {
  const params = useParams<{ id: string }>();
  const simId = params.id;

  const { snapshot, connection, controls } = useSimulation(simId);
  const [meta, setMeta] = useState<SimulationSummary | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SimulationSummary>(`/simulations/${simId}`)
      .then(setMeta)
      .catch(() => {});
    api
      .get<ScenarioSummary[]>("/scenarios")
      .then(setScenarios)
      .catch(() => {});
  }, [simId]);

  const scenarioName =
    scenarios.find((s) => s.id === meta?.scenario_id)?.name ??
    meta?.scenario_id ??
    "…";

  const status = snapshot?.status ?? meta?.status ?? "pending";
  const speed = meta?.speed ?? 10;

  const vehicles = useMemo(
    () => snapshot?.vehicles ?? ([] as VehicleState[]),
    [snapshot]
  );
  const visibleVehicles = vehicles.filter(
    (v) => v.status === "active" || v.status === "waiting"
  );

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            Simulation: {scenarioName}
          </h1>
          <p className="font-mono text-xs text-muted">{simId}</p>
        </div>
        <Badge tone={statusTone(status)}>{status}</Badge>
      </header>

      <div className="flex min-h-0 flex-1 gap-3">
        <aside className="flex w-56 shrink-0 flex-col gap-3">
          <SimulationControls
            status={status}
            connection={connection}
            algorithm={snapshot?.algorithm ?? meta?.algorithm ?? "dijkstra"}
            scenarioName={scenarioName}
            speed={speed}
            onStart={() => void controls.start()}
            onPause={() => void controls.pause()}
            onStop={() => void controls.stop()}
          />

          <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Vehicles ({visibleVehicles.length})
            </h2>
            {visibleVehicles.length === 0 ? (
              <p className="text-xs text-muted">No active vehicles yet.</p>
            ) : (
              <ul className="space-y-1">
                {visibleVehicles.slice(0, 100).map((vehicle) => (
                  <li key={vehicle.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedVehicle((current) =>
                          current === vehicle.id ? null : vehicle.id
                        )
                      }
                      className={cn(
                        "flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors",
                        selectedVehicle === vehicle.id
                          ? "bg-secondary/15 text-secondary"
                          : "text-gray-300 hover:bg-surface-raised"
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1.5",
                          vehicle.type === "emergency" && "text-danger"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            vehicle.type === "emergency"
                              ? "bg-danger"
                              : "bg-primary"
                          )}
                        />
                        {vehicle.id}
                      </span>
                      <span className="text-muted">
                        {formatNumber(vehicle.speed, 1)} m/s
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-[#0D1117]">
          <SimulationCanvas
            snapshot={snapshot}
            selectedVehicleId={selectedVehicle}
          />
        </div>
      </div>

      <StatsBar metrics={snapshot?.metrics ?? EMPTY_METRICS} />
    </div>
  );
}

function statusTone(status: string): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "running":
      return "success";
    case "paused":
    case "pending":
      return "info";
    case "completed":
      return "default";
    default:
      return "danger";
  }
}
