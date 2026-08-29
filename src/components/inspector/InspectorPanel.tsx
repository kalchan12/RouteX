import React from 'react';
import { useSimulationStore } from '../../stores';
import { SimulationSnapshot, VehicleType } from '../../types';

interface InspectorPanelProps {
  snapshot: SimulationSnapshot | null;
  onSelectScenario: (scenarioId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  snapshot,
  onSelectScenario,
}) => {
  const {
    viewMode,
    selectedVehicleId,
    setSelectedVehicleId,
    resetSelection,
    scenarios,
    selectedScenarioId,
    setViewMode,
  } = useSimulationStore();

  const selectedVehicle = snapshot?.vehicles.find((v) => v.id === selectedVehicleId) || snapshot?.vehicles[0] || null;
  const isObjectSelected = (selectedVehicleId !== null || viewMode === 'simulation') && selectedVehicle !== null;

  return (
    <aside className="w-[320px] bg-surface-container-highest border-l border-outline-variant flex flex-col shrink-0 z-30 select-none h-full overflow-hidden">
      {/* Inspector Header */}
      <div className="p-md border-b border-outline-variant flex justify-between items-center shrink-0">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            {isObjectSelected ? 'travel_explore' : 'grid_view'}
          </span>
          {isObjectSelected ? 'Object Inspector' : 'Region Inspector'}
        </h2>
        <button
          onClick={resetSelection}
          className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded hover:bg-surface-variant"
          title="Clear Selection"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Inspector Body */}
      <div className="p-md flex-1 overflow-y-auto space-y-md">
        {isObjectSelected && selectedVehicle ? (
          <>
            {/* Vehicle Telemetry Card */}
            <div className="bg-surface rounded border border-outline-variant p-md shadow-sm">
              <div className="flex justify-between items-start mb-md">
                <div>
                  <div className="font-data-sm text-data-sm text-on-surface-variant">Vehicle ID</div>
                  <div className="font-data-lg text-data-lg text-primary mt-xs font-bold font-mono">
                    #{selectedVehicle.id.toUpperCase()}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded font-data-sm text-data-sm flex items-center gap-1.5 border ${
                    selectedVehicle.type === VehicleType.EMERGENCY
                      ? 'bg-error/10 text-error border-error/30'
                      : selectedVehicle.speed > 0.1
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedVehicle.type === VehicleType.EMERGENCY
                        ? 'bg-error glow-red animate-pulse'
                        : selectedVehicle.speed > 0.1
                        ? 'bg-primary glow-cyan'
                        : 'bg-tertiary'
                    }`}
                  />
                  {selectedVehicle.type === VehicleType.EMERGENCY
                    ? 'Emergency'
                    : selectedVehicle.speed > 0.1
                    ? 'Moving'
                    : 'Waiting'}
                </span>
              </div>

              <div className="w-full h-px bg-outline-variant my-md" />

              {/* 2x2 Telemetry Grid */}
              <div className="grid grid-cols-2 gap-y-md gap-x-sm font-data-sm">
                <div>
                  <div className="font-label-caps text-label-caps text-on-surface-variant mb-1">TYPE</div>
                  <div className="font-body-md text-body-md text-on-surface font-medium capitalize">
                    {selectedVehicle.type === VehicleType.EMERGENCY
                      ? 'Emergency Ambulance'
                      : selectedVehicle.type === 'truck'
                      ? 'Heavy Freight'
                      : 'Standard Sedan'}
                  </div>
                </div>
                <div>
                  <div className="font-label-caps text-label-caps text-on-surface-variant mb-1">SPEED</div>
                  <div className="font-data-md text-data-md text-on-surface font-mono">
                    {Math.round(selectedVehicle.speed * 3.6)} km/h
                  </div>
                </div>
                <div>
                  <div className="font-label-caps text-label-caps text-on-surface-variant mb-1">ACCEL</div>
                  <div className="font-data-md text-data-md text-on-surface font-mono">0.5 m/s²</div>
                </div>
                <div>
                  <div className="font-label-caps text-label-caps text-on-surface-variant mb-1">ROUTE ID</div>
                  <div className="font-data-md text-data-md text-primary underline cursor-pointer font-mono">
                    R-N{selectedVehicle.id.slice(-3)}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-outline-variant my-md" />

              {/* Current Edge & Progress */}
              <div>
                <div className="font-label-caps text-label-caps text-on-surface-variant mb-sm">CURRENT EDGE</div>
                <div className="bg-surface-container-low p-sm rounded border border-outline-variant font-data-sm text-data-sm text-on-surface">
                  <div className="flex justify-between font-mono font-medium">
                    <span>{selectedVehicle.currentEdge || 'E-4492 (Arterial)'}</span>
                    <span className="text-primary">{Math.round((selectedVehicle.progress ?? 0.45) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary glow-cyan rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(10, (selectedVehicle.progress ?? 0.45) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Vehicles Stream List */}
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-sm flex justify-between items-center">
                <span>ACTIVE FLEET ({snapshot?.vehicleCount ?? 0})</span>
                <span className="text-[11px] text-primary">Click to track</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {snapshot?.vehicles.slice(0, 10).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer border text-data-sm transition-all ${
                      selectedVehicle.id === v.id
                        ? 'bg-surface-container-high border-primary text-primary'
                        : 'bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:border-primary/40 hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          v.type === VehicleType.EMERGENCY ? 'bg-error' : 'bg-primary'
                        }`}
                      />
                      <span className="font-mono font-bold">#{v.id}</span>
                    </div>
                    <span className="font-mono text-xs">{Math.round(v.speed * 3.6)} km/h</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Region Overview State */}
            <div className="bg-surface rounded border border-outline-variant p-md shadow-sm">
              <div className="flex justify-between items-start mb-md">
                <div>
                  <div className="font-data-sm text-data-sm text-on-surface-variant">Global Status</div>
                  <div className="font-data-lg text-data-lg text-primary mt-xs font-bold">
                    Regional Grid Ready
                  </div>
                </div>
                <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant border border-outline-variant rounded font-data-sm text-data-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active
                </span>
              </div>
              <div className="w-full h-px bg-outline-variant my-md" />
              <div className="font-body-md text-body-md text-on-surface-variant text-center py-md leading-relaxed">
                Select a checkpoint on the regional map to launch localized micro-simulation and detailed vehicle telemetry.
              </div>
            </div>

            {/* Quick Scenario Launch Cards */}
            <div className="bg-surface rounded border border-outline-variant p-md">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-sm">
                REGIONAL SCENARIOS
              </div>
              <div className="space-y-2">
                {scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => {
                      onSelectScenario(sc.id);
                      setViewMode('simulation');
                    }}
                    className={`p-2.5 rounded border cursor-pointer transition-all ${
                      selectedScenarioId === sc.id
                        ? 'bg-surface-container-high border-primary text-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant text-on-surface hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-center font-medium font-body-md">
                      <span>{sc.name}</span>
                      <span className="font-data-sm text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                        {sc.duration}s
                      </span>
                    </div>
                    <div className="text-[12px] text-on-surface-variant mt-1 line-clamp-1">
                      {sc.id === 'normal'
                        ? 'Standard steady grid simulation'
                        : sc.id === 'rush_hour'
                        ? 'Heavy demand spike and congestion test'
                        : sc.id === 'emergency'
                        ? 'Priority ambulance pathing with preemption'
                        : 'Dynamic incident avoidance rerouting'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Topology Summary */}
            <div className="bg-surface rounded border border-outline-variant p-md font-data-sm">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-sm">
                TOPOLOGY METRICS
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Active Nodes:</span>
                  <span className="font-mono text-on-surface">{snapshot?.networkSummary.nodes ?? 48}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Active Edges:</span>
                  <span className="font-mono text-on-surface">{snapshot?.networkSummary.edges ?? 82}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Incidents / Closed:</span>
                  <span className="font-mono text-error font-bold">{snapshot?.networkSummary.closed ?? 0}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
