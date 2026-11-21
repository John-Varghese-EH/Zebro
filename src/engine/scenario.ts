import { MU, Vec3, State, ConjunctionEvent } from './constants';
import { norm, scale, add, sub } from './vec';
import { rtn, screeningPc } from './orbitalMath';

export interface ScenarioConfig {
  primaryName: string;
  primaryNorad: number;
  primaryStateTca: State;
  tcaDate: Date;
  secondaryName?: string;
  secondaryNorad?: number;
  missM?: number;       // default 150 m
  crossAngleDeg?: number; // default 57 deg
  sigmaM?: number;      // default 200 m
  radiusPrimaryM?: number;
  radiusSecondaryM?: number;
}

export interface ScenarioResult {
  event: ConjunctionEvent;
  pAt: (dt: number) => State;
  sAt: (dt: number) => State;
  secondaryOrbitPoints: Vec3[]; // TEME km for orbit path visualization
}

/** 2-body gravitational acceleration km/s^2 */
function accel(r: Vec3): Vec3 {
  const rMag = norm(r);
  const factor = -MU / (rMag * rMag * rMag);
  return scale(r, factor);
}

/** Single RK4 step for 2-body orbit propagation */
function rk4Step(s: State, dt: number): State {
  const k1_v = accel(s.r);
  const k1_r = s.v;

  const r2 = add(s.r, scale(k1_r, 0.5 * dt));
  const v2 = add(s.v, scale(k1_v, 0.5 * dt));
  const k2_v = accel(r2);
  const k2_r = v2;

  const r3 = add(s.r, scale(k2_r, 0.5 * dt));
  const v3 = add(s.v, scale(k2_v, 0.5 * dt));
  const k3_v = accel(r3);
  const k3_r = v3;

  const r4 = add(s.r, scale(k3_r, dt));
  const v4 = add(s.v, scale(k3_v, dt));
  const k4_v = accel(r4);
  const k4_r = v4;

  const dr = scale(
    add(add(k1_r, scale(k2_r, 2)), add(scale(k3_r, 2), k4_r)),
    dt / 6
  );
  const dv = scale(
    add(add(k1_v, scale(k2_v, 2)), add(scale(k3_v, 2), k4_v)),
    dt / 6
  );

  return { r: add(s.r, dr), v: add(s.v, dv) };
}

/** Propagate state by dt seconds using 1s substeps */
export function propagateRK4(state0: State, dt: number): State {
  if (dt === 0) return { r: [...state0.r], v: [...state0.v] };
  const sign = dt > 0 ? 1 : -1;
  const totalSeconds = Math.abs(dt);
  let cur: State = { r: [...state0.r], v: [...state0.v] };
  const stepSize = 1.0;
  let remaining = totalSeconds;

  while (remaining > 0) {
    const h = Math.min(stepSize, remaining) * sign;
    cur = rk4Step(cur, h);
    remaining -= stepSize;
  }
  return cur;
}

export function createScenario(cfg: ScenarioConfig): ScenarioResult {
  const missM = cfg.missM ?? 150;
  const crossAngleDeg = cfg.crossAngleDeg ?? 57;
  const sigmaM = cfg.sigmaM ?? 200;
  const rPriM = cfg.radiusPrimaryM ?? 2.0;
  const rSecM = cfg.radiusSecondaryM ?? 0.5;
  const R_total = rPriM + rSecM;

  const { R, T, N } = rtn(cfg.primaryStateTca.r, cfg.primaryStateTca.v);
  const phi = (crossAngleDeg * Math.PI) / 180;

  // Secondary position at TCA: offset radially by miss distance
  const rS: Vec3 = add(cfg.primaryStateTca.r, scale(R, missM / 1000));
  const vc = Math.sqrt(MU / norm(rS));

  // Secondary velocity in T-N plane: perpendicular to radial offset
  // vS = vc * (-cos(phi) * T + sin(phi) * N)
  const vS: Vec3 = add(scale(T, -Math.cos(phi) * vc), scale(N, Math.sin(phi) * vc));
  const s0: State = { r: rS, v: vS };

  const relV = sub(vS, cfg.primaryStateTca.v);
  const relSpeedKms = norm(relV);
  const pc = screeningPc(missM, R_total, sigmaM);

  const sAt = (dt: number) => propagateRK4(s0, dt);

  // Approximate primary near TCA using linear/2-body or passed callback
  const pAt = (dt: number) => propagateRK4(cfg.primaryStateTca, dt);

  // Pre-generate full period orbit line for visualizer
  const periodS = (2 * Math.PI) / Math.sqrt(MU / Math.pow(norm(rS), 3));
  const numOrbitPts = 100;
  const secondaryOrbitPoints: Vec3[] = [];
  for (let i = 0; i < numOrbitPts; i++) {
    const dt = (i / numOrbitPts) * periodS;
    secondaryOrbitPoints.push(propagateRK4(s0, dt).r);
  }

  const tcaIso = cfg.tcaDate.toISOString();
  const secNorad = cfg.secondaryNorad ?? 99999;
  const secName = cfg.secondaryName ?? 'COSMOS 2251 DEB (SYNTH)';
  const event: ConjunctionEvent = {
    id: `SCENARIO-${cfg.primaryNorad}-${secNorad}-${tcaIso.replace(/[-:]/g, '').slice(0, 15)}`,
    primary: { name: cfg.primaryName, norad: cfg.primaryNorad },
    secondary: { name: secName, norad: secNorad, kind: 'debris' },
    tca_utc: tcaIso,
    miss_km: missM / 1000,
    rel_speed_kms: Math.round(relSpeedKms * 1000) / 1000,
    class: 'alert',
    pc,
    sigma_m: sigmaM,
    radii_m: { primary: rPriM, secondary: rSecM },
    element_age_days: { primary: 0.1, secondary: 0.1 },
    tag: 'SCENARIO',
    r_pri_tca: cfg.primaryStateTca.r,
    v_pri_tca: cfg.primaryStateTca.v,
    r_sec_tca: rS,
    v_sec_tca: vS,
  };

  return { event, pAt, sAt, secondaryOrbitPoints };
}
