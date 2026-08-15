"use client";

import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { ScenarioSummary } from "@/types/simulation";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);

  useEffect(() => {
    api.get<ScenarioSummary[]>("/scenarios").then(setScenarios).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Scenarios</h1>
        <p className="text-sm text-muted">
          Version-controlled, reproducible experiment definitions.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => {
          const config = scenario.config as Record<string, unknown>;
          return (
            <Card key={scenario.id}>
              <CardHeader>
                <CardTitle className="capitalize">{scenario.name}</CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted">Vehicles</dt>
                  <dd className="text-gray-200">{String(config.vehicle_count)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Duration</dt>
                  <dd className="text-gray-200">{String(config.duration)} ticks</dd>
                </div>
                <div>
                  <dt className="text-muted">Seed</dt>
                  <dd className="font-mono text-gray-200">{String(config.seed)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Events</dt>
                  <dd className="text-gray-200">
                    {Array.isArray(config.events) ? config.events.length : 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Network</dt>
                  <dd className="text-gray-200">
                    {String((config.network as Record<string, unknown>)?.cols)}×
                    {String((config.network as Record<string, unknown>)?.rows)} grid
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Traffic lights</dt>
                  <dd className="text-gray-200">
                    {config.traffic_lights ? "fixed cycle" : "none"}
                  </dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
