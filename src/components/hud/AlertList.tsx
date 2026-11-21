import React from 'react';
import { useMission } from '../../store/useMission';
import { Tag } from './Tag';
import { Why } from './Why';
import { riskScore } from '../../engine/orbitalMath';
import { playTacticalBeep } from '../../utils/audio';

export const AlertList: React.FC = () => {
  const { events, selAlertId, setSelAlertId, simMs, executed } = useMission();

  const formatCountdown = (tcaUtc: string) => {
    const tcaMs = new Date(tcaUtc).getTime();
    const diffS = Math.floor((tcaMs - simMs) / 1000);
    if (diffS <= 0) return 'TCA elapsed';
    const h = Math.floor(diffS / 3600);
    const m = Math.floor((diffS % 3600) / 60);
    const s = diffS % 60;
    return `T-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="p-3 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-condensed font-semibold text-xs tracking-wider uppercase text-chalk-dim">
          Conjunction alerts (72 h)
        </h2>
        <span className="text-[10px] text-chalk-faint font-mono">
          {events.length} screened
        </span>
      </div>

      {events.length === 0 ? (
        <div className="p-4 bg-navy-950/60 border border-line rounded-control text-center text-xs text-chalk-dim">
          No approach under 25 km in the next 72 hours. Add a scenario to see how the planner works.
        </div>
      ) : (
        <div className="space-y-1.5" role="listbox" aria-label="Conjunction Alerts">
          {events.slice(0, 15).map((evt) => {
            const isSelected = selAlertId === evt.id;
            const isCleared = !!executed[evt.id];
            const currentPc = isCleared ? executed[evt.id].newPc : evt.pc;
            const currentMiss = isCleared ? executed[evt.id].newMissKm : evt.miss_km;
            const currentScore = riskScore(currentPc);

            return (
              <button
                key={evt.id}
                onClick={() => {
                  setSelAlertId(evt.id);
                  playTacticalBeep();
                }}
                role="option"
                aria-selected={isSelected}
                className={`w-full text-left p-2.5 rounded-control border transition-all text-xs flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-navy-800 border-sky/80 ring-1 ring-sky/30 shadow-sm'
                    : 'bg-navy-950/70 border-line/60 hover:bg-navy-800/60 hover:border-line'
                }`}
              >
                {/* Header: Primary & Secondary */}
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-chalk truncate">
                    <span>{evt.primary.name}</span>
                    <span className="text-chalk-faint font-normal mx-1">×</span>
                    <span className="text-chalk-dim">{evt.secondary.name}</span>
                  </div>
                  <Tag kind={evt.tag ?? 'COMPUTED'} />
                </div>

                {/* Sub-header: Countdown & Risk Score */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-chalk-dim tabular-nums">
                    {formatCountdown(evt.tca_utc)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isCleared && (
                      <span className="text-[10px] font-semibold text-ok bg-ok/15 px-1 py-0.5 rounded-control">
                        Cleared
                      </span>
                    )}
                    <span
                      className={`font-semibold tabular-nums px-1.5 py-0.5 rounded-control text-[10px] ${
                        currentScore >= 70
                          ? 'bg-alert/20 text-alert'
                          : currentScore >= 40
                          ? 'bg-saffron/20 text-saffron'
                          : 'bg-ok/20 text-ok'
                      }`}
                    >
                      Risk {currentScore}
                    </span>
                  </div>
                </div>

                {/* Metrics: Miss distance, Relative Speed, Pc */}
                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-line/40 text-[10px] text-chalk-dim">
                  <div>
                    <span className="text-chalk-faint block">Miss</span>
                    <Why
                      tag="COMPUTED"
                      meaning="Closest approach distance refined via SGP4 scalar minimization"
                      formula="d = min_t ||r_primary(t) - r_secondary(t)||"
                    >
                      {currentMiss.toFixed(2)} km
                    </Why>
                  </div>

                  <div>
                    <span className="text-chalk-faint block">v_rel</span>
                    <span className="tabular-nums font-mono text-chalk">
                      {evt.rel_speed_kms.toFixed(2)} km/s
                    </span>
                  </div>

                  <div>
                    <span className="text-chalk-faint block">Pc</span>
                    <Why
                      tag="COMPUTED"
                      meaning="Screening 2D collision probability with spherical combined hard body radius"
                      formula="Pc = (R² / 2σ²) * exp(-d² / 2σ²)"
                      inputs={[
                        { name: 'R', value: `${(evt.radii_m.primary + evt.radii_m.secondary).toFixed(1)} m`, tag: 'ASSUMED' },
                        { name: 'σ', value: `${evt.sigma_m.toFixed(0)} m`, tag: 'ASSUMED' },
                      ]}
                    >
                      {currentPc.toExponential(1)}
                    </Why>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
