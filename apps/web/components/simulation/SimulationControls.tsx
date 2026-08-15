"use client";

import { Pause, Play, Square } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { ConnectionState } from "@/features/simulations/useSimulation";
import type { SimulationStatus } from "@/types/simulation";

interface Props {
  status: SimulationStatus;
  connection: ConnectionState;
  algorithm: string;
  scenarioName: string;
  speed: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function SimulationControls({
  status,
  connection,
  algorithm,
  scenarioName,
  speed,
  onStart,
  onPause,
  onStop,
}: Props) {
  const running = status === "running";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted">Scenario</span>
          <span className="text-gray-200">{scenarioName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Algorithm</span>
          <span className="font-mono text-secondary">{algorithm}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Speed</span>
          <span className="text-gray-200">{speed} ticks/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Connection</span>
          <span
            className={
              connection === "connected" ? "text-success" : "text-warning"
            }
          >
            {connection}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {running ? (
          <Button variant="outline" size="sm" onClick={onPause} className="flex-1">
            <Pause size={14} /> Pause
          </Button>
        ) : (
          <Button size="sm" onClick={onStart} className="flex-1">
            <Play size={14} /> Start
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={onStop}
          disabled={status === "stopped" || status === "completed"}
          className="flex-1"
        >
          <Square size={14} /> Stop
        </Button>
      </div>
    </div>
  );
}
