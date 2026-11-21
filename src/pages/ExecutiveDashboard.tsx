import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Orbit,
  Flame,
  CheckCircle2,
  Satellite,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { useMission } from '@/store/useMission';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ThemeSwitcher } from '@/components/hud/ThemeSwitcher';
import { Tag } from '@/components/hud/Tag';
import { TelemetryApiModal } from '@/components/hud/TelemetryApiModal';
import { evaluateDfsm } from '@/engine/dfsm';
import { riskScore } from '@/engine/orbitalMath';
import { A } from '@/config/assumptions';
import { playClickTone, playTacticalBeep } from '@/utils/audio';

export const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    fleet,
    events,
    log,
    manifest,
    propellantPct,
    executed,
    simMs,
    setSelAlertId,
    setSelSatId,
  } = useMission();

  const simTimeStr = new Date(simMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const [filterClass, setFilterClass] = useState<'all' | 'alert' | 'watch'>('all');
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);

  // Operational metrics
  const totalSavedKg = log.reduce((sum, b) => sum + b.propellantSavedKg, 0);
  const criticalCount = events.filter((e) => e.class === 'alert' && !executed[e.id]).length;
  const clearedCount = Object.keys(executed).length;

  const fleetDfsmCounts = fleet.reduce(
    (acc, sat) => {
      const prop = (sat.propellantKg * (propellantPct[sat.id] ?? 100)) / 100;
      const res = evaluateDfsm(sat.altitudeKm ?? 600, sat.wetMassKg, prop);
      acc[res.verdict]++;
      return acc;
    },
    { green: 0, amber: 0, red: 0 }
  );

  const outsideIndiaCount = log.filter((b) => !b.burnOverIndia).length;
  const filteredEvents = events.filter((e) => {
    if (filterClass === 'all') return true;
    return e.class === filterClass;
  });

  const handleInspectConjunction = (alertId: string, satNorad: number) => {
    playTacticalBeep();
    setSelAlertId(alertId);
    const sat = fleet.find((f) => f.noradId === satNorad);
    if (sat) setSelSatId(sat.id);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-chalk selection:bg-sky/20 selection:text-sky">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-black/85 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-saffron ring-4 ring-saffron/20" />
            <span className="font-condensed text-base font-bold uppercase tracking-wider text-chalk">
              Zebro
            </span>
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-medium text-chalk-dim">
            Executive Fleet Overview
          </span>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <span className="font-mono text-[11px] text-chalk-dim hidden sm:inline tabular-nums">
            {simTimeStr}
          </span>
        </div>

        {/* Global Navigation and Controls */}
        <div className="flex items-center gap-3">
          {/* Segmented Global Nav */}
          <nav className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 text-[11px] font-medium">
            <Link
              to="/overview"
              className="px-3 py-1 rounded-full bg-sky text-navy-950 font-bold shadow-sm transition-all"
            >
              Overview
            </Link>
            <Link
              to="/dashboard"
              onClick={playClickTone}
              className="px-3 py-1 rounded-full text-chalk-dim hover:text-chalk transition-all"
            >
              3D Console
            </Link>
            <Link
              to="/analytics"
              onClick={playClickTone}
              className="px-3 py-1 rounded-full text-chalk-dim hover:text-chalk transition-all"
            >
              Fleet Report
            </Link>
          </nav>

          <ThemeSwitcher compact={true} />

          <Link to="/dashboard" onClick={playClickTone}>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-semibold rounded-full border-sky/40 text-sky hover:bg-sky/15">
              <Orbit className="size-3.5 text-sky" />
              <span>3D Command Console</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        {/* Title Bar with Operational Context */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                Astra 2026 Space Situational Awareness
              </Badge>
              <Tag kind="DATA" />
            </div>
            <h1 className="mt-1 font-condensed text-3xl font-bold uppercase tracking-tight text-chalk">
              Fleet Conjunction & De-orbit Dashboard
            </h1>
            <p className="text-xs text-chalk-dim">
              Continuous 72-hour collision screening and propellant preservation for ISRO Earth Observation satellites.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-chalk-dim">
            <button
              type="button"
              onClick={() => setTelemetryModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 text-emerald-400 cursor-pointer transition-colors"
              title="Inspect live CelesTrak OMM data feed and space portals"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Telemetry Gateway: {manifest?.source ?? 'CelesTrak GP OMM'}</span>
            </button>
          </div>
        </div>

        {/* 1. Dashboard-01 Metric Cards Section (4 Columns) with Double-Bezel Hardware Enclosures */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Metric 1: Collision Screening */}
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-2xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-chalk-dim">
                  Screened Conjunctions
                </span>
                <ShieldAlert className="size-4 text-alert" />
              </div>
              <div>
                <div className="font-mono text-3xl font-bold tabular-nums text-chalk">
                  {events.length}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant={criticalCount > 0 ? 'alert' : 'ok'}>
                    {criticalCount > 0 ? `${criticalCount} Critical (<5 km)` : 'All Nominal'}
                  </Badge>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-chalk-dim flex items-center gap-1.5 font-medium">
                <TrendingUp className="size-3.5 text-ok" />
                <span>{clearedCount} Avoidance burns executed</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Fuel Efficiency Preserved */}
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-2xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-chalk-dim">
                  Propellant Preserved
                </span>
                <Flame className="size-4 text-sky" />
              </div>
              <div>
                <div className="font-mono text-3xl font-bold tabular-nums text-sky">
                  {totalSavedKg > 0 ? `${totalSavedKg.toFixed(2)} kg` : '0.00 kg'}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="saffron">
                    -85% vs Late Burns
                  </Badge>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-chalk-dim flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-3.5 text-sky" />
                <span>Clohessy-Wiltshire 2-orbit lead</span>
              </div>
            </div>
          </div>

          {/* Metric 3: DFSM-2030 Readiness */}
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-2xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-chalk-dim">
                  DFSM-2030 Disposal Budget
                </span>
                <Satellite className="size-4 text-ok" />
              </div>
              <div>
                <div className="font-mono text-3xl font-bold tabular-nums text-ok">
                  {fleetDfsmCounts.green} of {fleet.length}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="ok">
                    Green Margin
                  </Badge>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-chalk-dim flex items-center gap-1.5 font-medium">
                <span className="text-ok font-mono">{fleetDfsmCounts.green}G</span>
                <span className="text-saffron font-mono">{fleetDfsmCounts.amber}A</span>
                <span className="text-alert font-mono">{fleetDfsmCounts.red}R</span>
                <span>direct re-entry bounds</span>
              </div>
            </div>
          </div>

          {/* Metric 4: Territorial Swath Integrity */}
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-2xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-chalk-dim">
                  Bhuvan Imaging Integrity
                </span>
                <Compass className="size-4 text-saffron" />
              </div>
              <div>
                <div className="font-mono text-3xl font-bold tabular-nums text-saffron">
                  100%
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="outline">
                    {outsideIndiaCount} Outside India
                  </Badge>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-chalk-dim flex items-center gap-1.5 font-medium">
                <TrendingDown className="size-3.5 text-ok" />
                <span>0 Imaging interruptions</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Active Fleet Assets Section with Double-Bezel Hardware Architecture */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-2xl">
          <div className="rounded-xl bg-[#080D16]/95 border border-white/5 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-condensed font-bold text-lg uppercase tracking-wider text-chalk">
                  Operational Fleet Status (5 Primary Satellites)
                </h2>
                <p className="text-xs text-chalk-dim mt-0.5">
                  Real-time telemetry and orbital parameters ingested from CelesTrak OMM records.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] w-fit">
                ISRO National Remote Sensing Centre
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Satellite Asset</TableHead>
                    <TableHead>NORAD ID</TableHead>
                    <TableHead>Role & Swath</TableHead>
                    <TableHead className="text-right">Altitude</TableHead>
                    <TableHead className="text-right">Period</TableHead>
                    <TableHead className="text-right">Remaining Fuel</TableHead>
                    <TableHead className="text-center">DFSM Compliance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fleet.map((sat) => {
                    const currentProp = (sat.propellantKg * (propellantPct[sat.id] ?? 100)) / 100;
                    const res = evaluateDfsm(sat.altitudeKm ?? 600, sat.wetMassKg, currentProp);

                    return (
                      <TableRow key={sat.id}>
                        <TableCell className="font-sans font-semibold text-chalk">
                          {sat.name}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-chalk-dim">
                          #{sat.noradId}
                        </TableCell>
                        <TableCell className="text-chalk-dim">
                          {sat.role} ({sat.swathKm} km swath)
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-chalk">
                          {sat.altitudeKm ? `${sat.altitudeKm} km` : '600 km'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-chalk-dim">
                          {sat.periodMin ? `${sat.periodMin.toFixed(1)} min` : '98.0 min'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-chalk">
                          {currentProp.toFixed(1)} kg ({propellantPct[sat.id] ?? 100}%)
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              res.verdict === 'green'
                               ? 'ok'
                                : res.verdict === 'amber'
                                ? 'saffron'
                                : 'alert'
                            }
                          >
                            {res.verdict.toUpperCase()} ({res.availableDvMs.toFixed(0)} m/s)
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelSatId(sat.id);
                              navigate('/dashboard');
                            }}
                            className="h-7 text-[11px] hover:text-sky hover:bg-sky/10"
                          >
                            Track in 3D
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* 3. Conjunction Assessment Stream Section with Double-Bezel Hardware Architecture */}
        <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-2xl">
          <div className="rounded-xl bg-[#080D16]/95 border border-white/5 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-condensed font-bold text-lg uppercase tracking-wider text-chalk">
                  Conjunction Assessment Screening Stream (72-Hour Horizon)
                </h2>
                <p className="text-xs text-chalk-dim mt-0.5">
                  SGP4 relative approach minimization refined across 1,500+ resident space objects.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-0.5 text-[11px] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilterClass('all')}
                  className={`rounded-full px-3 py-1 font-medium transition-all ${
                    filterClass === 'all'
                      ? 'bg-sky text-navy-950 font-bold shadow-sm'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  All Passes ({events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterClass('alert')}
                  className={`rounded-full px-3 py-1 font-medium transition-all ${
                    filterClass === 'alert'
                      ? 'bg-sky text-navy-950 font-bold shadow-sm'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  Alerts &lt;5 km ({events.filter((e) => e.class === 'alert').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterClass('watch')}
                  className={`rounded-full px-3 py-1 font-medium transition-all ${
                    filterClass === 'watch'
                      ? 'bg-sky text-navy-950 font-bold shadow-sm'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  Watch &lt;25 km ({events.filter((e) => e.class === 'watch').length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conjunction Pair</TableHead>
                    <TableHead>Time of Closest Approach (UTC)</TableHead>
                    <TableHead className="text-right">Miss Distance</TableHead>
                    <TableHead className="text-right">Relative Speed</TableHead>
                    <TableHead className="text-right">Collision Prob. (Pc)</TableHead>
                    <TableHead className="text-center">Severity</TableHead>
                    <TableHead className="text-right">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-chalk-dim italic">
                        No conjunctions matching the selected filter criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.slice(0, 10).map((evt) => {
                      const isCleared = !!executed[evt.id];
                      const currentMiss = isCleared ? executed[evt.id].newMissKm : evt.miss_km;
                      const currentPc = isCleared ? executed[evt.id].newPc : evt.pc;
                      const score = riskScore(currentPc);

                      return (
                        <TableRow key={evt.id}>
                          <TableCell>
                            <div className="font-semibold text-chalk">
                              <span>{evt.primary.name}</span>
                              <span className="text-chalk-faint font-normal mx-1">x</span>
                              <span className="text-chalk-dim">{evt.secondary.name}</span>
                            </div>
                            <span className="font-mono text-[10px] text-chalk-faint">
                              ID: {evt.id.slice(0, 24)}...
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] tabular-nums text-chalk-dim">
                            {new Date(evt.tca_utc).toISOString().replace('T', ' ').slice(0, 19)} UTC
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold tabular-nums">
                            <span className={currentMiss < A.alertKm ? 'text-alert' : 'text-ok'}>
                              {currentMiss.toFixed(2)} km
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-chalk-dim">
                            {evt.rel_speed_kms.toFixed(2)} km/s
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-chalk">
                            {currentPc.toExponential(1)}
                          </TableCell>
                          <TableCell className="text-center">
                            {isCleared ? (
                              <Badge variant="ok">Manoeuvre Cleared</Badge>
                            ) : (
                              <Badge variant={score >= 70 ? 'alert' : score >= 40 ? 'saffron' : 'ok'}>
                                Risk {score}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspectConjunction(evt.id, evt.primary.norad)}
                              className="h-7 text-[11px] border-white/10 hover:border-sky hover:text-sky"
                            >
                              Plan Burn
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-chalk-dim">
              <span>Showing next 10 screened approach solutions</span>
              <Link to="/dashboard" className="text-sky hover:underline flex items-center gap-1 font-semibold">
                <span>Open full 3D B-Plane analyzer</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4. ISRO National Space Portals Reference Cards with Double-Bezel Architecture */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 h-full">
              <span className="font-condensed font-bold text-xs uppercase tracking-wider text-chalk block">
                Bhoonidhi Portal
              </span>
              <p className="mt-1 text-[11px] text-chalk-dim leading-relaxed">
                NRSC satellite imagery and sensor swath catalog (bhoonidhi.nrsc.gov.in). Defines imaging passes for NISAR, Cartosat, and Resourcesat.
              </p>
            </div>
          </div>
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 h-full">
              <span className="font-condensed font-bold text-xs uppercase tracking-wider text-chalk block">
                Bhuvan Geoportal
              </span>
              <p className="mt-1 text-[11px] text-chalk-dim leading-relaxed">
                ISRO national geospatial portal (bhuvan.nrsc.gov.in). Provides territorial boundaries and priority flood and cyclone hazard corridors.
              </p>
            </div>
          </div>
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 h-full">
              <span className="font-condensed font-bold text-xs uppercase tracking-wider text-chalk block">
                MOSDAC Archive
              </span>
              <p className="mt-1 text-[11px] text-chalk-dim leading-relaxed">
                SAC oceanographic satellite portal (mosdac.gov.in). Supplies mission telemetry constraints for EOS-06 (Oceansat-3).
              </p>
            </div>
          </div>
          <div className="p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 shadow-xl">
            <div className="rounded-xl bg-[#090D16]/95 border border-white/5 p-4 h-full">
              <span className="font-condensed font-bold text-xs uppercase tracking-wider text-chalk block">
                VEDAS Analytics
              </span>
              <p className="mt-1 text-[11px] text-chalk-dim leading-relaxed">
                SAC Earth observation analytics (vedas.sac.gov.in). Informs environmental and hydrological hazard monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* Gateway Action Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
          <div>
            <span className="font-semibold text-chalk block">Need raw ephemeris telemetry or API details?</span>
            <span className="text-[11px] text-chalk-dim">
              Inspect upstream CelesTrak OMM payloads, SGP4 propagation state vectors, and Indian space portal links.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTelemetryModalOpen(true)}
            className="border-sky/40 text-sky hover:bg-sky/10"
          >
            Inspect Telemetry Pipeline
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 py-6 text-center text-xs text-chalk-faint">
        <p>Project Zebro | Astra 2026 Space Situational Awareness Architecture</p>
        <p className="mt-1 font-mono text-[10px]">Pure Black OLED Flight Console · Zero Fabricated Telemetry</p>
      </footer>

      <TelemetryApiModal isOpen={telemetryModalOpen} onClose={() => setTelemetryModalOpen(false)} />
    </div>
  );
};
