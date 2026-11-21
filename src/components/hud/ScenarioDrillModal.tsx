import React, { useState } from 'react';
import * as satellite from 'satellite.js';
import { useMission } from '../../store/useMission';
import { createScenario } from '../../engine/scenario';
import { State, MU, RE } from '../../engine/constants';
import { playClickTone, playTacticalBeep } from '../../utils/audio';

interface ScenarioDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PresetDrill {
  id: string;
  title: string;
  secondaryName: string;
  secondaryNorad: number;
  kind: 'debris' | 'payload' | 'rocket body';
  missM: number;
  crossAngleDeg: number;
  sigmaM: number;
  leadOrbits: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'WATCH';
  description: string;
}

const PRESET_DRILLS: PresetDrill[] = [
  {
    id: 'cosmos-2251',
    title: 'Cosmos 2251 Hypervelocity Debris',
    secondaryName: 'COSMOS 2251 DEB (SYNTH)',
    secondaryNorad: 34456,
    kind: 'debris',
    missM: 95,
    crossAngleDeg: 57,
    sigmaM: 180,
    leadOrbits: 2.0,
    riskLevel: 'CRITICAL',
    description: 'High-inclination fragmentation crossing orbit at 13.1 km/s relative speed with miss under 100 m.',
  },
  {
    id: 'fengyun-1c',
    title: 'Fengyun-1C Polar ASAT Fragment',
    secondaryName: 'FENGYUN 1C DEB (SYNTH)',
    secondaryNorad: 29728,
    kind: 'debris',
    missM: 140,
    crossAngleDeg: 92,
    sigmaM: 210,
    leadOrbits: 1.5,
    riskLevel: 'CRITICAL',
    description: 'Polar orbit crossing near sun-synchronous apogee with orthogonal encounter geometry.',
  },
  {
    id: 'sl16-rb',
    title: 'SL-16 Spent Rocket Body Carcass',
    secondaryName: 'SL-16 R/B (DERELICT)',
    secondaryNorad: 22220,
    kind: 'rocket body',
    missM: 65,
    crossAngleDeg: 64,
    sigmaM: 150,
    leadOrbits: 2.5,
    riskLevel: 'CRITICAL',
    description: 'Large 9-ton upper stage carcass presenting elevated hard-body collision cross section.',
  },
  {
    id: 'iridium-33',
    title: 'Iridium 33 Retrograde Fragment',
    secondaryName: 'IRIDIUM 33 DEB (SYNTH)',
    secondaryNorad: 33777,
    kind: 'debris',
    missM: 210,
    crossAngleDeg: 38,
    sigmaM: 260,
    leadOrbits: 3.0,
    riskLevel: 'WATCH',
    description: 'Low-angle crossing with prolonged proximity corridor and moderate collision probability.',
  },
];

export const ScenarioDrillModal: React.FC<ScenarioDrillModalProps> = ({ isOpen, onClose }) => {
  const { fleet, fleetSatrecs, simMs, setScenario, setSelSatId } = useMission();
  const [selectedSatNorad, setSelectedSatNorad] = useState<number>(fleet[0]?.noradId ?? 65053);
  const [customMiss, setCustomMiss] = useState<number>(120);
  const [customLeadOrbits, setCustomLeadOrbits] = useState<number>(2.0);

  if (!isOpen) return null;

  const targetSat = fleet.find((s) => s.noradId === selectedSatNorad) ?? fleet[0];

  const handleLaunchDrill = (preset: PresetDrill) => {
    playClickTone();
    playTacticalBeep();

    const satrec = targetSat ? fleetSatrecs[targetSat.noradId] : null;
    const orbitalPeriodMin = targetSat?.periodMin ?? 98.0;
    const tcaDate = new Date(simMs + preset.leadOrbits * orbitalPeriodMin * 60 * 1000);
    let pState: State;

    if (satrec) {
      const pv = satellite.propagate(satrec, tcaDate);
      if (pv && typeof pv.position !== 'boolean' && pv.position && pv.velocity) {
        pState = {
          r: [pv.position.x, pv.position.y, pv.position.z],
          v: [pv.velocity.x, pv.velocity.y, pv.velocity.z],
        };
      } else {
        const rMag = RE + (targetSat?.altitudeKm || 747);
        const vMag = Math.sqrt(MU / rMag);
        pState = { r: [rMag, 0, 0], v: [0, vMag, 0] };
      }
    } else {
      const rMag = RE + (targetSat?.altitudeKm || 747);
      const vMag = Math.sqrt(MU / rMag);
      pState = { r: [rMag, 0, 0], v: [0, vMag, 0] };
    }

    const scen = createScenario({
      primaryNorad: targetSat?.noradId ?? 65053,
      primaryName: targetSat?.name ?? 'NISAR',
      primaryStateTca: pState,
      tcaDate,
      secondaryName: preset.secondaryName,
      secondaryNorad: preset.secondaryNorad,
      missM: preset.missM,
      crossAngleDeg: preset.crossAngleDeg,
      sigmaM: preset.sigmaM,
    });

    if (targetSat) {
      setSelSatId(targetSat.id);
    }
    setScenario(scen);
    onClose();
  };

  const handleLaunchCustom = () => {
    playClickTone();
    playTacticalBeep();

    const satrec = targetSat ? fleetSatrecs[targetSat.noradId] : null;
    const orbitalPeriodMin = targetSat?.periodMin ?? 98.0;
    const tcaDate = new Date(simMs + customLeadOrbits * orbitalPeriodMin * 60 * 1000);
    let pState: State;

    if (satrec) {
      const pv = satellite.propagate(satrec, tcaDate);
      if (pv && typeof pv.position !== 'boolean' && pv.position && pv.velocity) {
        pState = {
          r: [pv.position.x, pv.position.y, pv.position.z],
          v: [pv.velocity.x, pv.velocity.y, pv.velocity.z],
        };
      } else {
        const rMag = RE + (targetSat?.altitudeKm || 747);
        const vMag = Math.sqrt(MU / rMag);
        pState = { r: [rMag, 0, 0], v: [0, vMag, 0] };
      }
    } else {
      const rMag = RE + (targetSat?.altitudeKm || 747);
      const vMag = Math.sqrt(MU / rMag);
      pState = { r: [rMag, 0, 0], v: [0, vMag, 0] };
    }

    const scen = createScenario({
      primaryNorad: targetSat?.noradId ?? 65053,
      primaryName: targetSat?.name ?? 'NISAR',
      primaryStateTca: pState,
      tcaDate,
      secondaryName: 'SYNTH DEBRIS OBJECT',
      secondaryNorad: 99998,
      missM: customMiss,
      crossAngleDeg: 55,
      sigmaM: 200,
    });

    if (targetSat) {
      setSelSatId(targetSat.id);
    }
    setScenario(scen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#090D14] border border-white/15 rounded-2xl shadow-2xl p-6 text-chalk space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="font-condensed font-bold uppercase tracking-wider text-base text-chalk">
                Conjunction Assessment Drill Injector
              </h2>
            </div>
            <p className="text-xs text-chalk-dim mt-0.5">
              Simulate high-risk close approaches to validate collision avoidance maneuver planning and propellant budgets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-chalk-dim hover:text-chalk transition-colors font-mono text-xs"
          >
            x
          </button>
        </div>

        {/* Target Spacecraft Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-chalk-dim uppercase tracking-wider block">
            Target Fleet Spacecraft
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {fleet.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSatNorad(s.noradId)}
                className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all ${
                  selectedSatNorad === s.noradId
                    ? 'bg-sky/20 border-sky/60 text-sky font-semibold'
                    : 'bg-white/5 border-white/10 text-chalk-dim hover:text-chalk hover:bg-white/10'
                }`}
              >
                <div className="font-bold truncate">{s.name}</div>
                <div className="text-[10px] text-chalk-faint font-mono">#{s.noradId}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Presets List */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-chalk-dim uppercase tracking-wider block">
            Calibrated Scenario Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_DRILLS.map((preset) => (
              <div
                key={preset.id}
                className="p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-chalk">{preset.title}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        preset.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {preset.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-chalk-faint mt-1 leading-snug">
                    {preset.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-chalk-dim">
                    <span>Miss: {preset.missM} m</span>
                    <span>Lead: {preset.leadOrbits} orb</span>
                    <span>Angle: {preset.crossAngleDeg}°</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchDrill(preset)}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky/15 hover:bg-sky/25 border border-sky/30 text-sky font-semibold text-xs transition-colors"
                >
                  Load Scenario Drill
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Scenario Builder */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-chalk">Custom Conjunction Geometry</span>
            <span className="text-[10px] font-mono text-chalk-faint">Freeform Operator Drill</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-chalk-dim">Miss Distance</span>
                <span className="text-sky font-mono font-semibold">{customMiss} meters</span>
              </div>
              <input
                type="range"
                min={30}
                max={500}
                step={10}
                value={customMiss}
                onChange={(e) => setCustomMiss(Number(e.target.value))}
                className="w-full accent-sky bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-chalk-dim">Lead Time to TCA</span>
                <span className="text-sky font-mono font-semibold">{customLeadOrbits.toFixed(1)} orbits</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={4.0}
                step={0.5}
                value={customLeadOrbits}
                onChange={(e) => setCustomLeadOrbits(Number(e.target.value))}
                className="w-full accent-sky bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchCustom}
            className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-chalk font-semibold text-xs transition-colors"
          >
            Inject Custom Geometry Drill
          </button>
        </div>
      </div>
    </div>
  );
};
