import React from 'react';
import { useMission } from '../../store/useMission';
import { Why } from './Why';
import { evaluateDfsm } from '../../engine/dfsm';
import { Tag } from './Tag';

export const DfsmBadge: React.FC = () => {
  const { fleet, selSatId, propellantPct, setPropellantPct, executed } = useMission();

  const sat = fleet.find((f) => f.id === selSatId) ?? fleet[0];

  if (!sat) return null;

  const currentPct = propellantPct[sat.id] ?? 100;
  const currentPropKg = (sat.propellantKg * currentPct) / 100;

  // Sum planned / executed burns for this satellite
  const totalBurnDvMs = Object.values(executed)
    .filter((b) => b.satelliteId === sat.id)
    .reduce((sum, b) => sum + b.dvMs, 0);

  const dfsm = evaluateDfsm(
    sat.altitudeKm ?? 600,
    sat.wetMassKg,
    currentPropKg,
    totalBurnDvMs
  );

  return (
    <div className="p-3 border-b border-white/10 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          <h3 className="font-condensed font-semibold text-xs tracking-wider uppercase text-chalk">
            DFSM-2030 De-orbit Readiness
          </h3>
        </div>
        <span
          className={`font-semibold font-mono px-2 py-0.5 rounded-full text-[10px] border ${
            dfsm.verdict === 'green'
              ? 'bg-ok/20 text-ok border-ok/40'
              : dfsm.verdict === 'amber'
              ? 'bg-saffron/20 text-saffron border-saffron/40'
              : 'bg-alert/20 text-alert border-alert/40'
          }`}
        >
          {dfsm.verdict.toUpperCase()} ({dfsm.availableDvMs.toFixed(0)} / {dfsm.requiredDvMs.toFixed(0)} m/s)
        </span>
      </div>

      {/* Double-Bezel Hardware Enclosure */}
      <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5">
        <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          {/* Metrics Inset Grid */}
          <div className="grid grid-cols-2 gap-2 bg-black/50 p-2.5 border border-white/10 rounded-lg text-[11px]">
            <div>
              <span className="text-chalk-faint text-[9px] uppercase tracking-[0.15em] block mb-0.5">
                Direct Re-entry Req
              </span>
              <Why
                tag="COMPUTED"
                meaning="Retrograde burn at apogee to lower perigee to 60 km direct re-entry interface"
                formula="Δv = vc - sqrt(2μ·rp / (r1·(r1 + rp)))"
                inputs={[
                  { name: 'Alt', value: `${sat.altitudeKm ?? 600} km`, tag: 'DATA' },
                  { name: 'Perigee', value: '60 km', tag: 'ASSUMED' },
                ]}
              >
                <span className="font-mono text-chalk font-semibold tabular-nums text-xs">
                  {dfsm.requiredDvMs.toFixed(1)} m/s
                </span>
              </Why>
            </div>

            <div className="text-right">
              <span className="text-chalk-faint text-[9px] uppercase tracking-[0.15em] block mb-0.5">
                Available Budget
              </span>
              <Why
                tag="COMPUTED"
                meaning="Delta-v budget from remaining propellant mass minus executed avoidance burns"
                formula="Δv_avail = g0·Isp·ln(m0 / (m0 - prop)) - Δv_avoidance"
                inputs={[
                  { name: 'm0', value: `${sat.wetMassKg} kg`, tag: 'ASSUMED' },
                  { name: 'Fuel', value: `${currentPropKg.toFixed(1)} kg`, tag: 'ASSUMED' },
                  { name: 'Isp', value: '220 s', tag: 'ASSUMED' },
                ]}
              >
                <span className="font-mono text-sky font-bold tabular-nums text-xs">
                  {dfsm.availableDvMs.toFixed(1)} m/s
                </span>
              </Why>
            </div>
          </div>

          {/* Interactive Propellant "What-If" Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-chalk-dim flex items-center gap-1.5">
                <span>Propellant Remaining:</span>
                <Tag kind="ASSUMED" />
              </span>
              <span className="font-mono text-chalk font-semibold tabular-nums">
                {currentPropKg.toFixed(1)} kg ({currentPct}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={currentPct}
              onChange={(e) => setPropellantPct(sat.id, Number(e.target.value))}
              className="w-full accent-sky h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-chalk-faint font-mono">
              <span>0 kg (exhausted)</span>
              <span>Nominal ({sat.propellantKg} kg)</span>
            </div>
          </div>

          {/* Atmospheric Drag Heuristic */}
          {dfsm.isNaturalDecayCandidate && (
            <div className="text-[10px] text-ok bg-ok/10 border border-ok/20 p-2 rounded-lg flex items-center justify-between">
              <span>Altitude below 500 km natural decay bound</span>
              <Tag kind="ASSUMED" />
            </div>
          )}

          {/* Explanatory note */}
          <p className="text-[10px] text-chalk-faint leading-relaxed pt-1 border-t border-white/5">
            ISRO Debris-Free Space Missions (DFSM-2030) initiative mandates direct controlled re-entry within 5 years of mission end.
          </p>
        </div>
      </div>
    </div>
  );
};
