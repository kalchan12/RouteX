import { useEffect, useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { useSimulationStore } from './stores';
import { LoginPortal } from './components/auth/LoginPortal';
import { Header } from './components/layout/Header';
import { ControlPanel } from './components/simulation/ControlPanel';
import { BottomMetrics } from './components/analytics/BottomMetrics';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { BenchmarkModal } from './components/modals/BenchmarkModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { IncidentsModal } from './components/modals/IncidentsModal';
import { AnimatedPanel } from './components/layout/AnimatedPanel';
import { ViewportContainer } from './components/simulation/ViewportContainer';
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

  const { 
    isAuthenticated,
    panelsVisible,
    simulationMode,
    onTransitionComplete
  } = useSimulationStore();

  useEffect(() => {
    if (simulationMode === 'transitioning_in' || simulationMode === 'transitioning_out') {
      const timer = setTimeout(() => {
        onTransitionComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [simulationMode, onTransitionComplete]);

  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIncidentsOpen, setIsIncidentsOpen] = useState(false);



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
        <AnimatedPanel visible={panelsVisible} side="left" width={280}>
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
        </AnimatedPanel>

        {/* Center Main Area: Viewport + Bottom Telemetry Metrics */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-background z-0 overflow-hidden">
          <ViewportContainer />
          
          {/* Bottom Panel: Live KPIs & Recharts Graph */}
          <BottomMetrics snapshot={snapshot} />
        </main>

        {/* Right Panel: Region & Entity Telemetry Inspector */}
        <AnimatedPanel visible={panelsVisible} side="right" width={320}>
          <InspectorPanel
            snapshot={snapshot}
            onSelectScenario={selectScenario}
          />
        </AnimatedPanel>
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
