"use client";

import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { AlgorithmSummary } from "@/types/simulation";

export default function AlgorithmsPage() {
  const [algorithms, setAlgorithms] = useState<AlgorithmSummary[]>([]);

  useEffect(() => {
    api.get<AlgorithmSummary[]>("/algorithms").then(setAlgorithms).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Algorithms</h1>
        <p className="text-sm text-muted">
          Implemented routing strategies. A* and dynamic routing arrive in later
          milestones.
        </p>
      </header>

      <div className="space-y-4">
        {algorithms.map((algorithm) => (
          <Card key={algorithm.id}>
            <CardHeader>
              <CardTitle className="font-mono">{algorithm.name}</CardTitle>
              <CardDescription>{algorithm.description}</CardDescription>
            </CardHeader>
            <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 text-xs text-gray-300">
{`find_route(network, origin, destination, cost) -> Route | None`}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
