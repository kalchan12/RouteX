import React from 'react';
import { useSimulationStore } from '../../stores';
import {
  spawnPoliceUnits,
  spawnMotorcycleUnits,
  spawnEmergencyUnits,
  blockRoadLane,
  clearAllIncidents,
  setSimulationAlgorithm,
} from '../../services/simulationService';

export const DispatchDock: React.FC = () => {
  const selectedAlgorithm = useSimulationStore((s) => s.selectedAlgorithm);
  const snapshot = useSimulationStore((s) => s.snapshot);

  const blockedCount = snapshot?.networkSummary.closed || 0;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none flex flex-col items-center gap-2">
      {/* Dock Container */}
      <div className="pointer-events-auto bg-[#090a10]/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center gap-3">
        {/* Law Enforcement & Emergency Dispatch */}
        <div className="flex items-center gap-1.5 border-r border-outline-variant/30 pr-3">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">
            DISPATCH:
          </span>
          <button
            onClick={() => spawnPoliceUnits(1)}
            className="px-2.5 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 hover:border-blue-400 text-blue-200 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Dispatch Ethiopian Traffic Police Interceptor"
          >
            <span className="material-symbols-outlined text-[15px] text-blue-400">local_police</span>
            + POLICE
          </button>
          <button
            onClick={() => spawnMotorcycleUnits(1)}
            className="px-2.5 py-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-500/50 hover:border-sky-400 text-sky-200 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Dispatch Rapid Motorcycle Patrol"
          >
            <span className="material-symbols-outlined text-[15px] text-sky-400">two_wheeler</span>
            + PATROL
          </button>
          <button
            onClick={() => spawnEmergencyUnits(1)}
            className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 hover:border-red-400 text-red-200 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Dispatch Emergency Red Cross Ambulance"
          >
            <span className="material-symbols-outlined text-[15px] text-red-400">emergency</span>
            + AMBULANCE
          </button>
        </div>

        {/* Tactical Traffic Ops */}
        <div className="flex items-center gap-1.5 border-r border-outline-variant/30 pr-3">
          <button
            onClick={() => blockRoadLane()}
            className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 hover:border-amber-400 text-amber-200 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Block lane to simulate accident and trigger dynamic rerouting"
          >
            <span className="material-symbols-outlined text-[15px] text-amber-400">block</span>
            REROUTE {blockedCount > 0 && `(${blockedCount})`}
          </button>
          {blockedCount > 0 && (
            <button
              onClick={() => clearAllIncidents()}
              className="px-2 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer active:scale-95"
              title="Clear all roadblock hazards"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Real Active Routing Algorithm Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden md:inline">
            ROUTING ALGO:
          </span>
          <button
            onClick={() => setSimulationAlgorithm('dijkstra')}
            className={`px-2 py-1 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer ${
              selectedAlgorithm === 'dijkstra'
                ? 'bg-primary text-black shadow-[0_0_12px_rgba(76,215,246,0.5)] font-black'
                : 'bg-surface-container hover:bg-surface-container-high text-zinc-400 border border-outline-variant/30'
            }`}
            title="Dijkstra: Fixed shortest path (queue bottlenecks accumulate)"
          >
            DIJKSTRA
          </button>
          <button
            onClick={() => setSimulationAlgorithm('astar')}
            className={`px-2 py-1 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer ${
              selectedAlgorithm === 'astar'
                ? 'bg-primary text-black shadow-[0_0_12px_rgba(76,215,246,0.5)] font-black'
                : 'bg-surface-container hover:bg-surface-container-high text-zinc-400 border border-outline-variant/30'
            }`}
            title="A*: Goal-directed heuristic routing"
          >
            A* SEARCH
          </button>
          <button
            onClick={() => setSimulationAlgorithm('dynamic_hld')}
            className={`px-2 py-1 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedAlgorithm === 'dynamic_hld'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-black shadow-[0_0_15px_rgba(45,212,191,0.6)] font-black'
                : 'bg-surface-container hover:bg-surface-container-high text-zinc-400 border border-outline-variant/30'
            }`}
            title="Dynamic Adaptive Rerouting: BPR impedance & real-time accident detours"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            DYNAMIC REROUTE
          </button>
        </div>
      </div>
    </div>
  );
};
