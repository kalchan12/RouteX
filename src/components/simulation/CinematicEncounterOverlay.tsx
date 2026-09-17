import React, { useCallback } from 'react';
import { useSimulationStore } from '../../stores';

export const CinematicEncounterOverlay: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const activeEncounter = (snapshot as any)?.activeEncounter;

  // Allow user to dismiss the cinematic overlay early by clicking
  const handleDismiss = useCallback(() => {
    // The overlay will naturally disappear when the encounter timer runs out.
    // This just allows early dismissal by setting a CSS class.
    const el = document.getElementById('encounter-overlay');
    if (el) el.style.opacity = '0';
    setTimeout(() => { if (el) el.style.opacity = ''; }, 500);
  }, []);

  if (!activeEncounter) return null;

  const isOfficer = activeEncounter.speaker === 'officer';
  const isTelebirr = activeEncounter.stage === 'telebirr_payment';

  return (
    <div
      id="encounter-overlay"
      className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between select-none transition-opacity duration-300"
      onClick={handleDismiss}
    >
      {/* Cinematic Top Letterbox Bar — slim, non-intrusive */}
      <div className="pointer-events-auto w-full h-10 bg-black/80 flex items-center justify-between px-6 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="font-mono text-[10px] tracking-widest text-red-400 font-bold uppercase">
            POLICE INTERCEPT — {activeEncounter.stage.replace(/_/g, ' ').toUpperCase()}
          </span>
          {activeEncounter.plateConfiscated && (
            <span className="px-2 py-0.5 rounded bg-red-900/60 border border-red-500 text-red-200 text-[10px] font-mono animate-pulse">
              ⚠ PLATE CONFISCATED
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px]">
          <span>TARGET: <strong className="text-cyan-300">{activeEncounter.plateNumber}</strong></span>
          <span className="text-zinc-600 cursor-pointer hover:text-zinc-300 pointer-events-auto" title="Click anywhere to dismiss">
            ✕ dismiss
          </span>
        </div>
      </div>

      {/* Telebirr payment shown as a small non-blocking badge — NOT a center modal */}
      {isTelebirr && (
        <div className="self-end mr-6 mt-3 pointer-events-auto">
          <div className="bg-[#071328]/90 border border-[#008ed6]/60 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm max-w-[280px] animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#008ed6] to-[#fed208] flex items-center justify-center font-black text-black text-[9px] shadow">
                tb
              </div>
              <span className="font-bold text-[#fed208] text-sm">telebirr</span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                activeEncounter.isBribe 
                  ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300' 
                  : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              }`}>
                {activeEncounter.isBribe ? 'ሻይ' : 'FINE'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#fed208] font-extrabold text-xl font-mono">
                {activeEncounter.fineAmountETB?.toLocaleString()}
              </span>
              <span className="text-xs text-cyan-400 font-bold">ETB</span>
            </div>
            <div className="text-[9px] font-mono text-zinc-400 mt-1">
              {activeEncounter.isBribe ? 'Officer Girma (ግርማ)' : 'Federal Police Commission'}
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono mt-2">
              <span>✓</span>
              <span>ክፍያው በተሳካ ሁኔታ ተከናውኗል</span>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to push subtitle bar to bottom */}
      <div className="flex-1" />

      {/* Cinematic Bottom Subtitle Bar — compact, movie-style */}
      <div className="pointer-events-auto w-full bg-black/85 border-t border-zinc-800/60 px-8 py-3 flex items-center gap-5 min-h-[80px]">
        {/* Speaker Badge */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow ${
            isOfficer 
              ? 'bg-blue-950/80 border-amber-400/70 text-amber-300' 
              : 'bg-zinc-900 border-cyan-400/70 text-cyan-300'
          }`}>
            <span className="material-symbols-outlined text-xl">
              {isOfficer ? 'local_police' : 'person'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={`font-mono text-[10px] font-black tracking-wider uppercase ${
              isOfficer ? 'text-amber-400' : 'text-cyan-300'
            }`}>
              {isOfficer ? '👮 Officer Girma' : `🚗 ${activeEncounter.plateNumber}`}
            </span>
            <span className="text-[9px] font-mono text-zinc-500">
              {isOfficer ? 'ትራፊክ ፖሊስ' : 'Driver'}
            </span>
          </div>
        </div>

        {/* Subtitles (Amharic + English) */}
        <div className="flex flex-col flex-1 gap-0.5">
          <div className="text-lg md:text-xl font-bold text-amber-100 tracking-wide drop-shadow-md">
            &ldquo;{activeEncounter.amharic}&rdquo;
          </div>
          <div className="text-xs font-mono text-zinc-400 italic">
            &ldquo;{activeEncounter.english}&rdquo;
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <span className="px-2 py-1 rounded bg-zinc-900/80 border border-zinc-700 text-zinc-300 font-mono text-[9px] font-bold uppercase tracking-wider">
            {activeEncounter.isDriverSteppedOut ? '🚶 OUT' : activeEncounter.plateConfiscated ? '🚫 PLATES' : '⚡ ACTIVE'}
          </span>
        </div>
      </div>
    </div>
  );
};
