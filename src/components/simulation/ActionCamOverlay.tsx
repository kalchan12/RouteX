import React, { useState } from 'react';
import { useSimulationStore } from '../../stores';

export const ActionCamOverlay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const snapshot = useSimulationStore((s) => s.snapshot);
  const actionCamTargetId = useSimulationStore((s) => s.actionCamTargetId);
  const setActionCamTargetId = useSimulationStore((s) => s.setActionCamTargetId);

  const citations = snapshot?.citations || [];
  const lastIncident = snapshot?.lastIncident;

  const targetVehicle = snapshot?.vehicles.find((v) => v.id === actionCamTargetId);

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none select-none">
      {/* Top Banner Bar */}
      <div className="pointer-events-auto flex items-center gap-2 bg-[#090a10]/85 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-2 shadow-[0_4px_20px_rgba(6,182,212,0.2)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${actionCamTargetId ? 'bg-error' : 'bg-cyan-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${actionCamTargetId ? 'bg-error' : 'bg-cyan-400'}`}></span>
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold text-cyan-300 tracking-wider uppercase">
              {actionCamTargetId ? 'ACTION CAM // LOCKED' : 'CINEMATIC ACTION CAM'}
            </span>
            {targetVehicle ? (
              <span className="font-mono text-[9px] text-zinc-400">
                Target: {targetVehicle.id} ({Math.round(targetVehicle.speed * 3.6)} km/h)
              </span>
            ) : (
              <span className="font-mono text-[9px] text-zinc-400">
                Auto-tracks crashes & traffic violations
              </span>
            )}
          </div>
        </div>

        {actionCamTargetId && (
          <button
            onClick={() => setActionCamTargetId(null)}
            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded font-mono text-[10px] font-bold transition-all cursor-pointer active:scale-95"
            title="Reset Camera to Orbit"
          >
            RELEASE CAM
          </button>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded font-mono text-[10px] font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
        >
          <span>{isExpanded ? 'COLLAPSE' : `CITATIONS (${citations.length})`}</span>
          <span className="material-symbols-outlined text-[14px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Active Incident Alert Banner */}
      {lastIncident && Date.now() - lastIncident.timestamp < 7000 && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 bg-red-950/90 backdrop-blur-md border border-red-500/60 rounded-xl px-3 py-2 text-red-200 shadow-[0_4px_24px_rgba(239,68,68,0.35)] animate-pulse">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400 text-base">warning</span>
            <div className="text-[11px] font-mono leading-tight">
              <div className="font-bold uppercase text-red-300">INCIDENT DETECTED</div>
              <div>{lastIncident.description}</div>
            </div>
          </div>
          <button
            onClick={() => setActionCamTargetId(lastIncident.vehicleId)}
            className="px-2.5 py-1 bg-red-500/30 hover:bg-red-500/50 text-white font-mono text-[10px] font-bold rounded border border-red-400 cursor-pointer"
          >
            TRACK VEHICLE
          </button>
        </div>
      )}

      {/* Expanded Citations & Violations Log */}
      {isExpanded && (
        <div className="pointer-events-auto w-80 max-h-72 overflow-y-auto bg-[#090a10]/95 backdrop-blur-md border border-outline-variant/50 rounded-xl p-3 shadow-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-1.5">
            <span className="font-mono text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-amber-400">local_police</span>
              TRAFFIC TICKETS ISSUED
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {citations.length} Total
            </span>
          </div>

          {citations.length === 0 ? (
            <div className="text-center py-4 font-mono text-xs text-zinc-500">
              No traffic rule violations recorded yet. Speeding or running red lights will be cited!
            </div>
          ) : (
            citations.slice(-3).reverse().map((c) => (
              <div
                key={c.id}
                className="bg-surface-container/70 border border-outline-variant/30 rounded-lg p-2 font-mono text-[11px] flex flex-col gap-1 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    {c.plateNumber}
                  </span>
                  <span className="font-bold text-amber-400">
                    {c.fineAmountETB.toLocaleString()} ETB
                  </span>
                </div>
                <div className="text-zinc-300 flex items-center justify-between text-[10px]">
                  <span>{c.violationType}</span>
                  <button
                    onClick={() => setActionCamTargetId(c.vehicleId)}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Track Car
                  </button>
                </div>
                <div className="text-zinc-500 text-[9px]">
                  {c.officer} • {new Date(c.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
