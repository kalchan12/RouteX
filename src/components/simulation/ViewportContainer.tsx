import React from 'react';
import { useSimulationStore } from '../../stores';
import { MapView } from './MapView';
import { Simulation3DView } from './Simulation3DView';
import { IncidentSimulationView } from './IncidentSimulationView';
import { loadSimulationScenario, startSimulation } from '../../services/simulationService';
import { SimulationStatus } from '../../types';

export const ViewportContainer: React.FC = () => {
  const { viewMode, setViewMode, simulationMode, activeIncident, status, snapshot } = useSimulationStore();

  const handleSelectRegion = React.useCallback((scenarioId: string) => {
    loadSimulationScenario(scenarioId);
    setViewMode('simulation');
    if (status !== SimulationStatus.RUNNING) {
      startSimulation();
    }
  }, [setViewMode, status]);

  const isMapActive = simulationMode === 'dashboard' && viewMode === 'map';
  const isIncidentActive = (simulationMode === 'simulation' || simulationMode === 'transitioning_out') && activeIncident !== null;

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden">
      {/* Primary 3D Continuous Simulation Viewport */}
      <div 
        className="absolute inset-0 w-full h-full transition-opacity duration-300"
        style={{ 
          opacity: isMapActive ? 0 : 1,
          pointerEvents: isMapActive ? 'none' : 'auto',
          zIndex: 1
        }}
      >
        <Simulation3DView />
      </div>

      {/* Regional City Map (Leaflet) */}
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-300"
        style={{
          opacity: isMapActive ? 1 : 0,
          pointerEvents: isMapActive ? 'auto' : 'none',
          zIndex: 2
        }}
      >
        <MapView onSelectRegion={handleSelectRegion} />
      </div>

      {/* Incident Tactical Response Overlay */}
      {isIncidentActive && (
        <div className="absolute inset-0 w-full h-full z-20 pointer-events-auto">
          <IncidentSimulationView incident={activeIncident} snapshot={snapshot} />
        </div>
      )}
    </div>
  );
};
