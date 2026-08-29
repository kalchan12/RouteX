import React from 'react';
import { useSimulationStore } from '../../stores';

interface MapViewProps {
  onSelectRegion: (scenarioId: string, regionName: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onSelectRegion }) => {
  const { setSelectedRoadId, setSelectedVehicleId } = useSimulationStore();

  const handleCheckpointClick = (scenarioId: string, regionName: string) => {
    setSelectedRoadId(null);
    setSelectedVehicleId(null);
    onSelectRegion(scenarioId, regionName);
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] overflow-hidden select-none">
      {/* Background Grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0a0f]/60 to-[#0a0a0f] pointer-events-none" />

      {/* Cyber Arterial Vectors */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1000 1000"
      >
        <path
          d="M0,300 C200,350 400,200 600,400 S800,500 1000,450"
          fill="none"
          stroke="#869397"
          strokeWidth="2.5"
        />
        <path
          d="M200,0 C250,200 100,400 300,600 S400,800 350,1000"
          fill="none"
          stroke="#869397"
          strokeWidth="3.5"
        />
        <path
          d="M800,0 C750,200 900,400 700,600 S600,800 650,1000"
          fill="none"
          stroke="#4cd7f6"
          strokeDasharray="6,6"
          strokeWidth="2"
        />
        <path
          d="M0,700 C300,750 500,600 700,800 S900,900 1000,850"
          fill="none"
          stroke="#869397"
          strokeWidth="4"
        />
        <path
          d="M150,250 C450,280 550,550 850,750"
          fill="none"
          stroke="#ffb873"
          strokeDasharray="4,8"
          strokeWidth="1.5"
        />
      </svg>

      {/* Checkpoint 1: Downtown Hub */}
      <div
        className="absolute top-[40%] left-[45%] flex flex-col items-center justify-center cursor-pointer group z-10 -translate-x-1/2 -translate-y-1/2"
        onClick={() => handleCheckpointClick('normal', 'Downtown Hub')}
      >
        <div className="w-4 h-4 bg-primary rounded-full map-pulse mb-2 border-2 border-background shadow-[0_0_12px_rgba(76,215,246,0.8)]" />
        <div className="bg-surface-container/90 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded text-center opacity-85 group-hover:opacity-100 group-hover:border-primary group-hover:shadow-[0_0_12px_rgba(76,215,246,0.3)] transition-all transform group-hover:scale-105">
          <div className="font-label-caps text-label-caps text-primary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">location_city</span>
            Downtown Hub
          </div>
          <div className="font-data-sm text-[11px] text-on-surface-variant mt-0.5">Gridlock Risk: High</div>
        </div>
      </div>

      {/* Checkpoint 2: Industrial Port */}
      <div
        className="absolute top-[72%] left-[28%] flex flex-col items-center justify-center cursor-pointer group z-10 -translate-x-1/2 -translate-y-1/2"
        onClick={() => handleCheckpointClick('rush_hour', 'Industrial Port')}
      >
        <div className="w-4 h-4 bg-tertiary rounded-full map-pulse-amber mb-2 border-2 border-background shadow-[0_0_12px_rgba(255,184,115,0.8)]" />
        <div className="bg-surface-container/90 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded text-center opacity-85 group-hover:opacity-100 group-hover:border-tertiary group-hover:shadow-[0_0_12px_rgba(255,184,115,0.3)] transition-all transform group-hover:scale-105">
          <div className="font-label-caps text-label-caps text-tertiary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">directions_boat</span>
            Industrial Port
          </div>
          <div className="font-data-sm text-[11px] text-on-surface-variant mt-0.5">Freight: Heavy</div>
        </div>
      </div>

      {/* Checkpoint 3: Suburban Arterial */}
      <div
        className="absolute top-[22%] left-[72%] flex flex-col items-center justify-center cursor-pointer group z-10 -translate-x-1/2 -translate-y-1/2"
        onClick={() => handleCheckpointClick('accident', 'Suburban Arterial')}
      >
        <div className="w-4 h-4 bg-secondary rounded-full map-pulse-secondary mb-2 border-2 border-background shadow-[0_0_12px_rgba(180,197,255,0.8)]" />
        <div className="bg-surface-container/90 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded text-center opacity-85 group-hover:opacity-100 group-hover:border-secondary group-hover:shadow-[0_0_12px_rgba(180,197,255,0.3)] transition-all transform group-hover:scale-105">
          <div className="font-label-caps text-label-caps text-secondary flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">holiday_village</span>
            Suburban Arterial
          </div>
          <div className="font-data-sm text-[11px] text-on-surface-variant mt-0.5">Incident Active</div>
        </div>
      </div>

      {/* Checkpoint 4: Medical Center */}
      <div
        className="absolute top-[32%] left-[20%] flex flex-col items-center justify-center cursor-pointer group z-10 -translate-x-1/2 -translate-y-1/2"
        onClick={() => handleCheckpointClick('emergency', 'Medical District')}
      >
        <div className="w-3.5 h-3.5 bg-[#f472b6] rounded-full map-pulse mb-2 border-2 border-background shadow-[0_0_12px_rgba(244,114,182,0.8)]" />
        <div className="bg-surface-container/90 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded text-center opacity-85 group-hover:opacity-100 group-hover:border-[#f472b6] transition-all transform group-hover:scale-105">
          <div className="font-label-caps text-label-caps text-[#f472b6] flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">local_hospital</span>
            Medical District
          </div>
          <div className="font-data-sm text-[11px] text-on-surface-variant mt-0.5">Emergency Corridor</div>
        </div>
      </div>

      {/* Checkpoint 5: West Highway Junction */}
      <div
        className="absolute top-[68%] left-[70%] flex flex-col items-center justify-center cursor-pointer group z-10 -translate-x-1/2 -translate-y-1/2"
        onClick={() => handleCheckpointClick('road_closure', 'Highway Junction')}
      >
        <div className="w-3.5 h-3.5 bg-error rounded-full map-pulse mb-2 border-2 border-background shadow-[0_0_12px_rgba(255,180,171,0.8)]" />
        <div className="bg-surface-container/90 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded text-center opacity-85 group-hover:opacity-100 group-hover:border-error transition-all transform group-hover:scale-105">
          <div className="font-label-caps text-label-caps text-error flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">traffic</span>
            Highway Closure
          </div>
          <div className="font-data-sm text-[11px] text-on-surface-variant mt-0.5">Detour Enforced</div>
        </div>
      </div>

      {/* Regional Quick Instructions Overlay */}
      <div className="absolute bottom-md left-md bg-surface-container/80 backdrop-blur-sm border border-outline-variant rounded px-md py-sm max-w-sm pointer-events-none">
        <div className="font-label-caps text-label-caps text-primary flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">touch_app</span>
          REGIONAL DISPATCH MAP
        </div>
        <p className="text-[12px] text-on-surface-variant mt-1 leading-normal">
          Select any regional checkpoint above to launch into localized micro-simulation, route optimizations, and real-time vehicle telemetry.
        </p>
      </div>
    </div>
  );
};
