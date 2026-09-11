import React from 'react';
import { useSimulationStore } from '../../stores';
import { 
  loadSimulationScenario, 
  startSimulation, 
  blockRoadLane, 
  spawnEmergencyUnits 
} from '../../services/simulationService';
import { IncidentType, IncidentSeverity, ActiveIncident } from '../../types';

interface IncidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockRoad: () => void;
  onSpawnEmergency: () => void;
  onClearIncidents: () => void;
}

const MODAL_INCIDENTS = [
  {
    id: 'inc-1',
    type: IncidentType.ACCIDENT,
    severity: IncidentSeverity.SEVERE,
    lat: 8.5415,
    lng: 39.2705,
    scenarioId: 'posta_bet',
    title: 'Posta Bet Rotary Multi-Vehicle Pileup',
    subtitle: 'Rotary weave obstruction. Circular traffic gridlock spreading.',
    icon: 'car_crash',
    color: 'tertiary',
    assignedUnits: ['Traffic-Unit-4', 'Ambulance-1'],
    roadId: null,
    estimatedClearanceMinutes: 45,
  },
  {
    id: 'inc-2',
    type: IncidentType.ROAD_CLOSURE,
    severity: IncidentSeverity.MODERATE,
    lat: 8.5080,
    lng: 39.2820,
    scenarioId: 'wonji',
    title: 'Wonji Freight Corridor Bridge Overhaul',
    subtitle: 'Full lane closure. Diverting industrial trucks via parallel detour.',
    icon: 'construction',
    color: 'error',
    assignedUnits: ['Eng-Crew-B'],
    roadId: null,
    estimatedClearanceMinutes: 180,
  },
  {
    id: 'inc-3',
    type: IncidentType.ACCIDENT,
    severity: IncidentSeverity.CRITICAL,
    lat: 8.5320,
    lng: 39.2610,
    scenarioId: 'hospital',
    title: 'Adama Hospital Trauma Unit Emergency',
    subtitle: 'Ambulance dispatched to Hospital Spur. Priority green preemption requested.',
    icon: 'local_hospital',
    color: 'pink',
    assignedUnits: ['Ambulance-2', 'Fire-1'],
    roadId: null,
    estimatedClearanceMinutes: 60,
  },
  {
    id: 'inc-5',
    type: IncidentType.ACCIDENT,
    severity: IncidentSeverity.CRITICAL,
    lat: 8.5550,
    lng: 39.2650,
    scenarioId: 'random',
    title: 'Procedural Cyber Sector Incident (Randomized)',
    subtitle: 'Dynamic seed generative grid anomaly. Tactical response requested.',
    icon: 'shuffle',
    color: 'primary',
    assignedUnits: ['Drone-Alpha', 'Rapid-Unit-7'],
    roadId: null,
    estimatedClearanceMinutes: 20,
  },
];

export const IncidentsModal: React.FC<IncidentsModalProps> = ({
  isOpen,
  onClose,
  onBlockRoad,
  onSpawnEmergency,
  onClearIncidents,
}) => {
  if (!isOpen) return null;

  const handleLaunchIncident = (item: (typeof MODAL_INCIDENTS)[number]) => {
    loadSimulationScenario(item.scenarioId);

    if (item.type === IncidentType.ROAD_CLOSURE) {
      blockRoadLane();
    } else if (item.type === IncidentType.ACCIDENT) {
      blockRoadLane();
      spawnEmergencyUnits(1);
    } else {
      spawnEmergencyUnits(2);
    }

    const store = useSimulationStore.getState();
    store.setViewMode('simulation');
    startSimulation();

    const activeInc: ActiveIncident = {
      id: item.id,
      type: item.type,
      severity: item.severity,
      lat: item.lat,
      lng: item.lng,
      description: item.title,
      reportedAt: Date.now(),
      assignedUnits: item.assignedUnits,
      roadId: item.roadId,
      estimatedClearanceMinutes: item.estimatedClearanceMinutes,
      scenarioId: item.scenarioId,
    };

    store.enterIncidentSimulation(activeInc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div className="bg-surface-container-high border border-outline-variant rounded-lg w-full max-w-lg shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">notifications_active</span>
            <h3 className="font-headline-sm text-on-surface">Incident Dispatch & Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-lg space-y-md">
          <div className="text-xs text-on-surface-variant font-mono uppercase tracking-wider">
            Click an incident alert to jump directly into 3D tactical simulation:
          </div>

          <div className="space-y-2 font-data-sm max-h-72 overflow-y-auto pr-1">
            {MODAL_INCIDENTS.map((inc) => (
              <div
                key={inc.id}
                onClick={() => handleLaunchIncident(inc)}
                className="group bg-surface p-3 rounded border border-outline-variant/60 hover:border-primary/80 hover:bg-surface-container-highest cursor-pointer transition-all flex items-start gap-3 shadow-sm active:scale-[0.99]"
              >
                <span className={`material-symbols-outlined text-[20px] mt-0.5 ${
                  inc.color === 'pink' ? 'text-[#f472b6]' : inc.color === 'tertiary' ? 'text-tertiary' : inc.color === 'primary' ? 'text-primary' : 'text-error'
                }`}>
                  {inc.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
                      {inc.title}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      SIMULATE
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {inc.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex gap-2 border-t border-outline-variant/30">
            <button
              onClick={() => {
                onBlockRoad();
                onClose();
              }}
              className="flex-1 bg-surface-container-low border border-outline-variant hover:border-tertiary text-on-surface py-2 rounded text-body-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">block</span>
              Block Road
            </button>
            <button
              onClick={() => {
                onSpawnEmergency();
                onClose();
              }}
              className="flex-1 bg-primary text-on-primary py-2 rounded text-body-sm font-medium flex items-center justify-center gap-1 hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">local_hospital</span>
              Spawn Emergency
            </button>
            <button
              onClick={() => {
                onClearIncidents();
                onClose();
              }}
              className="flex-1 bg-surface-container-low border border-outline-variant hover:border-emerald-400 text-on-surface py-2 rounded text-body-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
