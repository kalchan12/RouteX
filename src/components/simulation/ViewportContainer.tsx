import React from 'react';
import { useSimulationStore } from '../../stores';
import { MapView } from './MapView';
import { SimulationCanvas } from './SimulationCanvas';
import { IncidentSimulationView } from './IncidentSimulationView';
import { useSimulation } from '../../hooks/useSimulation';

export const ViewportContainer: React.FC = () => {
  const { viewMode, setViewMode, simulationMode, activeIncident, status } = useSimulationStore();
  const { snapshot, start, selectScenario } = useSimulation();

  const handleSelectRegion = React.useCallback((scenarioId: string) => {
    selectScenario(scenarioId);
    setViewMode('simulation');
    if (status !== 'running') {
      start();
    }
  }, [selectScenario, setViewMode, status, start]);

  const showMap = simulationMode === 'dashboard' || simulationMode === 'transitioning_in';
  const showIncident = simulationMode === 'simulation' || simulationMode === 'transitioning_out';

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden">
      {/* Dashboard / Map View */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-500"
        style={{ 
          opacity: showMap ? 1 : 0,
          pointerEvents: showMap && simulationMode === 'dashboard' ? 'auto' : 'none'
        }}
      >
        {viewMode === 'map' ? (
          <MapView onSelectRegion={handleSelectRegion} />
        ) : (
          <SimulationCanvas
            snapshot={snapshot}
            onBackToRegion={() => setViewMode('map')}
          />
        )}
      </div>

      {/* Incident Simulation View */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-500"
        style={{ 
          opacity: showIncident ? 1 : 0,
          pointerEvents: showIncident && simulationMode === 'simulation' ? 'auto' : 'none'
        }}
      >
        {activeIncident && <IncidentSimulationView incident={activeIncident} snapshot={snapshot} />}
      </div>
    </div>
  );
};
