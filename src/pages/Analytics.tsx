import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMission } from '../store/useMission';
import { ThemeSwitcher } from '../components/hud/ThemeSwitcher';
import { DfsmCertificateModal } from '../components/hud/DfsmCertificateModal';
import { evaluateDfsm } from '../engine/dfsm';
import { A } from '../config/assumptions';
import { playClickTone, playTacticalBeep } from '../utils/audio';

export const Analytics: React.FC = () => {
  const { log, fleet, propellantPct, manifest } = useMission();
  const [certOpen, setCertOpen] = useState(false);

  // Summary Metrics calculations
  const totalSavedKg = log.reduce((sum, b) => sum + b.propellantSavedKg, 0);
  const totalPreservedDays = log.reduce((sum, b) => {
    const dvDiff = Math.max(0, b.baselineDvMs - b.dvMs);
    return sum + dvDiff / (A.annualSkDvMs / 365);
  }, 0);

  const outsideIndiaCount = log.filter((b) => !b.burnOverIndia).length;

  const fleetDfsmCounts = fleet.reduce(
    (acc, sat) => {
      const prop = (sat.propellantKg * (propellantPct[sat.id] ?? 100)) / 100;
      const res = evaluateDfsm(sat.altitudeKm ?? 600, sat.wetMassKg, prop);
      acc[res.verdict]++;
      return acc;
    },
    { green: 0, amber: 0, red: 0 }
  );

  const handleDownloadJson = () => {
    const data = {
      exported_at: new Date().toISOString(),
      manifest,
      assumptions: A,
      session_maneuver_log: log,
      fleet_readiness: fleet.map((sat) => {
        const prop = (sat.propellantKg * (propellantPct[sat.id] ?? 100)) / 100;
        const res = evaluateDfsm(sat.altitudeKm ?? 600, sat.wetMassKg, prop);
        return {
          satellite: sat.name,
          norad: sat.noradId,
          altitudeKm: sat.altitudeKm,
          propellantKg: prop,
          requiredDvMs: res.requiredDvMs,
          availableDvMs: res.availableDvMs,
          dfsmVerdict: res.verdict,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zebro-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-film-50 text-ink font-sans p-6 sm:p-12 print-page transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rule gap-4 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-saffron ring-4 ring-saffron/20" />
              <h1 className="font-condensed font-bold text-2xl uppercase tracking-wider text-ink">
                Zebro | Fleet Mission Report
              </h1>
            </div>
            <p className="text-xs text-ink/70 mt-1">
              Collision mitigation audit, propellant preservation, and DFSM-2030 de-orbit readiness ledger.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Segmented Global Nav */}
            <nav className="hidden md:flex items-center bg-film-100 border border-rule rounded-full p-0.5 text-[11px] font-medium mr-1 shadow-sm">
              <Link
                to="/overview"
                onClick={playClickTone}
                className="px-3 py-1 rounded-full text-ink/70 hover:text-ink transition-all"
              >
                Overview
              </Link>
              <Link
                to="/dashboard"
                onClick={playClickTone}
                className="px-3 py-1 rounded-full text-ink/70 hover:text-ink transition-all"
              >
                3D Console
              </Link>
              <Link
                to="/analytics"
                className="px-3 py-1 rounded-full bg-sky text-navy-950 font-bold shadow-sm transition-all"
              >
                Fleet Report
              </Link>
            </nav>

            <ThemeSwitcher compact={true} />
            <button
              onClick={() => {
                playTacticalBeep();
                setCertOpen(true);
              }}
              className="px-3 py-1.5 bg-saffron/15 hover:bg-saffron/25 border border-saffron/30 text-saffron-deep rounded-control text-xs font-semibold transition-colors shadow-sm"
              title="View and print official DFSM-2030 Disposal Compliance Certificate"
            >
              DFSM-2030 Certificate
            </button>
            <button
              onClick={() => {
                playClickTone();
                window.print();
              }}
              className="px-3 py-1.5 bg-film-100 hover:bg-rule/40 border border-rule text-ink rounded-control text-xs font-medium transition-colors"
            >
              Print / Save PDF
            </button>
            <button
              onClick={() => {
                playClickTone();
                handleDownloadJson();
              }}
              className="px-3 py-1.5 bg-sky-deep text-white hover:bg-sky-deep/90 rounded-control text-xs font-semibold transition-colors shadow-sm"
            >
              Download JSON log
            </button>
          </div>
        </header>

        {/* 1. Summary: 4 Refined Telemetry Cards */}
        <section className="border-b border-rule pb-6">
          <h2 className="font-condensed font-bold text-xs uppercase tracking-wider text-ink/60 mb-3">
            Session Flight Optimization Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl bg-film-100 border border-rule space-y-1">
              <span className="text-[11px] text-ink/60 block">Propellant Saved</span>
              <div className="font-mono text-2xl font-bold tabular-nums text-ink">
                {totalSavedKg.toFixed(2)} kg
              </div>
              <span className="text-[10px] text-sky-deep font-medium">vs late burn baseline</span>
            </div>

            <div className="p-4 rounded-xl bg-film-100 border border-rule space-y-1">
              <span className="text-[11px] text-ink/60 block">Mission Life Preserved</span>
              <div className="font-mono text-2xl font-bold tabular-nums text-ink">
                {totalPreservedDays.toFixed(1)} days
              </div>
              <span className="text-[10px] text-ok-deep font-medium">station-keeping margin</span>
            </div>

            <div className="p-4 rounded-xl bg-film-100 border border-rule space-y-1">
              <span className="text-[11px] text-ink/60 block">Fleet DFSM Readiness</span>
              <div className="font-mono text-2xl font-bold tabular-nums text-ink flex items-center gap-1.5">
                <span className="text-ok-deep">{fleetDfsmCounts.green}G</span>
                <span className="text-saffron-deep">{fleetDfsmCounts.amber}A</span>
                <span className="text-alert-deep">{fleetDfsmCounts.red}R</span>
              </div>
              <span className="text-[10px] text-ink/50">direct de-orbit bounds</span>
            </div>

            <div className="p-4 rounded-xl bg-film-100 border border-rule space-y-1">
              <span className="text-[11px] text-ink/60 block">Imaging Corridors Preserved</span>
              <div className="font-mono text-2xl font-bold tabular-nums text-ink">
                {outsideIndiaCount} of {log.length}
              </div>
              <span className="text-[10px] text-ink/50">burns outside India</span>
            </div>
          </div>
        </section>

        {/* 2. Efficiency Chart: Delta-v of Executed Burns against Late Baseline */}
        <section className="border-b border-rule pb-6">
          <h2 className="font-condensed font-bold text-xs uppercase tracking-wider text-ink/60 mb-3">
            Delta-v Efficiency Comparison (m/s)
          </h2>
          {log.length === 0 ? (
            <div className="p-6 bg-film-100 border border-rule rounded-xl text-center space-y-3">
              <p className="text-xs text-ink/70">
                No avoidance manoeuvres executed yet in this session.
              </p>
              <Link
                to="/dashboard"
                onClick={playClickTone}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky text-navy-950 font-bold text-xs hover:bg-sky/90 transition-all shadow-sm"
              >
                <span>Launch 3D Command Console</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="bg-film-100 p-4 border border-rule rounded-xl overflow-x-auto">
              <svg width="100%" height="160" viewBox="0 0 600 160" className="select-none text-xs">
                {/* Horizontal baseline */}
                <line x1="60" y1="130" x2="580" y2="130" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />

                {log.slice(0, 5).map((b, idx) => {
                  const x = 80 + idx * 100;
                  const maxDv = 6.0;
                  const burnH = Math.min(100, (b.dvMs / maxDv) * 100);
                  const baseH = Math.min(100, (b.baselineDvMs / maxDv) * 100);

                  return (
                    <g key={b.id}>
                      {/* Baseline bar (late burn) */}
                      <rect
                        x={x}
                        y={130 - baseH}
                        width="24"
                        height={baseH}
                        fill="rgb(var(--chalk-dim-rgb))"
                        fillOpacity="0.4"
                        rx="1"
                      />
                      <text
                        x={x + 12}
                        y={125 - baseH}
                        fontSize="9"
                        textAnchor="middle"
                        fill="currentColor"
                        fillOpacity="0.7"
                        className="font-mono"
                      >
                        {b.baselineDvMs.toFixed(2)}
                      </text>

                      {/* Actual executed burn */}
                      <rect
                        x={x + 28}
                        y={130 - burnH}
                        width="24"
                        height={burnH}
                        fill="rgb(var(--sky-deep-rgb))"
                        rx="1"
                      />
                      <text
                        x={x + 40}
                        y={125 - burnH}
                        fontSize="9"
                        textAnchor="middle"
                        fill="rgb(var(--sky-deep-rgb))"
                        fontWeight="600"
                        className="font-mono"
                      >
                        {b.dvMs.toFixed(2)}
                      </text>

                      <text
                        x={x + 26}
                        y="148"
                        fontSize="9"
                        textAnchor="middle"
                        fill="currentColor"
                        fontWeight="500"
                      >
                        {b.satelliteName.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Legend */}
                <g transform="translate(420, 20)">
                  <rect x="0" y="0" width="12" height="12" fill="rgb(var(--chalk-dim-rgb))" fillOpacity="0.4" />
                  <text x="18" y="10" fontSize="10" fill="currentColor">
                    Late burn baseline
                  </text>
                  <rect x="0" y="18" width="12" height="12" fill="rgb(var(--sky-deep-rgb))" />
                  <text x="18" y="28" fontSize="10" fill="currentColor" fontWeight="600">
                    Zebro early burn
                  </text>
                </g>
              </svg>
            </div>
          )}
        </section>

        {/* 3. Maneuver Log Table */}
        <section className="border-b border-rule pb-6">
          <h2 className="font-condensed font-bold text-xs uppercase tracking-wider text-ink/60 mb-3">
            Session avoidance manoeuvre log
          </h2>
          <div className="overflow-x-auto rounded-control border border-rule">
            <table className="w-full text-left text-xs">
              <thead className="bg-film-100 text-[10px] uppercase tracking-wider text-ink/60 border-b border-rule">
                <tr>
                  <th className="p-2.5">Time (UTC)</th>
                  <th className="p-2.5">Primary Satellite</th>
                  <th className="p-2.5">Manoeuvre</th>
                  <th className="p-2.5">Lead (orbits)</th>
                  <th className="p-2.5 text-right">Δv burn (m/s)</th>
                  <th className="p-2.5 text-right">Baseline (m/s)</th>
                  <th className="p-2.5 text-right">Fuel saved</th>
                  <th className="p-2.5 text-right">Miss after</th>
                  <th className="p-2.5">India pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono text-[11px]">
                {log.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-ink/50 italic font-sans">
                      No manoeuvres recorded.
                    </td>
                  </tr>
                ) : (
                  log.map((b) => (
                    <tr key={b.id} className="hover:bg-film-100/40">
                      <td className="p-2.5 tabular-nums">
                        {new Date(b.executedSimMs).toISOString().slice(11, 19)} UTC
                      </td>
                      <td className="p-2.5 font-sans font-medium">{b.satelliteName}</td>
                      <td className="p-2.5 font-sans capitalize">{b.direction.replace('_', ' ')}</td>
                      <td className="p-2.5 text-right">{b.leadOrbits}</td>
                      <td className="p-2.5 text-right font-bold text-sky-deep">
                        {b.dvMs.toFixed(3)}
                      </td>
                      <td className="p-2.5 text-right text-ink/60">
                        {b.baselineDvMs.toFixed(3)}
                      </td>
                      <td className="p-2.5 text-right text-ok-deep font-semibold">
                        {b.propellantSavedKg > 0 ? `${(b.propellantSavedKg * 1000).toFixed(0)} g` : 'Base'}
                      </td>
                      <td className="p-2.5 text-right">{b.newMissKm.toFixed(2)} km</td>
                      <td className="p-2.5 font-sans">
                        {b.burnOverIndia ? (
                          <span className="text-saffron-deep font-medium">Over India</span>
                        ) : (
                          <span className="text-ok-deep font-medium">Outside</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Fleet Readiness Table */}
        <section className="border-b border-rule pb-6">
          <h2 className="font-condensed font-bold text-xs uppercase tracking-wider text-ink/60 mb-3">
            Fleet DFSM-2030 compliance & propellant margins
          </h2>
          <div className="overflow-x-auto rounded-control border border-rule">
            <table className="w-full text-left text-xs">
              <thead className="bg-film-100 text-[10px] uppercase tracking-wider text-ink/60 border-b border-rule">
                <tr>
                  <th className="p-2.5">Asset</th>
                  <th className="p-2.5 text-right">Altitude (DATA)</th>
                  <th className="p-2.5 text-right">Wet Mass</th>
                  <th className="p-2.5 text-right">Propellant (ASSUMED)</th>
                  <th className="p-2.5 text-right">Direct Re-entry req.</th>
                  <th className="p-2.5 text-right">Available budget</th>
                  <th className="p-2.5">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono text-[11px]">
                {fleet.map((sat) => {
                  const currentProp =
                    (sat.propellantKg * (propellantPct[sat.id] ?? 100)) / 100;
                  const res = evaluateDfsm(
                    sat.altitudeKm ?? 600,
                    sat.wetMassKg,
                    currentProp
                  );

                  return (
                    <tr key={sat.id} className="hover:bg-film-100/40">
                      <td className="p-2.5 font-sans font-medium">
                        {sat.name}{' '}
                        <span className="text-[10px] text-ink/50">#{sat.noradId}</span>
                      </td>
                      <td className="p-2.5 text-right tabular-nums">
                        {sat.altitudeKm ? `${sat.altitudeKm} km` : '600 km'}
                      </td>
                      <td className="p-2.5 text-right tabular-nums">{sat.wetMassKg} kg</td>
                      <td className="p-2.5 text-right tabular-nums">
                        {currentProp.toFixed(1)} kg ({propellantPct[sat.id] ?? 100}%)
                      </td>
                      <td className="p-2.5 text-right tabular-nums">
                        {res.requiredDvMs.toFixed(1)} m/s
                      </td>
                      <td className="p-2.5 text-right tabular-nums font-bold text-sky-deep">
                        {res.availableDvMs.toFixed(1)} m/s
                      </td>
                      <td className="p-2.5 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-control text-[10px] font-semibold uppercase ${
                            res.verdict === 'green'
                              ? 'bg-ok/20 text-ok-deep'
                              : res.verdict === 'amber'
                              ? 'bg-saffron/20 text-saffron-deep'
                              : 'bg-alert/20 text-alert-deep'
                          }`}
                        >
                          {res.verdict}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer / Scope Statement */}
        <footer className="text-xs text-ink/60 space-y-2 pt-2">
          <p>
            <strong>Methodology & Scope:</strong> Zebro is a screening-level decision-support tool. It ingests public CelesTrak OMM ephemerides and applies Clohessy-Wiltshire relative motion models and Tsiolkovsky rocket dynamics.
          </p>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-ink/50 pt-2 border-t border-rule">
            <span>Project Zebro · Astra 2026 · Automated Flight Operations Support</span>
            <span>Data source: CelesTrak GP (OMM JSON) & ISRO Public Mission Specifications</span>
          </div>
        </footer>
      </div>

      <DfsmCertificateModal isOpen={certOpen} onClose={() => setCertOpen(false)} />
    </div>
  );
};
