import { useEffect, useRef, useState } from 'react';
import { SimulationSnapshot } from '../../types';
import { SimulationRenderer, createSimulationRenderer } from '../../rendering/pixi';

interface SimulationCanvasProps {
  snapshot: SimulationSnapshot | null;
}

export function SimulationCanvas({ snapshot }: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SimulationRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const renderer = createSimulationRenderer();
    rendererRef.current = renderer;

    renderer.initialize(container).then(() => {
      setIsReady(true);
    });

    return () => {
      renderer.destroy();
      rendererRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Re-render whenever either the renderer becomes ready or a new snapshot arrives
  useEffect(() => {
    if (isReady && rendererRef.current && snapshot) {
      rendererRef.current.render(snapshot);
    }
  }, [isReady, snapshot]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', position: 'relative', minHeight: 400 }}
    >
      {snapshot && (
        <div style={{
          position: 'absolute', top: 10, left: 10, padding: '6px 12px',
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, fontSize: 13, color: '#eaeaea', zIndex: 10,
        }}>
          Tick: <strong>{snapshot.tick}</strong> | Vehicles: <strong>{snapshot.vehicleCount}</strong> | Arrived: <strong>{snapshot.arrivedCount}</strong>
        </div>
      )}
    </div>
  );
}
