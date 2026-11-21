import React, { useState } from 'react';
import { useMission } from '../../store/useMission';
import { Why } from './Why';
import { Option, ExecutedBurn } from '../../engine/constants';
import { computeTsiolkovskyFuel } from '../../engine/predictionEngine';
import { playClickTone, playThrusterBurst, playTacticalBeep } from '../../utils/audio';

interface PlannerProps {
  onExecuteStart?: () => void;
}

export const Planner: React.FC<PlannerProps> = ({ onExecuteStart }) => {
  const {
    options,
    selOptionKey,
    setSelOptionKey,
    executeBurn,
    events,
    selAlertId,
    fleet,
    simMs,
    executed,
  } = useMission();

  const [isExecuting, setIsExecuting] = useState(false);

  const alert = events.find((e) => e.id === selAlertId) ?? events[0];
  const sat = fleet.find((f) => f.noradId === alert?.primary.norad);
  const isCleared = alert ? !!executed[alert.id] : false;

  const selectedOpt: Option | undefined =
    options.find((o) => o.key === selOptionKey) ?? options[0];

  // Baseline delta-v from late burn for "% saved" calculation
  const lateOpt = options.find((o) => o.key === 'late');
  const baselineDv = lateOpt ? lateOpt.dvMs : (selectedOpt ? selectedOpt.dvMs * 5 : 5.0);

  const handleExecute = () => {
    if (!alert || !selectedOpt || isExecuting || isCleared) return;

    playClickTone();
    setIsExecuting(true);
    onExecuteStart?.();

    // Choreographed 3-second sequence per Section 9.3:
    setTimeout(() => {
      const burnRecord: ExecutedBurn = {
        id: `BURN-${Date.now()}`,
        alertId: alert.id,
        satelliteId: sat?.id ?? 'primary',
        satelliteName: alert.primary.name,
        optionKey: selectedOpt.key,
        direction: selectedOpt.direction,
        leadOrbits: selectedOpt.leadOrbits,
        dvMs: selectedOpt.dvMs,
        baselineDvMs: baselineDv,
        propellantSavedKg: Math.max(
          0,
          computeTsiolkovskyFuel(sat?.wetMassKg || 2400, baselineDv, 220) -
            computeTsiolkovskyFuel(sat?.wetMassKg || 2400, selectedOpt.dvMs, 220)
        ),
        executedSimMs: simMs,
        burnLat: selectedOpt.burnLat,
        burnLon: selectedOpt.burnLon,
        burnOverIndia: selectedOpt.burnOverIndia,
        newMissKm: selectedOpt.missKm,
        newPc: selectedOpt.pcAfter,
      };

      playThrusterBurst();
      executeBurn(burnRecord);
      setIsExecuting(false);
    }, 2600);
  };

  const getOptionLabel = (key: Option['key'], dir: string) => {
    switch (key) {
      case 'early':
        return `Early ${dir.replace('_', ' ')}`;
      case 'late':
        return `Late ${dir.replace('_', ' ')} (baseline)`;
      case 'radial':
        return `Radial ${dir.replace('radial_', '')}`;
    }
  };

  if (!alert) return null;

  return (
    <div className="p-3 border-b border-white/10 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky ring-2 ring-sky/20" />
          <h3 className="font-condensed font-semibold text-xs tracking-wider uppercase text-chalk">
            Avoidance Manoeuvre Planner
          </h3>
        </div>
        <span className="text-[10px] text-chalk-faint font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
          Target Clearance: 5.0 km
        </span>
      </div>

      {options.length === 0 ? (
        <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-chalk-dim text-center font-mono text-[11px]">
          Synthesizing RTN impulse solutions...
        </div>
      ) : (
        <div className="space-y-2" role="radiogroup" aria-label="Manoeuvre Options">
          {options.map((opt) => {
            const isSelected = selectedOpt?.key === opt.key;
            const savingPct =
              baselineDv > opt.dvMs
                ? Math.round(((baselineDv - opt.dvMs) / baselineDv) * 100)
                : 0;

            return (
              <div
                key={opt.key}
                onClick={() => {
                  setSelOptionKey(opt.key);
                  playTacticalBeep();
                }}
                className={`p-1 rounded-xl transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-sky/15 border border-sky/70 ring-1 ring-sky/30 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                    : 'bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-black/40 space-y-2">
                  {/* Row Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-sky bg-sky'
                            : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-navy-950" />}
                      </div>
                      <span className="font-semibold text-chalk text-[11px]">
                        {getOptionLabel(opt.key, opt.direction)}
                      </span>
                    </div>
                    <div className="text-right">
                      <Why
                        tag="COMPUTED"
                        meaning="Impulse delta-v required for 5 km separation, plus equal recovery burn"
                        formula="Δv_total = Δv_burn × (1 + factor_recovery)"
                      >
                        <span className="font-mono text-chalk font-semibold tabular-nums">
                          {opt.dvMs.toFixed(3)} m/s
                        </span>
                      </Why>
                      <span className="text-[9px] text-chalk-faint font-mono block">
                        ({opt.totalDvMs.toFixed(3)} m/s total)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal delta-v comparison bar */}
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-sky/80 to-sky h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (opt.dvMs / Math.max(baselineDv, 1.0)) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] text-chalk-dim border-t border-white/5 font-mono">
                    <div>
                      <span className="text-chalk-faint block text-[9px]">Lead</span>
                      <span className="text-chalk tabular-nums">
                        {opt.leadOrbits} {opt.leadOrbits === 1 ? 'orb' : 'orbs'}
                      </span>
                    </div>
                    <div>
                      <span className="text-chalk-faint block text-[9px]">Miss</span>
                      <span className="text-ok font-semibold tabular-nums">
                        {opt.missKm.toFixed(2)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-chalk-faint block text-[9px]">Propellant</span>
                      <Why
                        tag="COMPUTED"
                        meaning="Propellant mass consumed via Tsiolkovsky equation"
                        formula="Δm = m0 × (1 - exp(-Δv / (g0 × Isp)))"
                      >
                        <span className="text-chalk tabular-nums">
                          {(opt.propellantKg * 1000).toFixed(0)} g
                        </span>
                      </Why>
                    </div>
                    <div>
                      <span className="text-chalk-faint block text-[9px]">Saved</span>
                      <span className="text-sky font-bold tabular-nums">
                        {savingPct > 0 ? `-${savingPct}%` : 'Base'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Option Operational Checks Hardware Inset */}
      {selectedOpt && (
        <div className="p-2.5 bg-black/50 border border-white/10 rounded-xl space-y-2 text-[11px]">
          <div className="flex items-start justify-between">
            <span className="text-chalk-faint text-[10px] font-mono">Ground-track drift:</span>
            <div className="text-right max-w-[200px]">
              <Why
                tag="COMPUTED"
                meaning="Ground-track drift per day at equator from orbital period change"
                formula="Δa = 2a·Δv/v, ΔT = 1.5T·Δa/a, Drift = ω_e·R_e·ΔT·(86400/T)"
              >
                <span className="font-mono text-chalk tabular-nums">
                  ~{selectedOpt.driftKmPerDay.toFixed(1)} km/day
                </span>
              </Why>
              <span className="text-[9px] text-chalk-faint font-mono block">
                vs {sat?.swathKm ?? 240} km swath until recovery
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-chalk-faint text-[10px] font-mono">Burn coordinates:</span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                selectedOpt.burnOverIndia
                  ? 'bg-saffron/15 text-saffron border-saffron/30'
                  : 'bg-white/5 text-chalk-dim border-white/10'
              }`}
            >
              {selectedOpt.burnLat.toFixed(1)}°N {selectedOpt.burnLon.toFixed(1)}°E (
              {selectedOpt.burnOverIndia ? 'Over India - coordinate SAR' : 'Outside India'})
            </span>
          </div>
        </div>
      )}

      {/* Primary Action Button (Nested Island Button Architecture) */}
      <button
        onClick={handleExecute}
        disabled={isExecuting || isCleared}
        className={`w-full py-2.5 px-4 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 group ${
          isCleared
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default'
            : isExecuting
            ? 'bg-sky/50 text-navy-950 cursor-wait'
            : 'bg-gradient-to-r from-sky to-sky/90 text-navy-950 hover:shadow-[0_0_24px_rgba(56,189,248,0.35)] active:scale-[0.98]'
        }`}
      >
        <span>
          {isCleared
            ? 'Burn committed · Orbit updated'
            : isExecuting
            ? 'Executing avoidance manoeuvre...'
            : 'Execute avoidance burn'}
        </span>
        {!isCleared && !isExecuting && (
          <span className="w-5 h-5 rounded-full bg-navy-950/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform text-[10px]">
            →
          </span>
        )}
      </button>
    </div>
  );
};
