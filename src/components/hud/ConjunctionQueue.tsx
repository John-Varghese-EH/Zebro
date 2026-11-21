import React, { useState } from 'react';
import { useMission } from '../../store/useMission';
import { riskScore } from '../../engine/orbitalMath';
import { playClickTone, playTacticalBeep } from '../../utils/audio';

interface ConjunctionQueueProps {
  className?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const ConjunctionQueue: React.FC<ConjunctionQueueProps> = ({
  className = '',
  isExpanded,
  onToggleExpand,
}) => {
  const { events, selAlertId, setSelAlertId, fleet, setSelSatId, simMs, executed } = useMission();
  const [filter, setFilter] = useState<'all' | 'critical' | 'watch' | 'indian'>('all');

  const formatCountdown = (tcaUtc: string) => {
    const tcaMs = new Date(tcaUtc).getTime();
    const diffS = Math.floor((tcaMs - simMs) / 1000);
    if (diffS <= 0) return 'TCA elapsed';
    const h = Math.floor(diffS / 3600);
    const m = Math.floor((diffS % 3600) / 60);
    const s = diffS % 60;
    return `T-${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const handleSelectEvent = (eventId: string, primaryNorad: number) => {
    playClickTone();
    playTacticalBeep();
    setSelAlertId(eventId);
    const sat = fleet.find((f) => f.noradId === primaryNorad);
    if (sat) setSelSatId(sat.id);
  };

  const filteredEvents = events.filter((evt) => {
    const isCleared = !!executed[evt.id];
    const currentMiss = isCleared ? executed[evt.id].newMissKm : evt.miss_km;
    if (filter === 'critical') return currentMiss < 1.0;
    if (filter === 'watch') return currentMiss >= 1.0 && currentMiss <= 5.0;
    if (filter === 'indian') {
      const sat = fleet.find((f) => f.noradId === evt.primary.norad);
      return sat ? (sat.isIndian ?? true) : true;
    }
    return true;
  });

  return (
    <div className={`border-t border-white/10 bg-[#070B12]/90 backdrop-blur-2xl transition-all duration-300 ${className}`}>
      {/* Top Header Toggle Strip */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/10 text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-2 font-condensed font-bold text-xs uppercase tracking-wider text-chalk hover:text-sky transition-colors"
          >
            <span className="text-[10px] text-sky font-mono">{isExpanded ? '▼' : '▲'}</span>
            <span>Conjunction Screening Queue</span>
            <span className="text-[10px] font-mono text-chalk-dim px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {events.length} passes
            </span>
          </button>

          {/* Filter Pills */}
          {isExpanded && (
            <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-0.5 text-[10px]">
              {[
                { id: 'all', label: 'All Passes' },
                { id: 'critical', label: 'Critical (<1 km)' },
                { id: 'watch', label: 'Watch (<5 km)' },
                { id: 'indian', label: 'Indian Fleet' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
                    filter === tab.id
                      ? 'bg-sky text-navy-950 font-bold shadow-sm'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-chalk-dim">
          <span className="hidden md:inline font-mono">
            SGP4 Propagation Window: 72 Hours
          </span>
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-[11px] text-chalk-faint hover:text-chalk transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Expanded Table View */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto divide-y divide-white/5 select-none">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-[#090D14]/95 text-[10px] text-chalk-dim uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-1.5 px-4 font-medium">Primary Spacecraft</th>
                <th className="py-1.5 px-3 font-medium">Secondary Object</th>
                <th className="py-1.5 px-3 font-medium">Time of Closest Approach</th>
                <th className="py-1.5 px-3 font-medium text-right">Miss Distance</th>
                <th className="py-1.5 px-3 font-medium text-right">Rel Speed</th>
                <th className="py-1.5 px-3 font-medium text-right">Collision Prob</th>
                <th className="py-1.5 px-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-chalk-faint italic font-sans">
                    No conjunction events match the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const isSelected = selAlertId === evt.id;
                  const isCleared = !!executed[evt.id];
                  const currentMiss = isCleared ? executed[evt.id].newMissKm : evt.miss_km;
                  const currentPc = isCleared ? executed[evt.id].newPc : evt.pc;
                  const currentScore = riskScore(currentPc);

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => handleSelectEvent(evt.id, evt.primary.norad)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky/15 text-chalk font-semibold'
                          : 'hover:bg-white/[0.04] text-chalk-dim hover:text-chalk'
                      }`}
                    >
                      <td className="py-1.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
                          <span className="text-chalk font-sans font-bold">{evt.primary.name}</span>
                          <span className="text-[10px] text-chalk-faint">#{evt.primary.norad}</span>
                        </div>
                      </td>

                      <td className="py-1.5 px-3 text-chalk font-sans truncate max-w-[180px]">
                        {evt.secondary.name}
                      </td>

                      <td className="py-1.5 px-3 tabular-nums">
                        <span className="text-chalk">{formatCountdown(evt.tca_utc)}</span>
                        <span className="text-[10px] text-chalk-faint block">
                          {evt.tca_utc.replace('T', ' ').slice(11, 19)} UTC
                        </span>
                      </td>

                      <td className="py-1.5 px-3 text-right tabular-nums">
                        <span
                          className={`font-bold ${
                            isCleared
                              ? 'text-emerald-400'
                              : currentMiss < 1.0
                              ? 'text-rose-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {currentMiss < 1.0
                            ? `${(currentMiss * 1000).toFixed(0)} m`
                            : `${currentMiss.toFixed(2)} km`}
                        </span>
                      </td>

                      <td className="py-1.5 px-3 text-right tabular-nums text-chalk">
                        {evt.rel_speed_kms.toFixed(2)} km/s
                      </td>

                      <td className="py-1.5 px-3 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            currentPc > 1e-4 ? 'text-rose-400' : 'text-chalk'
                          }`}
                        >
                          {currentPc.toExponential(1)}
                        </span>
                      </td>

                      <td className="py-1.5 px-4 text-center">
                        {isCleared ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
                            CLEARED
                          </span>
                        ) : currentScore >= 70 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-bold">
                            CRITICAL
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                            WATCH
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
