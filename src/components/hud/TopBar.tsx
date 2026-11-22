import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMission, WarpFactor } from '../../store/useMission';
import { Tag } from './Tag';
import { ThemeSwitcher } from './ThemeSwitcher';
import { MissionGuide } from './MissionGuide';
import { ScenarioDrillModal } from './ScenarioDrillModal';
import { TelemetryApiModal } from './TelemetryApiModal';
import { playClickTone, isSoundEnabled, setSoundEnabled } from '../../utils/audio';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const {
    simMs,
    warp,
    setWarp,
    scenario,
    setScenario,
    manifest,
    fleet,
    setShortcutsOpen,
    view,
    setView,
    globePerspective,
    setGlobePerspective,
  } = useMission();

  const [guideOpen, setGuideOpen] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
  const [audioActive, setAudioActive] = useState(isSoundEnabled());

  const toggleAudio = () => {
    const next = !audioActive;
    setSoundEnabled(next);
    setAudioActive(next);
    if (next) playClickTone();
  };

  // UTC Clock formatting
  const dateObj = new Date(simMs);
  const timeStr = dateObj.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Data Age calculation
  const primarySat = fleet[0];
  const ageDays =
    manifest && primarySat
      ? (simMs - new Date(manifest.fetched_utc).getTime()) / 86400000
      : 0.5;
  const ageStr = `Age: ${Math.max(0.1, ageDays).toFixed(1)}d`;

  const warpOptions: { factor: WarpFactor; label: string }[] = [
    { factor: 0, label: 'Pause' },
    { factor: 1, label: '1x' },
    { factor: 10, label: '10x' },
    { factor: 100, label: '100x' },
    { factor: 500, label: '500x' },
  ];

  return (
    <>
      <header className="h-12 bg-black/85 backdrop-blur-2xl border-b border-white/10 px-3 sm:px-5 flex items-center justify-between select-none text-xs text-chalk z-30 overflow-x-auto no-scrollbar">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 group font-semibold text-chalk hover:text-white transition-colors"
          >
            <img src="/logo.png" alt="Zebro Logo" className="w-5 h-5 rounded-md object-contain shrink-0 shadow-sm" />
            <span className="font-condensed text-sm sm:text-base tracking-wider uppercase font-bold text-chalk">
              Zebro
            </span>
          </Link>
          <span className="text-white/20 hidden xl:inline">/</span>
          <span className="text-chalk-dim text-[11px] font-medium hidden 2xl:inline tracking-tight">
            Orbital Conjunction & Fuel-Optimal Avoidance
          </span>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-chalk-dim tabular-nums font-mono text-[11px] hidden md:inline">
            {timeStr}
          </span>
        </div>

        {/* Center: Warp Simulation Controls & 3D Console Perspective Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 gap-0.5 shadow-inner shrink-0">
            {warpOptions.map(({ factor, label }) => (
              <button
                key={factor}
                type="button"
                onClick={() => {
                  setWarp(factor);
                  playClickTone();
                }}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                  warp === factor
                    ? 'bg-sky text-navy-950 font-bold shadow-sm'
                    : 'text-chalk-dim hover:text-chalk hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 3D Console Perspective Switcher (active on 3D Console) */}
          {location.pathname === '/dashboard' && (
            <div className="hidden xl:flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 gap-0.5 text-[11px] font-medium shrink-0">
              <button
                type="button"
                onClick={() => {
                  setView('globe');
                  setGlobePerspective('overview');
                  playClickTone();
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  view === 'globe' && globePerspective === 'overview'
                    ? 'bg-white/20 text-chalk font-semibold shadow-sm'
                    : 'text-chalk-dim hover:text-chalk'
                }`}
              >
                Orbit
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('globe');
                  setGlobePerspective('satellite');
                  playClickTone();
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  view === 'globe' && globePerspective === 'satellite'
                    ? 'bg-sky text-navy-950 font-bold shadow-sm'
                    : 'text-chalk-dim hover:text-chalk'
                }`}
              >
                Spacecraft
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('globe');
                  setGlobePerspective('india');
                  playClickTone();
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  view === 'globe' && globePerspective === 'india'
                    ? 'bg-white/20 text-chalk font-semibold shadow-sm'
                    : 'text-chalk-dim hover:text-chalk'
                }`}
              >
                Zenith
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('split');
                  playClickTone();
                }}
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  view === 'split'
                    ? 'bg-sky text-navy-950 font-bold shadow-sm'
                    : 'text-chalk-dim hover:text-chalk'
                }`}
              >
                Ground Track
              </button>
            </div>
          )}
        </div>

        {/* Right: Global Navigation Pills & Mission Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Console Navigation */}
          <nav className="hidden xl:flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 text-[11px] font-medium">
            <Link
              to="/overview"
              className={`px-3 py-1 rounded-full transition-all ${
                location.pathname === '/overview'
                  ? 'bg-white/15 text-chalk font-semibold shadow-sm'
                  : 'text-chalk-dim hover:text-chalk'
              }`}
            >
              Overview
            </Link>
            <Link
              to="/dashboard"
              className={`px-3 py-1 rounded-full transition-all ${
                location.pathname === '/dashboard'
                  ? 'bg-sky text-navy-950 font-bold shadow-sm'
                  : 'text-chalk-dim hover:text-chalk'
              }`}
            >
              3D Console
            </Link>
            <Link
              to="/analytics"
              className={`px-3 py-1 rounded-full transition-all ${
                location.pathname === '/analytics'
                  ? 'bg-white/15 text-chalk font-semibold shadow-sm'
                  : 'text-chalk-dim hover:text-chalk'
              }`}
            >
              Fleet Report
            </Link>
          </nav>

          {/* Clickable Telemetry Gateway Pill */}
          <button
            type="button"
            onClick={() => {
              playClickTone();
              setTelemetryModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-[11px]"
            title="Inspect live orbital telemetry pipeline and space data portals"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-chalk-dim font-mono hidden xl:inline">LIVE API · ISRO Primary</span>
            <span className="text-chalk-dim hidden sm:inline">{ageStr}</span>
            <Tag kind={scenario ? 'SCENARIO' : 'DATA'} />
          </button>

          {/* Drill injection button */}
          {scenario ? (
            <button
              type="button"
              onClick={() => {
                playClickTone();
                setScenario(null);
              }}
              className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-full font-medium transition-colors text-[11px]"
              title="Clear active drill and return to live telemetry"
            >
              Exit Drill
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playClickTone();
                setScenarioModalOpen(true);
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-chalk rounded-full font-medium transition-colors text-[11px]"
              title="Inject calibrated conjunction drills or custom encounter geometry"
            >
              Drills
            </button>
          )}

          {/* Operations Guide */}
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="hidden sm:inline-block px-2.5 py-1 bg-sky/15 hover:bg-sky/25 border border-sky/30 text-sky font-semibold rounded-full transition-colors text-[11px]"
          >
            Guide
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`px-2 py-1 border rounded-full text-[11px] font-medium transition-all ${
              audioActive
                ? 'bg-sky/15 text-sky border-sky/30 font-semibold'
                : 'bg-white/5 text-chalk-faint border-white/10 hover:text-chalk'
            }`}
            title="Toggle audio feedback"
          >
            {audioActive ? 'Audio' : 'Mute'}
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher compact={true} />

          {/* Shortcuts Button */}
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-chalk-dim hover:text-chalk text-[11px]"
            title="Keyboard shortcuts (?)"
          >
            ?
          </button>
        </div>
      </header>

      <MissionGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <ScenarioDrillModal isOpen={scenarioModalOpen} onClose={() => setScenarioModalOpen(false)} />
      <TelemetryApiModal isOpen={telemetryModalOpen} onClose={() => setTelemetryModalOpen(false)} />
    </>
  );
};
