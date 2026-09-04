import { useRef, useEffect, useState, memo } from 'react';
import { getSimulationEngine } from '../../services/simulationService';
import { Renderer3D } from '../../rendering/three/Renderer3D';
import { useSimulationStore } from '../../stores';

/**
 * 3D Traffic Simulation View.
 * Renders the active continuous 3D traffic simulation engine using Three.js.
 * Controls and telemetry are managed seamlessly through RouteX mission control panels.
 */
export const Simulation3DView = memo(function Simulation3DView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer3D | null>(null);
  const reqRef = useRef(0);

  const [webglError, setWebglError] = useState(false);
  const selectedScenarioId = useSimulationStore((s) => s.selectedScenarioId);
  const selectedVehicleId = useSimulationStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useSimulationStore((s) => s.setSelectedVehicleId);

  // Initialize renderer with singleton engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = getSimulationEngine();

    let renderer: Renderer3D;
    try {
      renderer = new Renderer3D(canvas, engine);
      renderer.setVehicleSelectCallback((id) => {
        setSelectedVehicleId(id);
      });
    } catch (e) {
      console.error('WebGL init failed:', e);
      setWebglError(true);
      return;
    }
    rendererRef.current = renderer;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;
      if (w > 0 && h > 0) {
        renderer.resize(w, h, dpr);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      renderer.render(engine);
      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(reqRef.current);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [setSelectedVehicleId]);

  // Sync selected vehicle highlight beacon with Three.js renderer
  useEffect(() => {
    rendererRef.current?.setSelectedVehicle(selectedVehicleId);
  }, [selectedVehicleId]);

  // Rebuild 3D world when scenario changes
  useEffect(() => {
    if (rendererRef.current) {
      const engine = getSimulationEngine();
      rendererRef.current.rebuildWorld(engine);
    }
  }, [selectedScenarioId]);

  if (webglError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background text-red-400 p-8 text-center">
        <h2 className="text-xl font-bold mb-2">WebGL Error</h2>
        <p>Your browser is blocking WebGL, which is required for this 3D simulation.</p>
        <p className="mt-2 text-sm text-zinc-500">
          If you are using <strong>Brave</strong>, disable &quot;Block Fingerprinting&quot; in the Shields menu and refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Cyberpunk Navigation Overlay Legend */}
      <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded bg-surface/80 backdrop-blur border border-outline-variant/60 font-mono text-[11px] text-on-surface-variant flex items-center gap-3 select-none">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Left-Click: Rotate
        </span>
        <span className="text-outline-variant">|</span>
        <span>Right-Click: Pan</span>
        <span className="text-outline-variant">|</span>
        <span>Scroll: Zoom</span>
        <span className="text-outline-variant">|</span>
        <span className="text-primary font-bold">Click Car: Inspect</span>
      </div>
    </div>
  );
});
