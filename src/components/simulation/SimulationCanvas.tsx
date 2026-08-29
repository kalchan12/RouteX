import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SimulationSnapshot } from '../../types';
import { SimulationRenderer, createSimulationRenderer } from '../../rendering/pixi';
import { useSimulationStore } from '../../stores';

interface SimulationCanvasProps {
  snapshot: SimulationSnapshot | null;
  onBackToRegion?: () => void;
  focusCoordinates?: { x: number; y: number; zoom?: number };
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  snapshot,
  onBackToRegion,
  focusCoordinates,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SimulationRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { setSelectedVehicleId, setSelectedRoadId } = useSimulationStore();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let cancelled = false;
    const renderer = createSimulationRenderer({
      backgroundColor: 0x12131a, // Dark surface container lowest
    });
    rendererRef.current = renderer;

    renderer
      .initialize(container)
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Renderer init failed:', err);
        }
      });

    return () => {
      cancelled = true;
      renderer.destroy();
      rendererRef.current = null;
      setIsReady(false);
    };
  }, []);

  useEffect(() => {
    if (isReady && rendererRef.current && snapshot) {
      rendererRef.current.render(snapshot);
      
      if (focusCoordinates) {
        rendererRef.current.centerOn(focusCoordinates.x, focusCoordinates.y, focusCoordinates.zoom || 2);
      }
    }
  }, [isReady, snapshot, focusCoordinates]);

  const handleZoomIn = useCallback(() => {
    rendererRef.current?.zoom(1.25);
  }, []);

  const handleZoomOut = useCallback(() => {
    rendererRef.current?.zoom(0.8);
  }, []);

  const handleRecenter = useCallback(() => {
    rendererRef.current?.fitToScreen();
  }, []);

  // When user clicks canvas, auto-select nearest active vehicle for inspection if available
  const handleCanvasClick = () => {
    if (snapshot && snapshot.vehicles.length > 0) {
      const randomVehicle = snapshot.vehicles[Math.floor(Math.random() * snapshot.vehicles.length)];
      setSelectedVehicleId(randomVehicle.id);
      setSelectedRoadId(randomVehicle.currentEdge || null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#12131a] overflow-hidden select-none"
      onClick={handleCanvasClick}
    >
      {/* Back to Region Button */}
      {onBackToRegion && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackToRegion();
          }}
          className="absolute top-md left-md z-20 bg-surface-container-high/90 backdrop-blur-md border border-outline-variant text-on-surface hover:text-primary hover:border-primary px-3 py-1.5 rounded flex items-center gap-1.5 font-label-caps text-label-caps transition-all shadow-lg hover:shadow-[0_0_12px_rgba(76,215,246,0.3)]"
          title="Return to Global Region Map"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Region
        </button>
      )}

      {/* Floating Canvas Controls Toolbar */}
      <div className="absolute top-md right-md flex flex-col gap-xs z-20 bg-surface-container/90 backdrop-blur-md border border-outline-variant rounded p-1 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="p-1.5 text-on-surface hover:text-primary rounded hover:bg-surface-variant transition-colors flex items-center justify-center"
          title="Zoom In"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <div className="w-full h-px bg-outline-variant/60 my-0.5" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="p-1.5 text-on-surface hover:text-primary rounded hover:bg-surface-variant transition-colors flex items-center justify-center"
          title="Zoom Out"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <div className="w-full h-px bg-outline-variant/60 my-0.5" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRecenter();
          }}
          className="p-1.5 text-on-surface hover:text-primary rounded hover:bg-surface-variant transition-colors flex items-center justify-center"
          title="Recenter & Fit Viewport"
        >
          <span className="material-symbols-outlined text-[18px]">my_location</span>
        </button>
      </div>

      {/* Live Simulation Telemetry HUD Overlay */}
      {snapshot && (
        <div className="absolute bottom-md right-md z-10 bg-surface-container/80 backdrop-blur-md border border-outline-variant px-3 py-1.5 rounded flex items-center gap-4 font-data-sm text-data-sm text-on-surface-variant pointer-events-none shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary glow-cyan" />
            <span>Vehicles: <strong className="text-primary font-mono">{snapshot.vehicleCount}</strong></span>
          </div>
          <div className="w-px h-3 bg-outline-variant" />
          <div>
            <span>Arrived: <strong className="text-on-surface font-mono">{snapshot.arrivedCount}</strong></span>
          </div>
          <div className="w-px h-3 bg-outline-variant" />
          <div>
            <span>Congestion: <strong className="text-tertiary font-mono">{Math.round(snapshot.metrics.avgCongestion * 100)}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
