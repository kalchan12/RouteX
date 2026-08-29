import { useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { useSimulationStore } from './stores';
import { LoginPortal } from './components/auth/LoginPortal';
import { Header } from './components/layout/Header';
import { ControlPanel } from './components/simulation/ControlPanel';
import { MapView } from './components/simulation/MapView';
import { SimulationCanvas } from './components/simulation/SimulationCanvas';
import { BottomMetrics } from './components/analytics/BottomMetrics';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { BenchmarkModal } from './components/modals/BenchmarkModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { IncidentsModal } from './components/modals/IncidentsModal';
import './App.css';

export function App() {
  const {
    snapshot,
    status,
    isWorkerReady,
    start,
    pause,
    reset,
    step,
    run,
    changeSpeed,
    selectScenario,
    changeAlgorithm,
    blockRoad,
    spawnEmergency,
    triggerTrafficSpike,
    clearIncidents,
  } = useSimulation();

  const { viewMode, setViewMode, isAuthenticated } = useSimulationStore();

  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIncidentsOpen, setIsIncidentsOpen] = useState(false);

  const handleSelectRegion = (scenarioId: string) => {
    selectScenario(scenarioId);
    setViewMode('simulation');
    if (status !== 'running') {
      start();
    }
  };

  // If not authenticated, render Mission Control Login Portal with "Welcome Operator" animation sequence
  if (!isAuthenticated) {
    return <LoginPortal onLoginSuccess={() => {}} />;
  }

  return (
    <div className="bg-background text-on-surface h-screen w-screen overflow-hidden flex flex-col font-body-md text-body-md select-none animate-fadeIn">
      {/* Top Navigation Bar */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenIncidents={() => setIsIncidentsOpen(true)}
      />

      {/* Main Multi-Pane Dashboard Shell */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Panel: Simulation Controls & SideNav */}
        <ControlPanel
          status={status}
          isReady={isWorkerReady}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onStep={step}
          onRun={run}
          onChangeSpeed={changeSpeed}
          onChangeAlgorithm={changeAlgorithm}
          onBlockRoad={blockRoad}
          onSpawnEmergency={spawnEmergency}
          onTrafficSpike={triggerTrafficSpike}
          onClearIncidents={clearIncidents}
          onRunBenchmark={() => setIsBenchmarkOpen(true)}
          onOpenDocs={() => window.open('https://github.com', '_blank')}
          onOpenSupport={() => setIsSettingsOpen(true)}
        />

        {/* Center Main Area: Viewport + Bottom Telemetry Metrics */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-background z-0 overflow-hidden">
          {/* Viewport Layers (Adama City Map vs Local Simulation) */}
          <div className="flex-1 relative w-full h-full overflow-hidden">
            {viewMode === 'map' ? (
              <div className="view-layer absolute inset-0 w-full h-full">
                <MapView onSelectRegion={handleSelectRegion} />
              </div>
            ) : (
              <div className="view-layer absolute inset-0 w-full h-full">
                <SimulationCanvas
                  snapshot={snapshot}
                  onBackToRegion={() => setViewMode('map')}
                />
              </div>
            )}
          </div>

          {/* Bottom Panel: Live KPIs & Recharts Graph */}
          <BottomMetrics snapshot={snapshot} />
        </main>

        {/* Right Panel: Region & Entity Telemetry Inspector */}
        <InspectorPanel
          snapshot={snapshot}
          onSelectScenario={selectScenario}
        />
      </div>

      {/* Interactive Modals */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <IncidentsModal
        isOpen={isIncidentsOpen}
        onClose={() => setIsIncidentsOpen(false)}
        onBlockRoad={blockRoad}
        onSpawnEmergency={spawnEmergency}
        onClearIncidents={clearIncidents}
      />
    </div>
  );
}

export default App;
