import React from 'react';
import { useSimulationStore } from '../../stores';

export const CinematicEncounterOverlay: React.FC = () => {
  const snapshot = useSimulationStore((s) => s.snapshot);
  const activeEncounter = (snapshot as any)?.activeEncounter;

  if (!activeEncounter) return null;

  const isOfficer = activeEncounter.speaker === 'officer';
  const isTelebirr = activeEncounter.stage === 'telebirr_payment';

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between select-none">
      {/* Cinematic Top Letterbox Bar */}
      <div className="w-full h-12 bg-black/90 flex items-center justify-between px-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="font-mono text-xs tracking-widest text-red-400 font-bold uppercase">
            POLICE INTERCEPT // STAGE: {activeEncounter.stage.replace('_', ' ').toUpperCase()}
          </span>
          {activeEncounter.plateConfiscated && (
            <span className="px-2 py-0.5 rounded bg-red-900/60 border border-red-500 text-red-200 text-[10px] font-mono animate-pulse">
              PLATE CONFISCATED [ {activeEncounter.plateNumber} ]
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px]">
          <span>TARGET: <strong className="text-cyan-300">{activeEncounter.plateNumber}</strong></span>
          <span>LOCATION: <strong className="text-zinc-200">ASTU INTERSECTION</strong></span>
        </div>
      </div>

      {/* Center Modal: Telebirr Payment Animation */}
      {isTelebirr && (
        <div className="pointer-events-auto self-center bg-[#071328]/95 border-2 border-[#008ed6] rounded-2xl p-5 shadow-[0_0_50px_rgba(0,142,214,0.4)] flex flex-col items-center gap-3 w-96 backdrop-blur-xl animate-in zoom-in duration-300">
          {/* Telebirr Header */}
          <div className="flex items-center justify-between w-full border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#008ed6] to-[#fed208] flex items-center justify-center font-black text-black text-sm shadow">
                tb
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#fed208] text-base leading-none tracking-wide">telebirr</span>
                <span className="text-[9px] text-[#38bdf8] font-mono">ቴሌብር ፈጣን የክፍያ ሥርዓት</span>
              </div>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              activeEncounter.isBribe 
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' 
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            }`}>
              {activeEncounter.isBribe ? 'DIRECT SETTLEMENT (ሻይ)' : 'OFFICIAL CITATION'}
            </span>
          </div>

          {/* Amount Display */}
          <div className="flex flex-col items-center my-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              {activeEncounter.isBribe ? 'Informal Settlement (ጉቦ / ሻይ)' : 'Traffic Fine Amount'}
            </span>
            <div className="flex items-baseline gap-1 text-[#fed208] font-extrabold text-3xl font-mono">
              <span>{activeEncounter.fineAmountETB.toLocaleString()}</span>
              <span className="text-sm text-cyan-400 font-bold">ETB</span>
            </div>
          </div>

          {/* Transfer Details Card */}
          <div className="w-full bg-[#0a1c38] rounded-xl p-3 border border-cyan-900/60 text-xs font-mono flex flex-col gap-1.5 text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-400">Recipient:</span>
              <span className="font-bold text-white text-right truncate max-w-[200px]">
                {activeEncounter.isBribe ? 'Officer Girma (Private Wallet)' : 'Federal Police Commission (Traffic)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Payer Vehicle:</span>
              <span className="font-bold text-cyan-300">{activeEncounter.plateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Txn Code:</span>
              <span className="font-mono text-emerald-400 font-bold">{activeEncounter.telebirrCode || 'TB-982184920'}</span>
            </div>
          </div>

          {/* Verified Transaction Badge */}
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 rounded-lg px-3 py-1.5 w-full justify-center text-xs font-mono">
            <span className="material-symbols-outlined text-base">verified</span>
            <span className="font-bold">ክፍያው በተሳካ ሁኔታ ተከናውኗል (Payment Confirmed)</span>
          </div>
        </div>
      )}

      {/* Cinematic Bottom Letterbox Bar with Authentic Subtitles */}
      <div className="w-full bg-black/95 border-t border-zinc-800/80 px-8 py-4 flex items-center justify-between gap-6 min-h-[105px]">
        {/* Speaker Avatar Badge */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg ${
            isOfficer 
              ? 'bg-blue-950/80 border-amber-400 text-amber-300 shadow-amber-500/20' 
              : 'bg-zinc-900 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
          }`}>
            <span className="material-symbols-outlined text-3xl">
              {isOfficer ? 'local_police' : 'person'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={`font-mono text-xs font-black tracking-wider uppercase ${
              isOfficer ? 'text-amber-400' : 'text-cyan-300'
            }`}>
              {isOfficer ? '👮‍♂️ Officer Girma (ትራፊክ ፖሊስ)' : `🚗 Driver (${activeEncounter.plateNumber})`}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {isOfficer ? 'Federal Traffic Division' : 'Private Vehicle Operator'}
            </span>
          </div>
        </div>

        {/* Subtitles (Amharic & English) */}
        <div className="flex flex-col flex-1 gap-1">
          {/* Amharic Script with Gold Emphasis */}
          <div className="text-xl md:text-2xl font-bold text-amber-100 tracking-wide drop-shadow-md">
            &ldquo;{activeEncounter.amharic}&rdquo;
          </div>
          {/* English Subtitle */}
          <div className="text-xs md:text-sm font-mono text-zinc-300 italic tracking-normal">
            &ldquo;{activeEncounter.english}&rdquo;
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-wider">
            {activeEncounter.isDriverSteppedOut ? '🚶 DRIVER OUTSIDE' : activeEncounter.plateConfiscated ? '🚫 NO PLATES' : '⚡ INTERCEPT'}
          </span>
          <span className="text-[9px] font-mono text-zinc-500">
            AUDIO: WHISTLE & TELEBIRR FX
          </span>
        </div>
      </div>
    </div>
  );
};
