import React, { useEffect, useState } from 'react';
import { useMission } from '../store/useMission';
import { loadMissionData } from '../data/load';
import { TopBar } from '../components/hud/TopBar';
import { Threat } from '../components/hud/Threat';
import { EncounterPlot } from '../components/hud/EncounterPlot';
import { Planner } from '../components/hud/Planner';
import { DfsmBadge } from '../components/hud/DfsmBadge';
import { Timeline } from '../components/hud/Timeline';
import { ConjunctionQueue } from '../components/hud/ConjunctionQueue';
import { Copilot } from '../components/hud/Copilot';
import { Shortcuts } from '../components/hud/Shortcuts';
import { Globe } from '../components/globe/Globe';
import { GroundTrack } from '../components/map/GroundTrack';
import { planAll, buildGrid, Ctx } from '../engine/planner';
import { isOverIndia } from '../geo/india';
import * as satellite from 'satellite.js';
import { State, Vec3 } from '../engine/constants';

type InspectorTab = 'plan' | 'bplane' | 'dfsm';

export const Dashboard: React.FC = () => {
  const {
    loadData,
    tick,
    events,
    selAlertId,
    setSelAlertId,
    selSatId,
    setSelSatId,
    fleet,
    fleetSatrecs,
    setOptions,
    view,
    scenario,
  } = useMission();

  const [burnAnim, setBurnAnim] = useState(1.0);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('plan');
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [queueExpanded, setQueueExpanded] = useState(true);

  // Initialize mission datasets
  useEffect(() => {
    loadMissionData().then((data) => {
      loadData(data);
    });
  }, [loadData]);

  // Main sim clock tick (requestAnimationFrame loop)
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      tick(dt);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [tick]);

  // Read URL hash on load (#sat=<id>, #alert=<id>) per Section 9.5
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#sat=')) {
      const id = hash.replace('#sat=', '');
      useMission.getState().setSelSatId(id);
    } else if (hash.startsWith('#alert=')) {
      const id = hash.replace('#alert=', '');
      useMission.getState().setSelAlertId(id);
    }
  }, []);

  // Update document title per Section 9.5
  useEffect(() => {
    const currentAlert = events.find((e) => e.id === selAlertId);
    if (currentAlert) {
      document.title = `Zebro | ${currentAlert.primary.name} × ${currentAlert.secondary.name} (${currentAlert.miss_km.toFixed(2)} km)`;
    } else {
      document.title = 'Zebro | Command Center';
    }
  }, [selAlertId, events]);

  // Whenever selAlertId changes, compute avoidance manoeuvre options using SGP4 grid
  useEffect(() => {
    const alert = events.find((e) => e.id === selAlertId) ?? events[0];
    if (!alert) return;

    const sat = fleet.find((f) => f.noradId === alert.primary.norad);
    const satrec = sat ? fleetSatrecs[sat.noradId] : null;

    const tcaDate = new Date(alert.tca_utc);
    const tcaMs = tcaDate.getTime();
    const currentSimMs = useMission.getState().simMs;
    const secondsToTca = Math.max(10, (tcaMs - currentSimMs) / 1000);

    const periodMin = sat?.periodMin || 98;
    const periodS = periodMin * 60;
    const n = (2 * Math.PI) / periodS;

    let pState: (dt: number) => State;
    let sState: (dt: number) => State;

    if (scenario && scenario.event.id === alert.id) {
      pState = scenario.pAt;
      sState = scenario.sAt;
    } else {
      pState = (dt: number) => {
        const t = new Date(tcaMs + dt * 1000);
        if (satrec) {
          const pv = satellite.propagate(satrec, t);
          if (pv && typeof pv.position !== 'boolean' && pv.position && pv.velocity) {
            return {
              r: [pv.position.x, pv.position.y, pv.position.z],
              v: [pv.velocity.x, pv.velocity.y, pv.velocity.z],
            };
          }
        }
        const rPri = alert.r_pri_tca ?? [7000, 0, 0];
        return { r: [rPri[0], rPri[1], rPri[2]], v: [0, 7.5, 0] };
      };

      sState = (dt: number) => {
        if (alert.r_sec_tca && alert.v_sec_tca) {
          const linR: Vec3 = [
            alert.r_sec_tca[0] + alert.v_sec_tca[0] * dt,
            alert.r_sec_tca[1] + alert.v_sec_tca[1] * dt,
            alert.r_sec_tca[2] + alert.v_sec_tca[2] * dt,
          ];
          return { r: linR, v: alert.v_sec_tca };
        }
        const p0 = pState(0);
        return {
          r: [p0.r[0] + alert.miss_km, p0.r[1], p0.r[2]],
          v: [0, 7.5 + alert.rel_speed_kms, 0],
        };
      };
    }

    const grid = buildGrid(pState, sState, 20, 0.5);

    const ctx: Ctx = {
      grid,
      n,
      periodS,
      secondsToTca,
      altKm: sat?.altitudeKm || 747,
      m0: sat?.wetMassKg || 2400,
      sigmaM: alert.sigma_m || 1000,
      radiusM: (alert.radii_m.primary + alert.radii_m.secondary) || 3.0,
    };

    const burnLatLon = (leadS: number) => {
      const burnTime = new Date(tcaMs - leadS * 1000);
      if (satrec) {
        const pv = satellite.propagate(satrec, burnTime);
        if (pv && typeof pv.position !== 'boolean' && pv.position) {
          const gmst = satellite.gstime(burnTime);
          const geo = satellite.eciToGeodetic(pv.position, gmst);
          return {
            lat: satellite.degreesLat(geo.latitude),
            lon: satellite.degreesLong(geo.longitude),
          };
        }
      }
      return { lat: 15.0, lon: 78.0 };
    };

    const res = planAll(ctx, isOverIndia, burnLatLon);
    setOptions(res.options);
  }, [selAlertId, events, fleet, fleetSatrecs, scenario, setOptions]);

  const handleStartBurn = () => {
    setBurnAnim(0.0);
    const start = performance.now();
    const duration = 2200;

    const anim = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1.0, elapsed / duration);
      setBurnAnim(progress);
      if (progress < 1.0) {
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-black text-chalk selection:bg-sky/20 selection:text-sky">
      {/* Mobile viewport warning */}
      <div className="lg:hidden fixed inset-0 z-50 bg-black p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-3 h-3 rounded-full bg-saffron" />
        <h2 className="font-condensed font-bold text-xl text-chalk">
          Desktop display required
        </h2>
        <p className="text-xs text-chalk-dim max-w-sm leading-relaxed">
          The Zebro orbital command center is engineered for flight dynamics consoles of 1024 px width and above.
        </p>
        <a
          href="/analytics"
          className="px-4 py-2 bg-sky text-navy-950 rounded-control font-semibold text-xs"
        >
          Read the fleet report
        </a>
      </div>

      {/* Top Bar */}
      <TopBar />

      {/* Main Pro Console Split Workspace */}
      <div className="relative flex-1 w-full flex overflow-hidden">
        {/* Left / Center Viewport */}
        <div className="relative flex-1 h-full flex flex-col min-w-0 bg-black">
          {/* 3D Inertial Globe & Conjunction Space Canvas */}
          <div className="relative flex-1 w-full h-full overflow-hidden">
            {view === 'globe' ? (
              <Globe />
            ) : (
              <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-full">
                  <Globe />
                </div>
                <div className="p-3 bg-[#070B12] border-t lg:border-t-0 lg:border-l border-white/10 overflow-hidden">
                  <GroundTrack className="h-full" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Docked Conjunction Screening Queue */}
          <ConjunctionQueue
            isExpanded={queueExpanded}
            onToggleExpand={() => setQueueExpanded(!queueExpanded)}
          />

          {/* Bottom SGP4 Timeline Strip */}
          <div className="relative z-20 border-t border-white/10 bg-black/90 backdrop-blur-xl shrink-0">
            <Timeline />
          </div>
        </div>

        {/* Right Docked Inspector Pane (Fixed width, collapsible) */}
        {rightRailOpen ? (
          <aside className="relative w-96 xl:w-[410px] h-full flex flex-col shrink-0 border-l border-white/10 bg-[#080B11]/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-20 transition-all duration-300">
            {/* Inspector Header: Title & Close Button */}
            <div className="px-3.5 py-2.5 border-b border-white/10 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-saffron ring-2 ring-saffron/20" />
                <span className="font-condensed font-bold uppercase tracking-wider text-xs text-chalk">
                  Flight Dynamics Inspector
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRightRailOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full text-chalk-dim hover:text-chalk hover:bg-white/10 text-xs font-mono transition-colors"
                title="Collapse inspector panel"
                aria-label="Collapse inspector panel"
              >
                x
              </button>
            </div>

            {/* Quick Fleet Spacecraft Chips */}
            <div className="px-3.5 py-2.5 border-b border-white/10 bg-black/30">
              <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-chalk-faint block mb-2">
                Operational Target Fleet
              </span>
              <div className="flex flex-wrap gap-1.5">
                {fleet.map((s) => {
                  const isSelected = s.id === (selSatId ?? fleet[0]?.id);
                  const satEvents = events.filter((e) => e.primary.norad === s.noradId);
                  const hasAlert = satEvents.some((e) => e.class === 'alert');
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelSatId(s.id);
                        const matchEvent = events.find((e) => e.primary.norad === s.noradId);
                        if (matchEvent) setSelAlertId(matchEvent.id);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-sky text-navy-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                          : 'bg-white/5 text-chalk-dim hover:text-chalk hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasAlert ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                      <span>{s.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Threat Card */}
            <Threat />

            {/* Segmented Inspector Navigation Tabs */}
            <div className="px-3.5 py-2 border-b border-white/10 bg-black/40">
              <div className="flex bg-white/5 border border-white/10 rounded-full p-0.5 text-[11px] font-medium shadow-inner">
                <button
                  type="button"
                  onClick={() => setInspectorTab('plan')}
                  className={`flex-1 py-1 rounded-full transition-all text-center ${
                    inspectorTab === 'plan'
                      ? 'bg-sky text-navy-950 font-bold shadow-sm'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  Action Plan
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('bplane')}
                  className={`flex-1 py-1 rounded-full transition-all text-center ${
                    inspectorTab === 'bplane'
                      ? 'bg-sky text-navy-950 font-bold shadow-sm'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  B-Plane
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('dfsm')}
                  className={`flex-1 py-1 rounded-full transition-all text-center ${
                    inspectorTab === 'dfsm'
                      ? 'bg-sky text-navy-950 font-bold shadow-sm'
                      : 'text-chalk-dim hover:text-chalk'
                  }`}
                >
                  DFSM 2030
                </button>
              </div>
            </div>

            {/* Inspector Content Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/10">
              {inspectorTab === 'plan' && <Planner onExecuteStart={handleStartBurn} />}
              {inspectorTab === 'bplane' && (
                <EncounterPlot burnAnimationProgress={burnAnim} />
              )}
              {inspectorTab === 'dfsm' && <DfsmBadge />}
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setRightRailOpen(true)}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full border border-white/10 bg-[#080B11]/90 backdrop-blur-xl text-chalk text-xs font-medium hover:border-sky/50 shadow-2xl transition-all"
            title="Expand flight dynamics inspector"
          >
            Show Inspector
          </button>
        )}
      </div>

      {/* Copilot Drawer & Shortcuts sheet */}
      <Copilot />
      <Shortcuts />
    </div>
  );
};
