import React from 'react';
import { useMission } from '../../store/useMission';
import { Why } from './Why';
import { evaluateDfsm } from '../../engine/dfsm';
import { playTacticalBeep } from '../../utils/audio';

export const FleetList: React.FC = () => {
  const { fleet, events, selSatId, setSelSatId, propellantPct } = useMission();

  // For each satellite, calculate worst alert level
  const getWorstStatus = (noradId: number) => {
    const satEvents = events.filter((e) => e.primary.norad === noradId);
    if (!satEvents.length) return 'ok';
    if (satEvents.some((e) => e.class === 'alert')) return 'alert';
    if (satEvents.some((e) => e.class === 'watch')) return 'caution';
    return 'ok';
  };

  const statusColors: Record<string, string> = {
    alert: 'bg-alert text-alert',
    caution: 'bg-saffron text-saffron',
    ok: 'bg-ok text-ok',
  };

  return (
    <div className="border-b border-line p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-condensed font-semibold text-xs tracking-wider uppercase text-chalk-dim">
          Fleet assets (5 primaries)
        </h2>
        <span className="text-[10px] text-chalk-faint font-mono">ISRO EO</span>
      </div>

      <div className="space-y-1.5" role="listbox" aria-label="Fleet Satellites">
        {fleet.map((sat) => {
          const isSelected = selSatId === sat.id;
          const status = getWorstStatus(sat.noradId);
          const currentPropellantKg =
            (sat.propellantKg * (propellantPct[sat.id] ?? 100)) / 100;
          const dfsm = evaluateDfsm(
            sat.altitudeKm ?? 600,
            sat.wetMassKg,
            currentPropellantKg
          );

          return (
            <button
              key={sat.id}
              onClick={() => {
                setSelSatId(sat.id);
                playTacticalBeep();
              }}
              role="option"
              aria-selected={isSelected}
              className={`w-full text-left p-2 rounded-control border transition-all text-xs flex items-center justify-between ${
                isSelected
                  ? 'bg-navy-800 border-sky/70 shadow-sm'
                  : 'bg-navy-950/70 border-line/60 hover:bg-navy-800/60 hover:border-line'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[status]}`}
                  title={`Operational status: ${status}`}
                />
                <div className="truncate">
                  <div className="font-semibold text-chalk truncate flex items-center gap-1.5">
                    <span>{sat.name}</span>
                    <span className="text-[10px] text-chalk-faint font-mono">
                      #{sat.noradId}
                    </span>
                  </div>
                  <div className="text-[10px] text-chalk-dim flex items-center gap-1">
                    <span>Alt:</span>
                    <Why
                      tag="DATA"
                      meaning="Mean altitude above equatorial radius derived from OMM mean motion"
                      formula="a = (μ / n²)^(1/3), Alt = a - R_earth"
                      inputs={[
                        { name: 'n', value: `${((1440 / (sat.periodMin || 98)) * 1).toFixed(2)} rev/day`, tag: 'DATA' },
                        { name: 'R_earth', value: '6378.1 km', tag: 'ASSUMED' },
                      ]}
                      source={`CelesTrak GP ${sat.noradId}`}
                      epoch={sat.epoch}
                      age={sat.epochAgeDays ? `${sat.epochAgeDays.toFixed(1)} days` : undefined}
                    >
                      {sat.altitudeKm ? `${sat.altitudeKm} km` : '600 km'}
                    </Why>
                  </div>
                </div>
              </div>

              {/* DFSM Mini-badge */}
              <div
                className={`text-[10px] px-1.5 py-0.5 rounded-control font-medium border ${
                  dfsm.verdict === 'green'
                    ? 'bg-ok/15 text-ok border-ok/30'
                    : dfsm.verdict === 'amber'
                    ? 'bg-saffron/15 text-saffron border-saffron/30'
                    : 'bg-alert/15 text-alert border-alert/30'
                }`}
                title={`DFSM-2030 Status: ${dfsm.verdict.toUpperCase()} (${dfsm.availableDvMs.toFixed(0)}/${dfsm.requiredDvMs.toFixed(0)} m/s available)`}
              >
                DFSM {dfsm.verdict.toUpperCase()}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
