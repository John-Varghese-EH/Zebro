import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Heart,
  Mouse,
  Activity,
} from 'lucide-react';
import { ValleyBackground } from '../components/ValleyBackground';
import { LiquidGlassPane, appleCardLens } from '../components/glass';
import { playClickTone, playTacticalBeep } from '../utils/audio';

/**
 * Zebro Logo with signature zebra-stripe orbit ring in clean aerospace monochrome
 */
const ZebroLogo: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = '' }) => (
  <img
    src="/logo.png"
    alt="Zebro Logo"
    style={{ width: size, height: size }}
    className={`rounded-[12px] object-contain shrink-0 shadow-[0_2px_14px_rgba(0,0,0,0.5)] ring-1 ring-white/20 transition-transform duration-200 hover:scale-105 ${className}`}
  />
);

export const Landing: React.FC = () => {
  return (
    <div className="relative h-screen h-[100dvh] overflow-hidden flex flex-col justify-between selection:bg-white/20 selection:text-white bg-transparent text-white font-sans select-none">
      {/* 3D Valley Background Canvas with maximum visibility */}
      <ValleyBackground />

      {/* Top Header / Navigation Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-5 sm:pt-7 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group" onClick={() => playClickTone()}>
            <ZebroLogo size={38} />
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-xl text-white leading-tight flex items-center gap-1.5">
                Zebro
              </span>
              <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
                Astra 2026 : PS-06
              </span>
            </div>
          </Link>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <Link
            to="/fleet"
            onClick={() => playClickTone()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/50 hover:bg-slate-800/70 text-zinc-300 text-xs font-medium border border-white/10 backdrop-blur-md transition-all hover:text-white"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fleet Audit</span>
          </Link>

          <Link
            to="/dashboard"
            onClick={() => playTacticalBeep()}
            className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-semibold shadow-[0_2px_14px_rgba(255,255,255,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch 3D Monitor</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section: Minimal Editorial Layout */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 flex-1 flex flex-col justify-center min-h-0 pb-16 sm:pb-24">
        <div className="max-w-3xl space-y-6 text-left">
          {/* Eyebrow */}
          <div className="text-[11px] sm:text-xs font-mono font-medium tracking-widest text-zinc-400 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            AUTONOMOUS ORBITAL TRAFFIC CONTROL
          </div>

          {/* User-Specified Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] text-white leading-[1.08] drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)]">
            Every dodge costs fuel. <br />
            <span className="text-zinc-300 font-normal">
              Zebro makes each one count.
            </span>
          </h1>

          {/* User-Specified Body Text */}
          <p className="text-sm sm:text-base lg:text-lg text-zinc-200/95 leading-relaxed font-normal max-w-2xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
            Zebro tracks real orbital objects, finds the close approaches that matter, and plans the lowest-fuel avoidance manoeuvre. It checks that your satellite preserves lifetime reserves to de-orbit in time for India’s Debris-Free Space Missions 2030 goal.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              to="/dashboard"
              onClick={() => playTacticalBeep()}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs sm:text-sm shadow-[0_2px_18px_rgba(255,255,255,0.22)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch 3D Operations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/fleet"
              onClick={() => playClickTone()}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all duration-200 hover:border-white/35 active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>View Fleet Audit</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Footer with Rounded Top Corners */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 w-full max-w-6xl mx-auto px-4 sm:px-8 pointer-events-auto">
        <LiquidGlassPane
          borderRadius={28}
          displacement={32}
          lens={appleCardLens}
          tintColor="rgba(15, 23, 42, 0.35)"
          blur={10}
          saturate={1.8}
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          className="w-full px-6 sm:px-8 py-3.5 sm:py-4 border-t border-x border-white/[0.12] shadow-2xl transition-all"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-300">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-center sm:text-left">
              <span className="text-white font-medium">Zebro</span>
              <span className="text-zinc-500">•</span>
              <span className="inline-flex items-center gap-1">
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
              <span className="hidden md:inline">Astra 2026 : PS-06</span>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>SGP4 Telemetry Active</span>
              </span>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Mouse className="w-3.5 h-3.5 text-zinc-400" />
                <span>Scroll to explore 3D valley</span>
              </div>
            </div>
          </div>
        </LiquidGlassPane>
      </footer>
    </div>
  );
};
