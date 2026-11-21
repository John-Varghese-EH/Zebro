import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Orbit,
  Radio,
  Mouse,
  Heart,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ValleyBackground } from '../components/ValleyBackground';
import { LiquidGlassPane, paneLens, appleCardLens } from '../components/glass';
import { ThemeSwitcher } from '../components/hud/ThemeSwitcher';
import { playClickTone, playTacticalBeep, playThrusterBurst } from '../utils/audio';

/**
 * ZeBro Logo with signature zebra-stripe orbit ring
 */
const ZeBroLogo: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = '' }) => (
  <div
    className={`w-10 h-10 rounded-[14px] bg-gradient-to-b from-sky-500/20 to-blue-700/40 backdrop-blur-md flex items-center justify-center text-white shadow-[0_2px_14px_rgba(56,189,248,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-white/30 shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
    style={{ width: size, height: size }}
  >
    <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
      <circle cx="16.5" cy="16.5" r="5" fill="#1E293B" opacity="0.6" />
      <ellipse
        cx="18"
        cy="18"
        rx="14"
        ry="6"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeDasharray="3 3"
        transform="rotate(-28 18 18)"
        className="animate-[spin_30s_linear_infinite]"
      />
      <ellipse
        cx="18"
        cy="18"
        rx="14"
        ry="6"
        stroke="#38BDF8"
        strokeWidth="1.2"
        strokeDasharray="2 4"
        transform="rotate(32 18 18)"
        opacity="0.8"
      />
      <circle cx="18" cy="18" r="3" fill="#38BDF8" className="drop-shadow-[0_0_8px_#38BDF8]" />
      <circle cx="28" cy="13" r="1.8" fill="#F8FAFC" />
    </svg>
  </div>
);

/**
 * Interactive 3D Orbital Avoidance Visualizer
 * Simulates a real 7-second approach cycle:
 * Phase 1: Indian satellite (NISAR) on cyan orbit, debris approaching.
 * Phase 2: Close approach detected (miss: 46m) - orbit turns red.
 * Phase 3: Avoidance burn executed - orbit turns green, miss distance clears to 2.84 km!
 */
const OrbitalAvoidanceVisualizer: React.FC = () => {
  const [phase, setPhase] = useState<'approach' | 'critical' | 'avoided'>('approach');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cycleTime, setCycleTime] = useState<number>(1.2);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      setCycleTime((prev) => {
        const next = (prev + 0.1) % 7.5;
        if (next < 2.8) {
          setPhase('approach');
        } else if (next >= 2.8 && next < 4.8) {
          setPhase('critical');
        } else {
          setPhase('avoided');
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleManualBurn = () => {
    playThrusterBurst();
    setPhase('avoided');
    setCycleTime(5.0);
  };

  const handleReset = () => {
    playClickTone();
    setPhase('approach');
    setCycleTime(0.5);
  };

  const tNorm = (cycleTime / 7.5) * Math.PI * 2;
  const satX = 210 + 125 * Math.cos(tNorm);
  const satY = 135 + 52 * Math.sin(tNorm);

  const debT = ((cycleTime + 1.2) / 7.5) * Math.PI * 2;
  const debX = 210 + 115 * Math.cos(debT + 0.35);
  const debY = 135 + 62 * Math.sin(-debT - 0.4);

  return (
    <LiquidGlassPane
      borderRadius={24}
      displacement={28}
      lens={appleCardLens}
      tintColor="rgba(15, 23, 42, 0.32)"
      blur={8}
      saturate={1.8}
      className="w-full max-w-md p-4 sm:p-5 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-lg flex flex-col justify-between"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold tracking-wider text-white uppercase">
            {phase === 'critical'
              ? 'CRITICAL CONJUNCTION : 46m'
              : phase === 'avoided'
              ? 'AVOIDANCE EXECUTED : CLEARED'
              : 'REAL-TIME TRACKING : SGP4'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 rounded bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label="Toggle simulation loop"
          >
            <Play className={`w-3.5 h-3.5 ${isPlaying ? 'text-sky-400' : 'text-slate-400'}`} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Reset"
            aria-label="Reset simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Orbit SVG Display */}
      <div className="relative w-full h-52 sm:h-56 my-2 flex items-center justify-center select-none overflow-hidden rounded-xl bg-slate-950/40 border border-white/5">
        <svg viewBox="0 0 420 270" className="w-full h-full">
          <defs>
            <radialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#0369A1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="earthSurface" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="70%" stopColor="#020617" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
          </defs>

          {/* Earth Body & Atmosphere */}
          <circle cx="210" cy="135" r="76" fill="url(#earthGlow)" />
          <circle cx="210" cy="135" r="58" fill="url(#earthSurface)" stroke="#0284C7" strokeWidth="1" />
          <ellipse cx="210" cy="135" rx="58" ry="22" fill="none" stroke="#0369A1" strokeWidth="0.7" opacity="0.35" />
          <ellipse cx="210" cy="135" rx="32" ry="58" fill="none" stroke="#0369A1" strokeWidth="0.7" opacity="0.35" />
          <circle cx="210" cy="135" r="2.5" fill="#38BDF8" opacity="0.8" />
          <text x="218" y="139" fill="#38BDF8" fontSize="8" fontFamily="monospace" opacity="0.7">ISTRAC</text>

          {/* Debris Orbit Track */}
          <ellipse
            cx="210"
            cy="135"
            rx="140"
            ry="72"
            fill="none"
            stroke={phase === 'critical' ? '#F43F5E' : '#64748B'}
            strokeWidth={phase === 'critical' ? '1.5' : '0.8'}
            strokeDasharray="4 4"
            transform="rotate(42 210 135)"
            opacity={phase === 'critical' ? 0.9 : 0.35}
          />

          {/* Indian Satellite Orbit Track */}
          <ellipse
            cx="210"
            cy="135"
            rx="125"
            ry="52"
            fill="none"
            stroke={
              phase === 'critical'
                ? '#EF4444'
                : phase === 'avoided'
                ? '#10B981'
                : '#0EA5E9'
            }
            strokeWidth={phase === 'avoided' ? '2.2' : '1.8'}
            transform="rotate(-18 210 135)"
            className="transition-colors duration-500"
          />

          {/* Debris Object */}
          <g transform={`translate(${debX}, ${debY})`}>
            <circle cx="0" cy="0" r="2.8" fill="#F43F5E" className="drop-shadow-[0_0_6px_#F43F5E]" />
            <text x="6" y="3" fill="#FDA4AF" fontSize="7" fontFamily="monospace">
              DEBRIS (NORAD 30219)
            </text>
          </g>

          {/* Indian Satellite (NISAR) */}
          <g transform={`translate(${satX}, ${satY})`}>
            {phase === 'avoided' && (
              <circle cx="-5" cy="0" r="5" fill="#38BDF8" opacity="0.5" className="animate-ping" />
            )}
            <circle
              cx="0"
              cy="0"
              r="4"
              fill={phase === 'avoided' ? '#10B981' : phase === 'critical' ? '#EF4444' : '#38BDF8'}
              stroke="#FFFFFF"
              strokeWidth="1"
              className="drop-shadow-[0_0_8px_currentColor]"
            />
            <text x="8" y="3" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
              NISAR (747 km)
            </text>
          </g>

          {/* Critical Encounter Vector */}
          {phase === 'critical' && (
            <line
              x1={satX}
              y1={satY}
              x2={debX}
              y2={debY}
              stroke="#EF4444"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          )}
        </svg>

        {/* Readout Bar */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded bg-slate-900/70 border border-white/10 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Miss:</span>
            <span
              className={`font-semibold ${
                phase === 'critical'
                  ? 'text-rose-400'
                  : phase === 'avoided'
                  ? 'text-emerald-400'
                  : 'text-sky-300'
              }`}
            >
              {phase === 'critical' ? '46 m (ALERT)' : phase === 'avoided' ? '2.84 km (SAFE)' : '3.12 km'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Δv:</span>
            <span className="text-white font-semibold">
              {phase === 'avoided' ? '0.16 m/s (98% saved)' : '0.00 m/s'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-[11px] text-zinc-200 font-mono">
          {phase === 'avoided' ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" /> Collision cleared. Fuel preserved.
            </span>
          ) : (
            <span>Automated 2-orbit Clohessy-Wiltshire solver.</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleManualBurn}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95 shrink-0"
        >
          Execute Avoidance
        </button>
      </div>
    </LiquidGlassPane>
  );
};

export const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-transparent text-white flex flex-col justify-between selection:bg-sky-500/30 selection:text-sky-200 overflow-x-hidden font-sans">
      {/* 3D Valley Background Canvas with maximum visibility */}
      <ValleyBackground />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-5 sm:pt-6 pb-2 sm:pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group" onClick={() => playClickTone()}>
            <ZeBroLogo size={38} />
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-xl text-white leading-tight flex items-center gap-1">
                Ze<span className="text-sky-400">Bro</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-slate-300 uppercase">
                Astra 2026 : PS-06
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          <nav className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-300">
            <Link
              to="/fleet"
              onClick={() => playClickTone()}
              className="px-3 py-1.5 rounded-lg hover:text-white transition-colors"
            >
              Fleet Audit
            </Link>
          </nav>

          <ThemeSwitcher />

          <Link
            to="/hud"
            onClick={() => playTacticalBeep()}
            className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold shadow-[0_2px_14px_rgba(56,189,248,0.4)] ring-1 ring-white/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch live demo</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section: Minimal, Clean, Senior Editorial */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Senior Editorial Pitch */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-3">
              {/* Clean Eyebrow without AI pills or pulsing dots */}
              <div className="text-xs font-mono font-medium tracking-widest text-sky-300 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                AUTONOMOUS ORBITAL TRAFFIC CONTROL
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] text-white leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                Every dodge costs fuel. <br />
                <span className="text-zinc-200 font-normal">
                  ZeBro makes each one count.
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-zinc-200/90 max-w-xl leading-relaxed font-normal pt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                ZeBro tracks real orbital objects, finds the close approaches that matter, and plans the lowest-fuel avoidance manoeuvre. And restrict satellites from becoming debris. It also checks that your satellite can still de-orbit in time for India’s Debris-Free Space Missions 2030 goal.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/hud"
                onClick={() => playTacticalBeep()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-[0_2px_18px_rgba(56,189,248,0.5)] transition-all duration-200 hover:scale-[1.02]"
              >
                <span>Launch live demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/fleet"
                onClick={() => playClickTone()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-white font-medium text-sm border border-white/20 backdrop-blur-md transition-all duration-200 hover:border-white/40"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>DFSM-2030 Fleet Audit</span>
              </Link>
            </div>

            {/* 3 Minimal Architectural Specification Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
              <LiquidGlassPane
                borderRadius={18}
                displacement={24}
                lens={paneLens}
                tintColor="rgba(15, 23, 42, 0.3)"
                blur={6}
                saturate={1.8}
                className="p-3.5 space-y-1 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl group cursor-default"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white tracking-tight">
                  <span>Clohessy-Wiltshire</span>
                  <Orbit className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-[11px] text-zinc-200 leading-relaxed font-normal">
                  Closed-form analytical solver computes minimum along-track Δv with zero iteration.
                </p>
              </LiquidGlassPane>

              <LiquidGlassPane
                borderRadius={18}
                displacement={24}
                lens={paneLens}
                tintColor="rgba(15, 23, 42, 0.3)"
                blur={6}
                saturate={1.8}
                className="p-3.5 space-y-1 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl group cursor-default"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white tracking-tight">
                  <span>DFSM-2030 Audit</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-zinc-200 leading-relaxed font-normal">
                  Guarantees 5-year post-mission de-orbit fuel reserve for every active spacecraft.
                </p>
              </LiquidGlassPane>

              <LiquidGlassPane
                borderRadius={18}
                displacement={24}
                lens={paneLens}
                tintColor="rgba(15, 23, 42, 0.3)"
                blur={6}
                saturate={1.8}
                className="p-3.5 space-y-1 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl group cursor-default"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white tracking-tight">
                  <span>Deterministic SGP4</span>
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-[11px] text-zinc-200 leading-relaxed font-normal">
                  Propagated on public CelesTrak TLEs with zero synthetic or mock telemetry.
                </p>
              </LiquidGlassPane>
            </div>
          </div>

          {/* Right Column: Interactive 3D Orbital Avoidance Visualizer */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end w-full">
            <OrbitalAvoidanceVisualizer />
          </div>
        </div>
      </main>

      {/* Bottom Footer matching Slate design with TM.Zekoy attribution */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8">
        <LiquidGlassPane
          borderRadius={28}
          displacement={32}
          lens={appleCardLens}
          tintColor="rgba(15, 23, 42, 0.32)"
          blur={8}
          saturate={1.8}
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          className="w-full px-6 sm:px-8 py-4 sm:py-5 border-t border-x border-white/[0.12] shadow-2xl transition-all"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-200">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-center sm:text-left">
              <span className="text-white font-medium">ZeBro</span>
              <span className="text-zinc-500">•</span>
              <span className="inline-flex items-center gap-1 text-zinc-300">
                Crafted with
                <Heart
                  strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block transition-transform duration-200 hover:scale-125"
                  aria-label="passion"
                />
                by
              </span>
              <span className="text-white font-medium">
                <sub>TM</sub>.Zekoy
              </span>
              <span className="text-zinc-500 hidden md:inline">•</span>
              <span className="text-zinc-300 hidden md:inline">
                Astra 2026 : PS-06: Sustainable Space &amp; Space Environment
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium tracking-wide text-zinc-300 shrink-0">
              <Mouse className="w-3.5 h-3.5 text-sky-400" />
              <span>Scroll to explore the valley</span>
            </div>
          </div>
        </LiquidGlassPane>
      </footer>
    </div>
  );
};
