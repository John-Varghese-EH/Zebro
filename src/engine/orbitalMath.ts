import { MU, RE, G0, OMEGA_E, DvRTN, Vec3, Direction } from './constants';
import { cross, unit } from './vec';
import { A } from '../config/assumptions';

/** Radial, Transverse (along-track), Normal axes of the satellite frame. */
export function rtn(r: Vec3, v: Vec3) {
  const R = unit(r);
  const N = unit(cross(r, v));
  const T = cross(N, R);
  return { R, T, N };
}

/** Clohessy-Wiltshire displacement (metres) tau seconds after an impulse (m/s). n in rad/s. */
export function cwDisp(n: number, dv: DvRTN, tau: number) {
  const s = Math.sin(n * tau), c = Math.cos(n * tau);
  return {
    R: (dv.R / n) * s + (2 * dv.T / n) * (1 - c),
    T: -(2 * dv.R / n) * (1 - c) + (dv.T / n) * (4 * s - 3 * n * tau),
    N: (dv.N / n) * s,
  };
}

export const meanMotion = (altKm: number) => Math.sqrt(MU / Math.pow(RE + altKm, 3)); // rad/s

export function dvVector(dir: Direction, dv: number): DvRTN {
  switch (dir) {
    case 'prograde': return { R: 0, T: dv, N: 0 };
    case 'retrograde': return { R: 0, T: -dv, N: 0 };
    case 'radial_out': return { R: dv, T: 0, N: 0 };
    case 'radial_in': return { R: -dv, T: 0, N: 0 };
  }
}

/** Screening collision probability. Distances in metres. Valid when radius << sigma. */
export const screeningPc = (missM: number, radiusM: number, sigmaM: number): number => {
  if (sigmaM <= 0) return 0;
  return (radiusM * radiusM) / (2 * sigmaM * sigmaM) * Math.exp(-(missM * missM) / (2 * sigmaM * sigmaM));
};

export const sigmaFromAge = (ageDays: number) =>
  A.sigmaBaseM + A.sigmaPerDayM * Math.max(0, ageDays);

export function riskScore(pc: number) {
  const x = (Math.log10(Math.max(pc, 1e-12)) + 7) / 4; // -7 -> 0, -3 -> 100
  return Math.round(100 * Math.min(1, Math.max(0, x)));
}

export const riskBand = (pc: number) =>
  pc >= A.pcRedAt ? 'red' : pc >= A.pcAmberAt ? 'amber' : 'green';

/** Tsiolkovsky rocket equation helpers. */
export const propUsedKg = (m0: number, dvMs: number, isp: number = A.ispS) =>
  m0 * (1 - Math.exp(-dvMs / (G0 * isp)));

export const dvBudgetMs = (m0: number, propKg: number, isp: number = A.ispS) => {
  if (m0 <= propKg || propKg <= 0) return 0;
  return G0 * isp * Math.log(m0 / (m0 - propKg));
};

export const lifeCostDays = (dvMs: number, annualSkDvMs: number = A.annualSkDvMs) =>
  dvMs / (annualSkDvMs / 365);

/** Single retrograde burn at apogee of a near-circular orbit down to a target perigee. */
export function deorbitDvMs(altKm: number, perigeeKm: number = A.deorbitPerigeeKm) {
  const r1 = RE + altKm, rp = RE + perigeeKm;
  const vc = Math.sqrt(MU / r1);
  const va = Math.sqrt(2 * MU * rp / (r1 * (r1 + rp)));
  return (vc - va) * 1000;
}

export function badge(dvAvail: number, dvNeeded: number, lowAltDecay: boolean) {
  if (lowAltDecay || dvAvail >= A.badgeGreenMargin * dvNeeded) return 'green' as const;
  return dvAvail >= dvNeeded ? ('amber' as const) : ('red' as const);
}

/** Along-track burn: ground-track drift against the repeat track, km/day at the equator. */
export function driftKmPerDay(dvAlongTrackMs: number, altKm: number) {
  const a = RE + altKm;
  const v = Math.sqrt(MU / a);
  const n = v / a;
  const T = 2 * Math.PI / n;
  const da = 2 * a * (Math.abs(dvAlongTrackMs) / 1000) / v; // km
  const dT = 1.5 * T * da / a; // s per orbit
  return OMEGA_E * RE * dT * (86400 / T);
}
