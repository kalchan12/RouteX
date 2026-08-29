import React from 'react';
import { useSimulationStore } from '../../stores';
import { SimulationStatus } from '../../types';

interface ControlPanelProps {
  status: SimulationStatus;
  isReady: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  onRun: (steps?: number) => void;
  onChangeSpeed: (speed: number) => void;
  onChangeAlgorithm: (algo: 'dijkstra' | 'astar' | 'dynamic_hld') => void;
  onBlockRoad: () => void;
  onSpawnEmergency: () => void;
  onTrafficSpike: () => void;
  onClearIncidents: () => void;
  onRunBenchmark?: () => void;
  onOpenDocs?: () => void;
  onOpenSupport?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  isReady,
  onStart,
  onPause,
  onReset,
  onStep,
  onChangeSpeed,
  onChangeAlgorithm,
  onBlockRoad,
  onSpawnEmergency,
  onTrafficSpike,
  onClearIncidents,
  onRunBenchmark,
  onOpenDocs,
  onOpenSupport,
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    simSpeed, 
    selectedAlgorithm, 
    highFidelity3D, 
    setHighFidelity3D,
    snapshot,
  } = useSimulationStore();

  const isRunning = status === SimulationStatus.RUNNING;
  const isPaused = status === SimulationStatus.PAUSED;

  return (
    <aside className="w-[320px] bg-surface-container border-r border-outline-variant flex flex-col shrink-0 z-40 select-none h-full overflow-hidden">
      {/* Header */}
      <div className="p-md border-b border-outline-variant">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center justify-between">
          <span>Simulation Engine</span>
          <span className="font-data-sm text-data-sm px-2 py-0.5 rounded bg-surface-container-high text-primary border border-outline-variant/60 font-mono">
            v4.2.0
          </span>
        </h2>
        <div className="font-data-sm text-data-sm text-on-surface-variant mt-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Core: WebAssembly / Worker ES2022</span>
        </div>
      </div>

      {/* SideNav Tabs */}
      <nav className="flex flex-col border-b border-outline-variant shrink-0">
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-3 flex items-center gap-3 font-label-caps text-label-caps w-full text-left transition-all ${
            activeTab === 'controls'
              ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          CONTROLS
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`px-4 py-3 flex items-center gap-3 font-label-caps text-label-caps w-full text-left transition-all ${
            activeTab === 'network'
              ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">hub</span>
          NETWORK
        </button>
        <button
          onClick={() => setActiveTab('algorithms')}
          className={`px-4 py-3 flex items-center gap-3 font-label-caps text-label-caps w-full text-left transition-all ${
            activeTab === 'algorithms'
              ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          ALGORITHMS
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-3 flex items-center gap-3 font-label-caps text-label-caps w-full text-left transition-all ${
            activeTab === 'incidents'
              ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">warning</span>
          INCIDENTS
        </button>
      </nav>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
        {activeTab === 'controls' && (
          <>
            {/* Render Settings Toggle */}
            <div className="bg-surface rounded border border-outline-variant p-md flex justify-between items-center">
              <div>
                <span className="font-label-caps text-label-caps text-on-surface-variant block">
                  HIGH-FIDELITY 3D
                </span>
                <span className="font-data-sm text-[11px] text-on-surface-variant/70">
                  {highFidelity3D ? 'Pixi.js WebGL Enhanced' : 'Standard 2D Mode'}
                </span>
              </div>
              <div
                onClick={() => setHighFidelity3D(!highFidelity3D)}
                className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center transition-colors ${
                  highFidelity3D ? 'bg-primary/40' : 'bg-surface-container-highest'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full absolute transition-all border border-background ${
                    highFidelity3D
                      ? 'right-0.5 bg-primary shadow-[0_0_8px_rgba(76,215,246,0.8)]'
                      : 'left-0.5 bg-outline'
                  }`}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="flex justify-between items-center mb-sm">
                <div className="font-label-caps text-label-caps text-on-surface-variant">PLAYBACK</div>
                <div className="font-data-sm text-[11px] text-primary font-mono">
                  TICK: {snapshot?.tick ?? 0}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-sm">
                <button
                  onClick={onStart}
                  disabled={isRunning || !isReady}
                  className={`h-10 flex items-center justify-center rounded border transition-all ${
                    isRunning
                      ? 'bg-primary/20 border-primary text-primary shadow-[0_0_8px_rgba(76,215,246,0.4)]'
                      : 'border-outline-variant text-on-surface hover:border-primary hover:text-primary hover:bg-primary/10'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={isPaused ? 'Resume Simulation' : 'Start Simulation'}
                >
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                </button>

                <button
                  onClick={onPause}
                  disabled={!isRunning || !isReady}
                  className={`h-10 flex items-center justify-center rounded border transition-all ${
                    isPaused
                      ? 'bg-tertiary/20 border-tertiary text-tertiary shadow-[0_0_8px_rgba(255,184,115,0.4)]'
                      : 'border-outline-variant text-on-surface-variant hover:border-tertiary hover:text-tertiary'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title="Pause Simulation"
                >
                  <span className="material-symbols-outlined text-[20px]">pause</span>
                </button>

                <button
                  onClick={onStep}
                  disabled={isRunning || !isReady}
                  className="h-10 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Single Step Advance"
                >
                  <span className="material-symbols-outlined text-[20px]">skip_next</span>
                </button>

                <button
                  onClick={onReset}
                  disabled={!isReady}
                  className="h-10 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:border-error hover:text-error transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Reset Simulation"
                >
                  <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                </button>
              </div>
            </div>

            {/* Simulation Speed */}
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="flex justify-between items-center mb-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant">SIMULATION SPEED</span>
                <span className="font-data-sm text-data-sm text-primary font-mono">{simSpeed}x</span>
              </div>
              <div className="grid grid-cols-4 gap-xs mt-2">
                {[1, 2, 4, 8].map((s) => (
                  <button
                    key={s}
                    onClick={() => onChangeSpeed(s)}
                    className={`py-1 rounded font-data-sm text-data-sm transition-all border ${
                      simSpeed === s
                        ? 'bg-primary text-on-primary border-primary font-bold shadow-[0_0_6px_rgba(76,215,246,0.4)]'
                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/50'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Pathfinding Algorithm */}
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-sm">PATHFINDING ALGORITHM</div>
              <div className="relative">
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => onChangeAlgorithm(e.target.value as any)}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface font-body-md text-body-md rounded p-sm appearance-none focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="dijkstra">Dijkstra (Standard)</option>
                  <option value="astar">A* (Heuristic)</option>
                  <option value="dynamic_hld">Dynamic HLD</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* Scenario Actions */}
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-sm">SCENARIO ACTIONS</div>
              <div className="flex flex-col gap-sm">
                <button
                  onClick={onBlockRoad}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface hover:border-tertiary hover:text-tertiary font-body-md text-body-md py-sm rounded flex items-center justify-center gap-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  Block Road
                </button>
                <button
                  onClick={onSpawnEmergency}
                  className="w-full bg-primary text-on-primary font-body-md text-body-md font-medium py-sm rounded flex items-center justify-center gap-xs hover:bg-primary-container transition-colors shadow-[0_0_8px_rgba(76,215,246,0.3)]"
                >
                  <span className="material-symbols-outlined text-[16px]">local_hospital</span>
                  Spawn Emergency
                </button>
                <div className="grid grid-cols-2 gap-xs">
                  <button
                    onClick={onTrafficSpike}
                    className="bg-surface-container-low border border-outline-variant text-on-surface hover:border-secondary hover:text-secondary font-data-sm text-[12px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    Traffic Spike
                  </button>
                  <button
                    onClick={onClearIncidents}
                    className="bg-surface-container-low border border-outline-variant text-on-surface hover:border-emerald-400 hover:text-emerald-400 font-data-sm text-[12px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Run Benchmark CTA */}
            <button
              onClick={onRunBenchmark}
              className="mt-auto w-full border border-primary text-primary font-label-caps text-label-caps py-sm rounded hover:bg-primary/10 transition-colors uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">speed</span>
              Run Benchmark
            </button>
          </>
        )}

        {activeTab === 'network' && (
          <div className="flex flex-col gap-md">
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs">NETWORK TOPOLOGY</div>
              <div className="space-y-2 mt-2 font-data-sm text-data-sm">
                <div className="flex justify-between text-on-surface">
                  <span className="text-on-surface-variant">Intersections:</span>
                  <span className="text-primary font-mono">{snapshot?.networkSummary.nodes ?? 48}</span>
                </div>
                <div className="flex justify-between text-on-surface">
                  <span className="text-on-surface-variant">Road Segments:</span>
                  <span className="text-primary font-mono">{snapshot?.networkSummary.edges ?? 82}</span>
                </div>
                <div className="flex justify-between text-on-surface">
                  <span className="text-on-surface-variant">Closed Segments:</span>
                  <span className="text-error font-mono">{snapshot?.networkSummary.closed ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs">ADAPTIVE SIGNALS</div>
              <div className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                Traffic lights dynamically adjust green phase cycle based on queue length and emergency vehicle proximity.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'algorithms' && (
          <div className="flex flex-col gap-md">
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs">ACTIVE ROUTING STRATEGY</div>
              <div className="font-headline-sm text-primary capitalize mt-1">{selectedAlgorithm.replace('_', ' ')}</div>
              <div className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                {selectedAlgorithm === 'astar'
                  ? 'A* uses Euclidean heuristic estimations for low computation latency under dynamic traffic.'
                  : selectedAlgorithm === 'dijkstra'
                  ? 'Standard Dijkstra guarantees mathematical shortest path under real-time edge travel costs.'
                  : 'Dynamic Heavy-Light Decomposition for tree/mesh routing partitions.'}
              </div>
            </div>
            <button
              onClick={onRunBenchmark}
              className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-sm rounded hover:bg-primary-container transition-colors uppercase tracking-wider"
            >
              Compare All Algorithms
            </button>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="flex flex-col gap-md">
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-xs">ACTIVE INCIDENT MANAGER</div>
              <div className="text-body-sm text-on-surface-variant mt-1 mb-3">
                Closed roads and high-severity collisions force real-time graph edge re-weighting and vehicle rerouting.
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={onBlockRoad}
                  className="w-full bg-surface-container-low border border-outline-variant text-tertiary hover:border-tertiary py-2 rounded text-body-sm flex items-center justify-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Inject Random Accident
                </button>
                <button
                  onClick={onClearIncidents}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface hover:border-emerald-400 hover:text-emerald-400 py-2 rounded text-body-sm flex items-center justify-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Resolve All Incidents
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex mt-auto border-t border-outline-variant shrink-0">
        <button
          onClick={onOpenDocs}
          className="flex-1 text-on-surface-variant hover:bg-surface-variant hover:text-primary px-4 py-3 flex items-center justify-center gap-2 font-label-caps text-label-caps transition-all border-r border-outline-variant"
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          DOCS
        </button>
        <button
          onClick={onOpenSupport}
          className="flex-1 text-on-surface-variant hover:bg-surface-variant hover:text-primary px-4 py-3 flex items-center justify-center gap-2 font-label-caps text-label-caps transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">contact_support</span>
          SUPPORT
        </button>
      </div>
    </aside>
  );
};
