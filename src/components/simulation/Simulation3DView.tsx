import { useRef, useEffect, useState, memo } from 'react';
import { getSimulationEngine } from '../../services/simulationService';
import { Renderer3D } from '../../rendering/three/Renderer3D';
import { useSimulationStore } from '../../stores';
import { ActionCamOverlay } from './ActionCamOverlay';
import { CinematicEncounterOverlay } from './CinematicEncounterOverlay';
import { DispatchDock } from './DispatchDock';

const SCENARIO_NAMES: Record<string, string> = {
  normal: 'ASTU Tech Hub (Adama)',
  expressway: 'Addis-Adama Toll Expressway',
  roundabout: 'Posta Bet Roundabout',
  hospital: 'Adama General Hospital Priority',
  wonji: 'Wonji Freight Corridor',
  aba_geda: 'Aba Geda Commercial Plaza',
  franco: 'Franco Transit Depot',
  random: 'Procedural Tactical Sector',
};

/**
 * 3D Traffic Simulation View.
 * Renders the active continuous 3D traffic simulation engine using Three.js.
 * Supports Full and Minimal view density modes (toggle via UI button or Tab key).
 */
export const Simulation3DView = memo(function Simulation3DView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer3D | null>(null);
  const reqRef = useRef(0);

  const [webglError, setWebglError] = useState(false);
  const selectedScenarioId = useSimulationStore((s) => s.selectedScenarioId);
  const selectedVehicleId = useSimulationStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useSimulationStore((s) => s.setSelectedVehicleId);
  const actionCamTargetId = useSimulationStore((s) => s.actionCamTargetId);
  const viewDensity = useSimulationStore((s) => s.viewDensity);
  const toggleViewDensity = useSimulationStore((s) => s.toggleViewDensity);
  const snapshot = useSimulationStore((s) => s.snapshot);

  // Keyboard shortcut: Tab toggles between full and minimal view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept tab if user is in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleViewDensity();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleViewDensity]);

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

  // Sync Action Cam target with Three.js renderer
  useEffect(() => {
    rendererRef.current?.setActionCamTarget(actionCamTargetId);
  }, [actionCamTargetId]);

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

  const isMinimal = viewDensity === 'minimal';
  const scenarioTitle = SCENARIO_NAMES[selectedScenarioId] || selectedScenarioId.toUpperCase();

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Top Left: Consistent Scenario Badge & View Density Mode Switcher */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="bg-[#090a10]/85 backdrop-blur-md border border-outline-variant/60 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">
              ACTIVE SECTOR
            </span>
            <span className="font-mono text-xs font-bold text-cyan-300">
              {scenarioTitle}
            </span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-2 text-zinc-300 font-mono text-[10px]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{snapshot?.vehicleCount ?? 0} VEHS</span>
          </div>
        </div>

        {/* View Density Toggle Button (Full vs Minimal) */}
        <button
          onClick={toggleViewDensity}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer backdrop-blur-md shadow-md active:scale-95 ${
            isMinimal
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
              : 'bg-surface/80 text-zinc-300 border-outline-variant/60 hover:bg-surface-container'
          }`}
          title="Toggle Full HUD vs Minimal View (Shortcut: Tab key)"
        >
          <span className="material-symbols-outlined text-[15px]">
            {isMinimal ? 'visibility' : 'visibility_off'}
          </span>
          <span>{isMinimal ? 'MINIMAL VIEW' : 'FULL HUD'}</span>
          <span className="text-[9px] text-zinc-400 bg-zinc-800/80 px-1 py-0.5 rounded ml-0.5">
            Tab
          </span>
        </button>
      </div>

      {/* Cinematic Action Cam & Citations Overlay (hidden in minimal mode) */}
      {!isMinimal && <ActionCamOverlay />}

      {/* Cinematic Subtitles & Telebirr Payment Overlay */}
      <CinematicEncounterOverlay />

      {/* Interactive Law Enforcement & Tactical Dispatch Dock (hidden in minimal mode) */}
      {!isMinimal && <DispatchDock />}

      {/* Navigation Overlay Legend (hidden in minimal mode) */}
      {!isMinimal && (
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
      )}
    </div>
  );
});
