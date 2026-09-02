import React from 'react';
import { ActiveIncident, SimulationSnapshot } from '../../types';
import { useSimulationStore } from '../../stores';
import { Simulation3DView } from './Simulation3DView';

interface Props {
  incident: ActiveIncident;
  snapshot: SimulationSnapshot | null;
}

export const IncidentSimulationView: React.FC<Props> = ({ incident }) => {
  const exitIncidentSimulation = useSimulationStore(state => state.exitIncidentSimulation);

  return (
    <div className="w-full h-full bg-background relative flex items-center justify-center overflow-hidden">
      {/* Background Simulation Canvas */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
        <Simulation3DView />
      </div>

      {/* Incident details modal overlay */}
      <div className="text-center z-10 p-6 bg-surface-container/90 backdrop-blur-md border border-error/50 rounded-xl shadow-[0_0_40px_rgba(255,84,73,0.15)] flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-error text-3xl animate-pulse">warning</span>
        </div>
        <div className="font-display text-2xl text-error mb-2 tracking-wider">INCIDENT RESPONSE</div>
        <div className="font-mono text-base text-on-surface mb-2">
          {incident.description}
        </div>
        <div className="font-mono text-sm text-tertiary mb-4">
          {incident.lat.toFixed(4)}°N, {incident.lng.toFixed(4)}°E
        </div>
        
        <div className="flex gap-4 w-full">
          <div className="flex-1 bg-surface-container-high rounded-lg p-3 text-left">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Status</div>
            <div className="font-mono text-sm text-error uppercase font-bold">{incident.severity}</div>
          </div>
          <div className="flex-1 bg-surface-container-high rounded-lg p-3 text-left">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Assigned Units</div>
            <div className="font-mono text-sm text-primary">{incident.assignedUnits.length} Units En Route</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-6 flex gap-3">
          <button className="flex-1 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded font-mono text-sm font-bold transition-colors">
            DISPATCH UNITS
          </button>
          <button className="flex-1 py-2.5 bg-surface-variant text-on-surface hover:text-primary border border-outline-variant rounded font-mono text-sm font-bold transition-colors">
            REROUTE TRAFFIC
          </button>
        </div>
      </div>
      
      {/* Exit button */}
      <button 
        onClick={exitIncidentSimulation} 
        className="absolute top-4 left-4 z-20 px-4 py-2 bg-surface-container/80 backdrop-blur text-on-surface hover:text-primary border border-outline-variant rounded hover:border-primary transition-colors flex items-center gap-2 font-mono text-sm shadow-lg pointer-events-auto"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        BACK TO DASHBOARD
      </button>
      
      {/* Decorative HUD Elements */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none mix-blend-overlay z-0" />
      
      <div className="absolute top-8 right-8 z-10 text-error font-mono text-xs opacity-70 flex flex-col items-end gap-1">
        <div>SYS.RSP.ALRT // {incident.id}</div>
        <div>T_MINUS: -00:{(incident.estimatedClearanceMinutes || 0).toString().padStart(2, '0')}:00</div>
      </div>
    </div>
  );
};
