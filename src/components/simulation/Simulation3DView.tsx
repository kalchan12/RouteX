import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { SimulationEngine } from '../../core/simulation3d/SimulationEngine';
import { createDefaultScenario } from '../../core/simulation3d/defaultScenario';
import { Renderer3D } from '../../rendering/three/Renderer3D';

interface Sim3DStats {
  vehicleCount: number;
  avgSpeed: number;
  simTime: number;
}

/**
 * Self-contained 3D traffic simulation view.
 * Runs its own SimulationEngine + Renderer3D, completely independent from
 * the RouteX 2D (PixiJS) simulation pipeline.
 */
export const Simulation3DView = memo(function Simulation3DView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  const rendererRef = useRef<Renderer3D | null>(null);
  const reqRef = useRef(0);

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stats, setStats] = useState<Sim3DStats>({ vehicleCount: 0, avgSpeed: 0, simTime: 0 });
  const [webglError, setWebglError] = useState(false);

  // Initialize engine + renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SimulationEngine();
    engine.load(createDefaultScenario());
    engineRef.current = engine;

    let renderer: Renderer3D;
    try {
      renderer = new Renderer3D(canvas, engine);
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

    let lastTime = 0;
    let lastStatsTime = 0;

    const loop = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      engine.update(dt);
      renderer.render(engine);

      if (time - lastStatsTime > 250) {
        lastStatsTime = time;
        const snap = engine.getSnapshot();
        setStats({ vehicleCount: snap.vehicleCount, avgSpeed: snap.avgSpeed, simTime: snap.simTime });
      }

      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(reqRef.current);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      engine.stop();
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isRunning) {
      engine.pause();
    } else {
      engine.start();
    }
    setIsRunning(!isRunning);
  }, [isRunning]);

  const handleSpeed = useCallback((val: number) => {
    setSpeed(val);
    engineRef.current?.setSpeed(val);
  }, []);

  const handleReset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.stop();
    engine.load(createDefaultScenario());
    setIsRunning(false);
    setStats({ vehicleCount: 0, avgSpeed: 0, simTime: 0 });
  }, []);

  if (webglError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background text-red-400 p-8 text-center">
        <h2 className="text-xl font-bold mb-2">WebGL Error</h2>
        <p>Your browser is blocking WebGL, which is required for this 3D simulation.</p>
        <p className="mt-2 text-sm text-zinc-500">
          If you are using <strong>Brave</strong>, disable "Block Fingerprinting" in the Shields menu and refresh.
        </p>
      </div>
    );
  }

  const m = Math.floor(stats.simTime / 60);
  const s = Math.floor(stats.simTime % 60);
  const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* HUD overlay (controls) */}
      <div className="absolute top-4 right-4 w-64 bg-zinc-900/90 border border-zinc-800 rounded-xl backdrop-blur-xl p-5 flex flex-col gap-4 z-10 shadow-2xl">
        <header className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-white tracking-tight">3D Simulation</h1>
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Traffic R&D</span>
        </header>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
              }`}
              onClick={handlePlayPause}
            >
              {isRunning ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 cursor-pointer transition-all"
              onClick={handleReset}
            >
              ↺ Reset
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Speed: {speed}×</label>
            <input
              type="range"
              min="0.25"
              max="5"
              step="0.25"
              value={speed}
              onChange={(e) => handleSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded accent-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Stats</h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Vehicles</span>
              <strong className="text-sm font-semibold text-white">{stats.vehicleCount}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Avg Speed</span>
              <strong className="text-sm font-semibold text-white">
                {stats.avgSpeed.toFixed(1)} <span className="text-[11px] font-normal text-zinc-600">m/s</span>
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Sim Time</span>
              <strong className="text-sm font-semibold text-white font-mono">{timeStr}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom helper text */}
      <div className="absolute bottom-5 left-5 text-zinc-600 text-xs">
        Left-Click: Rotate | Right-Click: Pan | Scroll: Zoom
      </div>
    </div>
  );
});
