import React from 'react';
import { useMission } from '../../store/useMission';
import { Tag } from './Tag';
import { Why } from './Why';
import { riskScore } from '../../engine/orbitalMath';

export const Threat: React.FC = () => {
  const { events, selAlertId, simMs, executed } = useMission();

  const alert = events.find((e) => e.id === selAlertId) ?? events[0];

  if (!alert) {
    return (
      <div className="p-3 border-b border-line text-xs text-chalk-dim">
        No conjunction selected.
      </div>
    );
  }

  const isCleared = !!executed[alert.id];
  const tcaMs = new Date(alert.tca_utc).getTime();
  const diffS = Math.floor((tcaMs - simMs) / 1000);
  const countdownStr =
    diffS > 0
      ? `T-${Math.floor(diffS / 3600)}h ${Math.floor((diffS % 3600) / 60)}m ${diffS % 60}s`
      : 'TCA elapsed';

  const score = riskScore(isCleared ? executed[alert.id].newPc : alert.pc);
  const totalRadiusM = alert.radii_m.primary + alert.radii_m.secondary;

  return (
    <div className="p-3 border-b border-white/10 space-y-2.5 text-xs">
      {/* Double-Bezel Card Outer Shell */}
      <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5">
        <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          {/* Header & Pair */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-chalk-faint block mb-0.5">
                Target Conjunction Pair
              </span>
              <div className="font-condensed font-bold text-base tracking-wide text-chalk flex items-center gap-2">
                <span className="text-chalk font-semibold">{alert.primary.name}</span>
                <span className="text-alert/80 font-normal">×</span>
                <span className="text-chalk-dim">{alert.secondary.name}</span>
              </div>
              <div className="text-[10px] text-chalk-faint font-mono mt-0.5">
                Pass ID: {alert.id}
              </div>
            </div>
            <Tag kind={alert.tag ?? 'COMPUTED'} />
          </div>

          {/* TCA & Countdown Hardware Inset Panel */}
          <div className="grid grid-cols-2 gap-2 bg-black/50 p-2.5 border border-white/10 rounded-lg">
            <div>
              <span className="text-[9px] text-chalk-faint uppercase tracking-[0.15em] block mb-0.5">
                Nominal TCA (UTC)
              </span>
              <span className="font-mono text-[11px] text-chalk tabular-nums block">
                {new Date(alert.tca_utc).toISOString().replace('T', ' ').slice(0, 19)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-chalk-faint uppercase tracking-[0.15em] block mb-0.5">
                Countdown
              </span>
              <span className="font-mono text-xs text-sky font-semibold tabular-nums block">
                {countdownStr}
              </span>
            </div>
          </div>

          {/* Covariance Uncertainty Row */}
          <div className="flex items-center justify-between text-[11px] text-chalk-dim pt-0.5 border-t border-white/5">
            <span className="text-chalk-faint font-mono text-[10px]">Uncertainty Covariance:</span>
            <Why
              tag="ASSUMED"
              meaning="Uncertainty covariance model growing with element age plus hard-body radii"
              formula="σ = σ_base + σ_daily × age, R_total = R_pri + R_sec"
              inputs={[
                { name: 'σ_base', value: '1000 m', tag: 'ASSUMED' },
                { name: 'Growth', value: '500 m/day', tag: 'ASSUMED' },
                { name: 'Primary R', value: `${alert.radii_m.primary} m`, tag: 'ASSUMED' },
                { name: 'Secondary R', value: `${alert.radii_m.secondary} m`, tag: 'ASSUMED' },
              ]}
            >
              σ = {(alert.sigma_m / 1000).toFixed(2)} km, R = {totalRadiusM.toFixed(1)} m
            </Why>
          </div>

          {/* Assessment Severity Badge */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-chalk-faint text-[10px] font-mono">Flight Assessment:</span>
            {isCleared ? (
              <span className="text-ok font-semibold bg-ok/15 border border-ok/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                Burn committed · Separation cleared
              </span>
            ) : (
              <span
                className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                  score >= 70
                    ? 'bg-alert/20 text-alert border-alert/40'
                    : score >= 40
                    ? 'bg-saffron/20 text-saffron border-saffron/40'
                    : 'bg-ok/20 text-ok border-ok/40'
                }`}
              >
                {score >= 70 ? 'Critical close approach' : score >= 40 ? 'Elevated watch' : 'Nominal clearance'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
