import React from 'react';
import { useSimulationStore } from '../../stores';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { highFidelity3D, setHighFidelity3D } = useSimulationStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-surface-container-high border border-outline-variant rounded-lg w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">settings</span>
            <h3 className="font-headline-sm text-on-surface">Engine Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-lg space-y-md font-body-md text-on-surface-variant">
          <div className="flex justify-between items-center py-2 border-b border-outline-variant/40">
            <div>
              <div className="text-on-surface font-medium">WebGL Hardware Acceleration</div>
              <div className="text-xs text-on-surface-variant">Pixi.js high-performance render pipeline</div>
            </div>
            <input
              type="checkbox"
              checked={highFidelity3D}
              onChange={(e) => setHighFidelity3D(e.target.checked)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex justify-between items-center py-2 border-b border-outline-variant/40">
            <div>
              <div className="text-on-surface font-medium">Telemetry Logging</div>
              <div className="text-xs text-on-surface-variant">Stream live metrics to IndexedDB (Dexie)</div>
            </div>
            <input type="checkbox" defaultChecked className="accent-primary w-4 h-4 cursor-pointer" />
          </div>

          <div className="flex justify-between items-center py-2">
            <div>
              <div className="text-on-surface font-medium">Adaptive Traffic Light Sensors</div>
              <div className="text-xs text-on-surface-variant">Dynamic green-wave priority for heavy queues</div>
            </div>
            <input type="checkbox" defaultChecked className="accent-primary w-4 h-4 cursor-pointer" />
          </div>
        </div>

        <div className="p-md border-t border-outline-variant flex justify-end bg-surface">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-primary text-on-primary font-label-caps text-label-caps font-bold hover:bg-primary-container transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
