import React from 'react';

interface IncidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockRoad: () => void;
  onSpawnEmergency: () => void;
  onClearIncidents: () => void;
}

export const IncidentsModal: React.FC<IncidentsModalProps> = ({
  isOpen,
  onClose,
  onBlockRoad,
  onSpawnEmergency,
  onClearIncidents,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-surface-container-high border border-outline-variant rounded-lg w-full max-w-lg shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">notifications_active</span>
            <h3 className="font-headline-sm text-on-surface">Incident Dispatch & Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-lg space-y-md">
          <div className="space-y-2 font-data-sm">
            <div className="bg-surface p-sm rounded border border-tertiary/40 flex items-start gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">warning</span>
              <div className="flex-1">
                <div className="font-bold text-tertiary">Incident #INC-441: Highway Maintenance Closure</div>
                <div className="text-xs text-on-surface-variant mt-0.5">Segment E-5 rerouting traffic via Sector 4.</div>
              </div>
            </div>

            <div className="bg-surface p-sm rounded border border-error/40 flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-[18px] mt-0.5">local_hospital</span>
              <div className="flex-1">
                <div className="font-bold text-error">Active Emergency #EM-902 Dispatched</div>
                <div className="text-xs text-on-surface-variant mt-0.5">Ambulance dispatched to Hospital Node. Green preemption requested.</div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => {
                onBlockRoad();
                onClose();
              }}
              className="flex-1 bg-surface-container-low border border-outline-variant hover:border-tertiary text-on-surface py-2 rounded text-body-sm flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">block</span>
              Block Road
            </button>
            <button
              onClick={() => {
                onSpawnEmergency();
                onClose();
              }}
              className="flex-1 bg-primary text-on-primary py-2 rounded text-body-sm font-medium flex items-center justify-center gap-1 hover:bg-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">local_hospital</span>
              Spawn Emergency
            </button>
            <button
              onClick={() => {
                onClearIncidents();
                onClose();
              }}
              className="flex-1 bg-surface-container-low border border-outline-variant hover:border-emerald-400 text-on-surface py-2 rounded text-body-sm flex items-center justify-center gap-1 transition-colors"
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
