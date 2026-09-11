import React from 'react';
import { ActiveIncident, SimulationSnapshot } from '../../types';
import { useSimulationStore } from '../../stores';
import { spawnEmergencyUnits, blockRoadLane, clearAllIncidents } from '../../services/simulationService';

interface Props {
  incident: ActiveIncident;
  snapshot: SimulationSnapshot | null;
}

export const IncidentSimulationView: React.FC<Props> = ({ incident }) => {
  const exitIncidentSimulation = useSimulationStore(state => state.exitIncidentSimulation);
  const setViewMode = useSimulationStore(state => state.setViewMode);

  const handleDispatch = () => {
    spawnEmergencyUnits(2);
  };

  const handleReroute = () => {
    blockRoadLane(incident.roadId || undefined);
  };

  const handleClear = () => {
    clearAllIncidents();
  };

  const handleReturnToMap = () => {
    exitIncidentSimulation();
    setViewMode('map');
  };

  return (
    <div className="w-full h-full relative pointer-events-none overflow-hidden select-none">
      {/* Floating Tactical Incident HUD Card */}
      <div className="pointer-events-auto absolute top-4 left-4 z-30 w-80 sm:w-96 bg-[#12131a]/90 backdrop-blur-md border border-error/60 rounded-xl shadow-[0_8px_32px_rgba(255,84,73,0.3)] p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
            </span>
            <span className="font-mono text-xs font-bold text-error tracking-wider uppercase">
              TACTICAL INCIDENT HUD
            </span>
          </div>
          <button
            onClick={handleReturnToMap}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container-high/80 border border-outline-variant/50 hover:border-primary cursor-pointer active:scale-95"
            title="Return to Map"
          >
            <span className="material-symbols-outlined text-[14px]">map</span>
            BACK TO MAP
          </button>
        </div>

        {/* Incident Info */}
        <div>
          <div className="font-mono text-sm font-bold text-on-surface leading-tight">
            {incident.description}
          </div>
          <div className="font-mono text-[11px] text-tertiary mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">location_on</span>
            {incident.lat.toFixed(4)}°N, {incident.lng.toFixed(4)}°E
          </div>
        </div>

        {/* Severity & Units Row */}
        <div className="flex gap-2">
          <div className="flex-1 bg-surface-container-high/80 rounded p-2 border border-outline-variant/30">
            <div className="text-[9px] text-on-surface-variant uppercase tracking-wider">Severity</div>
            <div className="font-mono text-xs text-error font-bold uppercase mt-0.5">{incident.severity}</div>
          </div>
          <div className="flex-1 bg-surface-container-high/80 rounded p-2 border border-outline-variant/30">
            <div className="text-[9px] text-on-surface-variant uppercase tracking-wider">Assigned Units</div>
            <div className="font-mono text-xs text-primary font-bold mt-0.5">
              {incident.assignedUnits.length} En Route
            </div>
          </div>
        </div>

        {/* Tactical Actions */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={handleDispatch}
            className="py-2 px-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 rounded font-mono text-[11px] font-bold transition-all text-center cursor-pointer active:scale-95 shadow-sm"
            title="Dispatch 2 emergency ambulances"
          >
            DISPATCH
          </button>
          <button
            onClick={handleReroute}
            className="py-2 px-2 bg-tertiary/20 text-tertiary hover:bg-tertiary/30 border border-tertiary/40 rounded font-mono text-[11px] font-bold transition-all text-center cursor-pointer active:scale-95 shadow-sm"
            title="Block lane and reroute vehicles"
          >
            REROUTE
          </button>
          <button
            onClick={handleClear}
            className="py-2 px-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded font-mono text-[11px] font-bold transition-all text-center cursor-pointer active:scale-95 shadow-sm"
            title="Clear active incident and unblock road"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Top Right: Real-time Incident Telemetry Chip */}
      <div className="pointer-events-none absolute top-4 right-4 z-20 font-mono text-[11px] text-error bg-[#12131a]/85 backdrop-blur border border-error/40 rounded-lg px-3 py-2 flex flex-col items-end gap-0.5 shadow-lg">
        <div className="font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-error animate-ping inline-block"></span>
          SYS.RSP.ALRT // {incident.id}
        </div>
        <div className="text-on-surface-variant text-[10px]">
          EST. CLEARANCE: {incident.estimatedClearanceMinutes || 30} MIN
        </div>
        <div className="text-primary text-[10px] font-bold">
          LIVE 3D SIMULATION RUNNING
        </div>
      </div>
    </div>
  );
};
