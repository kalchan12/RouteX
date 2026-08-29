import React, { useState } from 'react';
import { useSimulationStore } from '../../stores';
import { SimulationStatus } from '../../types';

interface HeaderProps {
  onOpenSettings?: () => void;
  onOpenIncidents?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenIncidents }) => {
  const { 
    viewMode, 
    setViewMode, 
    selectedScenarioId, 
    scenarios, 
    status, 
    activeTab, 
    setActiveTab, 
    notificationCount,
    operatorId,
    operatorClearance,
    logout,
  } = useSimulationStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId);
  const contextTitle = viewMode === 'map' 
    ? 'Adama Metro Overview' 
    : `Adama: ${currentScenario?.name || 'Local Zone'}`;

  const isRunning = status === SimulationStatus.RUNNING;
  const isPaused = status === SimulationStatus.PAUSED;

  return (
    <header className="flex justify-between items-center w-full px-md z-50 bg-surface h-16 border-b border-outline-variant shrink-0 relative select-none">
      {/* Brand & Main Nav */}
      <div className="flex items-center gap-md w-1/3">
        <div 
          className="flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          onClick={() => setViewMode('map')}
          title="Return to Adama Regional Overview"
        >
          <span className="font-display text-display text-primary uppercase tracking-tighter text-glow-cyan">
            RouteX
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary border border-outline-variant font-bold">
            ADAMA
          </span>
        </div>

        <nav className="hidden md:flex gap-lg ml-lg items-center">
          <button 
            onClick={() => setActiveTab('controls')}
            className={`font-body-md text-body-md transition-colors duration-200 pb-1 border-b-2 ${
              activeTab === 'controls' 
                ? 'text-primary font-bold border-primary' 
                : 'text-on-surface-variant font-medium border-transparent hover:text-primary'
            }`}
          >
            Scenarios
          </button>
          <button 
            onClick={() => setActiveTab('algorithms')}
            className={`font-body-md text-body-md transition-colors duration-200 pb-1 border-b-2 ${
              activeTab === 'algorithms' 
                ? 'text-primary font-bold border-primary' 
                : 'text-on-surface-variant font-medium border-transparent hover:text-primary'
            }`}
          >
            Algorithms
          </button>
          <button 
            onClick={() => setActiveTab('network')}
            className={`font-body-md text-body-md transition-colors duration-200 pb-1 border-b-2 ${
              activeTab === 'network' 
                ? 'text-primary font-bold border-primary' 
                : 'text-on-surface-variant font-medium border-transparent hover:text-primary'
            }`}
          >
            Network
          </button>
          <button 
            onClick={() => setActiveTab('incidents')}
            className={`font-body-md text-body-md transition-colors duration-200 pb-1 border-b-2 ${
              activeTab === 'incidents' 
                ? 'text-primary font-bold border-primary' 
                : 'text-on-surface-variant font-medium border-transparent hover:text-primary'
            }`}
          >
            Incidents
          </button>
        </nav>
      </div>

      {/* Center Context Pill */}
      <div className="flex justify-center w-1/3">
        <div 
          className="bg-surface-container-high px-lg py-sm rounded border border-outline-variant font-data-md text-data-md text-on-surface flex items-center gap-sm shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setViewMode(viewMode === 'map' ? 'simulation' : 'map')}
          title="Click to toggle Adama Map / Local Simulation view"
        >
          <span className={`material-symbols-outlined text-[16px] ${viewMode === 'map' ? 'text-tertiary' : 'text-primary'}`}>
            {viewMode === 'map' ? 'public' : 'hub'}
          </span>
          <span id="header-context" className="tracking-wide font-mono">{contextTitle}</span>
        </div>
      </div>

      {/* Right Controls & Status */}
      <div className="flex items-center justify-end gap-md w-1/3">
        {/* Engine Status Pill */}
        <div className="flex items-center gap-xs bg-surface-container-low px-sm py-xs rounded border border-outline-variant">
          <div 
            className={`w-2 h-2 rounded-full ${
              isRunning 
                ? 'bg-primary glow-cyan animate-pulse' 
                : isPaused 
                ? 'bg-tertiary glow-amber' 
                : 'bg-emerald-400'
            }`}
          />
          <span className="font-data-sm text-data-sm text-primary">
            {isRunning ? 'Engine: Running' : isPaused ? 'Engine: Paused' : 'Engine: Ready'}
          </span>
        </div>

        {/* Incidents Notification Button */}
        <button 
          onClick={onOpenIncidents}
          className="p-sm text-on-surface-variant hover:text-primary transition-colors duration-200 rounded hover:bg-surface-variant relative"
          title="Incidents Log"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error glow-red" />
          )}
        </button>

        {/* Settings Button */}
        <button 
          onClick={onOpenSettings}
          className="p-sm text-on-surface-variant hover:text-primary transition-colors duration-200 rounded hover:bg-surface-variant"
          title="Simulation Settings"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>

        {/* Operator Profile Avatar with Logout Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="h-8 px-2 rounded-full bg-surface-variant border border-outline-variant overflow-hidden ml-sm ring-1 ring-primary/40 hover:ring-primary transition-all flex items-center gap-1.5 cursor-pointer font-mono"
            title={`Operator ID: #${operatorId}`}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#003640] via-[#06b6d4] to-[#4cd7f6] flex items-center justify-center text-on-primary font-label-caps text-[9px] font-bold">
              OP
            </div>
            <span className="text-[11px] text-primary font-bold pr-1">#{operatorId}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-11 w-64 bg-surface-container-high border border-outline-variant rounded-md shadow-2xl p-sm z-50 animate-fadeIn font-data-sm">
              <div className="p-2 border-b border-outline-variant/60">
                <div className="font-bold text-on-surface font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  OPERATOR #{operatorId}
                </div>
                <div className="text-[11px] text-tertiary font-mono mt-0.5">{operatorClearance}</div>
                <div className="text-[10px] text-on-surface-variant font-mono mt-1">Station: TERM-ADAMA-01</div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-error hover:bg-surface-variant flex items-center gap-2 transition-colors text-xs font-mono"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Exit Portal / Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
