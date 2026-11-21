import React, { useState, useRef, useCallback } from 'react';
import { useMission } from '../../store/useMission';
import { playClickTone, playTacticalBeep } from '../../utils/audio';
import { ConjunctionEvent } from '../../engine/constants';

export const Timeline: React.FC = () => {
  const {
    events,
    selAlertId,
    setSelAlertId,
    simMs,
    setSimMs,
    manifest,
    fleet,
    setSelSatId,
    executed,
  } = useMission();

  const [hoveredEvent, setHoveredEvent] = useState<ConjunctionEvent | null>(null);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // 72 hours starting from manifest fetch time or current simulation window
  const startMs = manifest?.fetched_utc
    ? new Date(manifest.fetched_utc).getTime()
    : simMs - 2 * 3600 * 1000;
  const durationMs = 72 * 3600 * 1000;

  const currentProgress = Math.max(0, Math.min(1, (simMs - startMs) / durationMs));

  // Find currently selected encounter
  const selectedEvent = events.find((e) => e.id === selAlertId) ?? events[0];
  const selectedTcaMs = selectedEvent ? new Date(selectedEvent.tca_utc).getTime() : null;
  const selectedProgress = selectedTcaMs
    ? Math.max(0, Math.min(1, (selectedTcaMs - startMs) / durationMs))
    : null;

  // Direct manipulation: compute simulation time from mouse/touch coordinate
  const updateScrubFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetMs = Math.round(startMs + ratio * durationMs);
      setSimMs(targetMs);
    },
    [startMs, durationMs, setSimMs]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    playClickTone();
    updateScrubFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateScrubFromPointer(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture safe fallback
      }
    }
  };

  const handleJumpToNow = () => {
    playClickTone();
    setSimMs(Date.now());
  };

  const handleJumpToTca = () => {
    if (!selectedEvent) return;
    playTacticalBeep();
    const tcaMs = new Date(selectedEvent.tca_utc).getTime();
    // Position simulation 90 seconds prior to TCA for immediate encounter inspection
    setSimMs(Math.max(startMs, tcaMs - 90 * 1000));
  };

  const handleStepPass = (direction: 'prev' | 'next') => {
    if (events.length === 0) return;
    playClickTone();
    const sorted = [...events].sort(
      (a, b) => new Date(a.tca_utc).getTime() - new Date(b.tca_utc).getTime()
    );
    const currentIndex = sorted.findIndex((e) => e.id === selAlertId);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = sorted.length - 1;
    if (nextIndex >= sorted.length) nextIndex = 0;
    const targetEvent = sorted[nextIndex];
    if (targetEvent) {
      setSelAlertId(targetEvent.id);
      const sat = fleet.find((f) => f.noradId === targetEvent.primary.norad);
      if (sat) setSelSatId(sat.id);
    }
  };

  // Formatted simulation clock and offset
  const simDateStr = new Date(simMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const hoursOffset = ((simMs - startMs) / 3600000).toFixed(1);

  return (
    <div className="relative bg-[#070B12]/95 border-t border-white/10 px-4 py-2.5 flex flex-col justify-between select-none text-xs text-chalk z-20 transition-colors">
      {/* Top Header Bar: Title, Transport Controls, and Status Legend */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-chalk-dim mb-1.5 overflow-x-auto no-scrollbar">
        {/* Left: Component Title and Current Scrubber Time */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-saffron ring-2 ring-saffron/20" />
            <span className="font-condensed font-bold uppercase tracking-wider text-chalk whitespace-nowrap">
              72-Hour Timeline
            </span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap">
            <span className="text-chalk-faint">Clock:</span>
            <span className="text-sky font-medium tabular-nums">{simDateStr}</span>
            <span className="text-[10px] text-chalk-faint px-1.5 py-0.2 rounded bg-white/5 border border-white/5 hidden md:inline">
              T+{hoursOffset}h
            </span>
          </div>
        </div>

        {/* Center / Right: Quick Temporal Jump Transport Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Step Previous Pass */}
          <button
            type="button"
            onClick={() => handleStepPass('prev')}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-chalk-dim hover:text-chalk border border-white/10 text-[10px] font-mono transition-all active:scale-95"
            title="Step to previous conjunction pass"
          >
            ◀ Prev
          </button>

          {/* Jump to Selected TCA */}
          {selectedEvent && (
            <button
              type="button"
              onClick={handleJumpToTca}
              className="px-2.5 py-0.5 rounded-full bg-sky/15 hover:bg-sky/25 border border-sky/30 text-sky text-[10px] font-mono font-medium transition-all active:scale-95"
              title="Jump simulation to 90s prior to selected encounter TCA"
            >
              Focus TCA (T-90s)
            </button>
          )}

          {/* Step Next Pass */}
          <button
            type="button"
            onClick={() => handleStepPass('next')}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-chalk-dim hover:text-chalk border border-white/10 text-[10px] font-mono transition-all active:scale-95"
            title="Step to next conjunction pass"
          >
            Next ▶
          </button>

          {/* Jump to Real Time Now */}
          <button
            type="button"
            onClick={handleJumpToNow}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-chalk-dim hover:text-chalk border border-white/10 text-[10px] font-mono transition-all active:scale-95"
            title="Reset simulation to current UTC time"
          >
            ⊙ Now
          </button>

          {/* Legend Badges */}
          <div className="hidden 2xl:flex items-center gap-2 text-[10px] font-mono text-chalk-faint pl-2 border-l border-white/10">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" /> &lt;5 km
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" /> &lt;25 km
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" /> Cleared
            </span>
          </div>
        </div>
      </div>

      {/* Double-Bezel Timeline Interactive Track Container */}
      <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-8 bg-[#05080E] rounded-xl border border-white/5 flex items-center px-1 cursor-ew-resize select-none overflow-visible shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
        >
          {/* Day 1 / Day 2 / Day 3 Alternating Sovereign Epoch Zones */}
          <div className="absolute inset-0 flex pointer-events-none rounded-xl overflow-hidden opacity-30">
            <div className="w-1/3 h-full border-r border-white/10 bg-white/[0.015]" />
            <div className="w-1/3 h-full border-r border-white/10 bg-transparent" />
            <div className="w-1/3 h-full bg-white/[0.015]" />
          </div>

          {/* Calibrated 3-Hour Minor Notches */}
          {Array.from({ length: 25 }, (_, i) => i * 3).map((hour) => {
            const leftPct = (hour / 72) * 100;
            const isMajor = hour % 12 === 0;
            return (
              <div
                key={`notch-${hour}`}
                className={`absolute pointer-events-none ${
                  isMajor
                    ? 'top-0 bottom-0 border-l border-white/20'
                    : 'top-2 bottom-2 border-l border-white/5'
                }`}
                style={{ left: `${leftPct}%` }}
              >
                {isMajor && (
                  <span className="text-[8px] text-chalk-faint font-mono pl-1 top-0.5 absolute">
                    +{hour}h
                  </span>
                )}
              </div>
            );
          })}

          {/* Selected Conjunction Target Vertical Guide Line */}
          {selectedProgress !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-amber-400/80 pointer-events-none z-10 transition-all duration-300"
              style={{ left: `${selectedProgress * 100}%` }}
            >
              <div className="absolute -top-1 -ml-[3px] w-2 h-2 rotate-45 bg-amber-400 border border-black shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <div className="absolute -bottom-1 -ml-[3px] w-2 h-2 rotate-45 bg-amber-400 border border-black shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
          )}

          {/* Interactive Event Conjunction Ticks */}
          {events.map((evt) => {
            const tcaMs = new Date(evt.tca_utc).getTime();
            const leftPct = ((tcaMs - startMs) / durationMs) * 100;
            if (leftPct < 0 || leftPct > 100) return null;

            const isSelected = selAlertId === evt.id;
            const isCleared = !!executed[evt.id];
            const isAlert = evt.class === 'alert' || evt.miss_km < 5.0;

            return (
              <div
                key={evt.id}
                onMouseEnter={() => {
                  setHoveredEvent(evt);
                  setHoverPct(leftPct);
                }}
                onMouseLeave={() => {
                  setHoveredEvent(null);
                  setHoverPct(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  playTacticalBeep();
                  setSelAlertId(evt.id);
                  const sat = fleet.find((f) => f.noradId === evt.primary.norad);
                  if (sat) setSelSatId(sat.id);
                }}
                className={`absolute top-1 bottom-1 w-3 -ml-1.5 flex items-center justify-center cursor-pointer transition-transform duration-150 z-20 ${
                  isSelected ? 'scale-125' : 'hover:scale-150'
                }`}
                style={{ left: `${leftPct}%` }}
              >
                <div
                  className={`w-2 h-5 rounded-full transition-all ${
                    isSelected
                      ? 'bg-sky ring-2 ring-sky/70 shadow-[0_0_12px_rgba(56,189,248,0.9)]'
                      : isCleared
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                      : isAlert
                      ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]'
                      : 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]'
                  }`}
                />
              </div>
            );
          })}

          {/* Active Simulation Scrubber Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-sky z-30 shadow-[0_0_10px_rgba(56,189,248,1)] pointer-events-none transition-all duration-100"
            style={{ left: `${currentProgress * 100}%` }}
          >
            {/* Upper Articulated Scrubber Diamond Head */}
            <div className="w-2.5 h-2.5 rounded-full bg-sky ring-2 ring-navy-950 -ml-[4px] -top-1.5 absolute shadow-[0_0_10px_rgba(56,189,248,1)]" />
            {/* Lower Pin Anchor */}
            <div className="w-1.5 h-1.5 rounded-full bg-sky -ml-[2px] -bottom-1 absolute shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          </div>

          {/* Floating Flight Dynamics Conjunction HUD Popover */}
          {hoveredEvent && hoverPct !== null && (
            <div
              className="absolute bottom-full mb-3 z-40 pointer-events-none -translate-x-1/2 w-72 p-1 rounded-2xl bg-white/[0.04] border border-white/15 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
              style={{ left: `${Math.max(12, Math.min(88, hoverPct))}%` }}
            >
              <div className="rounded-xl bg-[#080D16]/95 border border-white/5 p-3 space-y-2 text-xs">
                {/* Header: Spacecraft Pair */}
                <div className="flex items-start justify-between border-b border-white/10 pb-1.5">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-chalk-faint block">
                      Screened Conjunction
                    </span>
                    <div className="font-condensed font-bold text-sm tracking-wide text-chalk flex items-center gap-1.5">
                      <span>{hoveredEvent.primary.name}</span>
                      <span className="text-alert font-normal">×</span>
                      <span className="text-chalk-dim truncate max-w-[120px]">
                        {hoveredEvent.secondary.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-chalk-dim px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    #{hoveredEvent.id}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <div>
                    <span className="text-[9px] text-chalk-faint block">TCA Epoch:</span>
                    <span className="text-chalk tabular-nums">
                      {hoveredEvent.tca_utc.replace('T', ' ').slice(11, 19)} UTC
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-chalk-faint block">Miss Distance:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        executed[hoveredEvent.id]
                          ? 'text-emerald-400'
                          : hoveredEvent.miss_km < 1.0
                          ? 'text-rose-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {hoveredEvent.miss_km < 1.0
                        ? `${(hoveredEvent.miss_km * 1000).toFixed(0)} m`
                        : `${hoveredEvent.miss_km.toFixed(2)} km`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-chalk-faint block">Rel Velocity:</span>
                    <span className="text-chalk tabular-nums">
                      {hoveredEvent.rel_speed_kms.toFixed(2)} km/s
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-chalk-faint block">Collision Prob:</span>
                    <span className="text-sky font-semibold tabular-nums">
                      {hoveredEvent.pc.toExponential(1)}
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-white/5 text-[10px] text-center text-sky font-medium font-mono">
                  Click tick to lock target & inspect in B-Plane
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

