import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../stores';

interface LoginPortalProps {
  onLoginSuccess: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginSuccess }) => {
  const { login } = useSimulationStore();
  const [operatorId, setOperatorId] = useState('RX-8842');
  const [password, setPassword] = useState('routex-adama-2026');
  const [stationId] = useState('TERM-ADAMA-01');
  const [isBooting, setIsBooting] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleFillDemo = () => {
    setOperatorId('RX-8842');
    setPassword('routex-adama-2026');
  };

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooting(true);
  };

  // Holographic Bootup & Welcome Operator sequence
  useEffect(() => {
    if (!isBooting) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 40);

    const timer1 = setTimeout(() => setBootStep(1), 300);
    const timer2 = setTimeout(() => setBootStep(2), 700);
    const timer3 = setTimeout(() => setBootStep(3), 1100);
    const timer4 = setTimeout(() => setBootStep(4), 1600);
    const timer5 = setTimeout(() => {
      login(operatorId || 'RX-8842');
      onLoginSuccess();
    }, 2400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isBooting, operatorId, login, onLoginSuccess]);

  return (
    <div className="relative w-screen h-screen bg-[#0d0e15] overflow-hidden flex items-center justify-center select-none font-body-md text-on-surface">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 grid-bg opacity-35 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-[#0d0e15]/80 to-[#0d0e15] pointer-events-none" />

      {/* Cyber Scanning Ray Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="w-full h-1 bg-primary blur-sm animate-pulse" />
      </div>

      {isBooting ? (
        /* HOLOGRAPHIC BOOTUP / WELCOME OPERATOR SCREEN */
        <div className="relative z-20 w-full max-w-2xl bg-surface-container/95 backdrop-blur-xl border border-primary/60 rounded-lg p-xl shadow-[0_0_50px_rgba(76,215,246,0.3)] flex flex-col items-center text-center animate-fadeIn">
          {/* Glowing Animated Ring */}
          <div className="w-20 h-20 rounded-full border-2 border-primary/40 border-t-primary animate-spin flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(76,215,246,0.5)]">
            <span className="material-symbols-outlined text-primary text-[36px]">hub</span>
          </div>

          <div className="font-label-caps text-label-caps text-primary tracking-widest uppercase mb-2 animate-pulse">
            AUTHENTICATING ACCESS CLEARANCE
          </div>

          <h1 className="font-display text-[32px] md:text-[38px] text-on-surface font-bold tracking-tight text-glow-cyan font-mono">
            WELCOME, OPERATOR #{operatorId.toUpperCase()}
          </h1>

          <div className="font-data-md text-data-md text-tertiary font-mono mt-1">
            [ MISSION CONTROL // ADAMA METROPOLITAN GRID ]
          </div>

          {/* Diagnostic Log Lines */}
          <div className="w-full bg-surface-container-lowest/90 border border-outline-variant rounded p-md my-6 text-left font-data-sm text-[12px] space-y-1.5 font-mono shadow-inner">
            <div className={`transition-opacity ${bootStep >= 1 ? 'opacity-100 text-emerald-400' : 'opacity-30'}`}>
              ✓ BIOMETRICS & CREDENTIALS VERIFIED [LEVEL-4 CLEARANCE]
            </div>
            <div className={`transition-opacity ${bootStep >= 2 ? 'opacity-100 text-primary' : 'opacity-30'}`}>
              ✓ SATELLITE TELEMETRY ACQUIRED [ADAMA 8.54°N, 39.27°E]
            </div>
            <div className={`transition-opacity ${bootStep >= 3 ? 'opacity-100 text-secondary' : 'opacity-30'}`}>
              ✓ LIVE WORKER ENGINE SYNCED (48 SENSORS & ADAPTIVE SIGNALS)
            </div>
            <div className={`transition-opacity ${bootStep >= 4 ? 'opacity-100 text-tertiary font-bold' : 'opacity-30'}`}>
              ⚡ INITIALIZING ROUTEX TACTICAL SIMULATION SUITE...
            </div>
          </div>

          {/* Boot Progress Bar */}
          <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden border border-outline-variant">
            <div
              className="h-full bg-primary glow-cyan transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between w-full font-data-sm text-[11px] text-on-surface-variant mt-2 font-mono">
            <span>TERMINAL: TERM-ADAMA-01</span>
            <span className="text-primary font-bold">{progress}% READY</span>
          </div>
        </div>
      ) : (
        /* LOGIN PORTAL CARD */
        <div className="relative z-20 w-full max-w-lg bg-surface-container/95 backdrop-blur-xl border border-outline-variant rounded-lg p-lg md:p-xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant pb-md mb-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-[26px] text-primary font-bold uppercase tracking-tighter text-glow-cyan">
                  RouteX
                </span>
                <span className="font-data-sm text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-primary border border-outline-variant font-mono">
                  v4.2.0
                </span>
              </div>
              <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">
                ADAMA MUNICIPAL DISPATCH PORTAL
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary shadow-[0_0_12px_rgba(76,215,246,0.2)]">
              <span className="material-symbols-outlined text-[22px]">lock</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthorize} className="space-y-md">
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1.5">
                OPERATOR BADGE ID / IDENTIFIER
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-mono text-body-md rounded p-sm pl-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="RX-8842"
                />
                <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
                  badge
                </span>
              </div>
            </div>

            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1.5">
                ACCESS KEY / PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-mono text-body-md rounded p-sm pl-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••••••••••"
                />
                <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
                  key
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/60">
                <span className="font-data-sm text-[10px] text-on-surface-variant block">TERMINAL NODE</span>
                <span className="font-mono text-xs text-primary font-bold">{stationId}</span>
              </div>
              <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/60">
                <span className="font-data-sm text-[10px] text-on-surface-variant block">JURISDICTION</span>
                <span className="font-mono text-xs text-tertiary font-bold">ADAMA METRO</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-on-primary font-label-caps text-label-caps font-bold py-3 rounded hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(76,215,246,0.4)] uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
              Authorize & Enter Mission Control
            </button>
          </form>

          {/* Default Credentials Helper Callout */}
          <div className="mt-lg pt-md border-t border-outline-variant bg-surface-container-lowest/80 rounded p-md border">
            <div className="flex justify-between items-center mb-2">
              <div className="font-label-caps text-label-caps text-tertiary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                DEFAULT DEMO CREDENTIALS
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-mono text-primary hover:underline"
              >
                Auto-Fill
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-on-surface-variant">
              <div>
                <span className="text-on-surface-variant/70">Operator ID:</span>{' '}
                <strong className="text-on-surface">RX-8842</strong>
              </div>
              <div>
                <span className="text-on-surface-variant/70">Access Key:</span>{' '}
                <strong className="text-on-surface">routex-adama-2026</strong>
              </div>
              <div>
                <span className="text-on-surface-variant/70">Clearance:</span>{' '}
                <strong className="text-primary">Level 4 Dispatch</strong>
              </div>
              <div>
                <span className="text-on-surface-variant/70">Assigned Grid:</span>{' '}
                <strong className="text-tertiary">Adama City</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
