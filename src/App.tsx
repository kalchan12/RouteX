import { useSimulation } from '../hooks/useSimulation';
import { SimulationCanvas } from '../components/simulation/SimulationCanvas';
import { ControlPanel } from '../components/simulation/ControlPanel';
import { MetricsPanel } from '../components/analytics/MetricsPanel';
import { ScenarioSelector } from '../components/scenarios/ScenarioSelector';
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
    selectScenario,
    scenarios,
    selectedScenarioId,
  } = useSimulation();

  return (
    <div className="app">
      <header className="app-header">
        <h1>RouteX — Traffic Simulation</h1>
        <ScenarioSelector
          scenarios={scenarios}
          selectedId={selectedScenarioId}
          onSelect={selectScenario}
          disabled={!isWorkerReady}
        />
      </header>
      
      <main className="app-main">
        <div className="canvas-container">
          <SimulationCanvas snapshot={snapshot} />
        </div>
        
        <aside className="sidebar">
          <ControlPanel
            status={status}
            isReady={isWorkerReady}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onStep={step}
            onRun={run}
          />
          
          <MetricsPanel snapshot={snapshot} />
        </aside>
      </main>
    </div>
  );
}

export default App;