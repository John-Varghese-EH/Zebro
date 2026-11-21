import { State, DvRTN, Direction, Option } from './constants';
import { cwDisp, dvVector, rtn, screeningPc, propUsedKg, lifeCostDays, driftKmPerDay } from './orbitalMath';
import { A } from '../config/assumptions';

export interface EncounterGrid {
  t: number[];
  p: State[];
  s: State[];
} // t in s relative to nominal TCA

export function buildGrid(
  pAt: (dt: number) => State | null,
  sAt: (dt: number) => State | null,
  halfS = 20,
  stepS = 1
): EncounterGrid {
  const g: EncounterGrid = { t: [], p: [], s: [] };
  for (let k = -halfS; k <= halfS; k += stepS) {
    const a = pAt(k), b = sAt(k);
    if (a && b) {
      g.t.push(k);
      g.p.push(a);
      g.s.push(b);
    }
  }
  return g;
}

/** Miss distance (km) after a burn leadS seconds before nominal TCA. */
export function missAfterBurn(g: EncounterGrid, dv: DvRTN, leadS: number, n: number) {
  let best = Infinity;
  let bestI = 0;
  for (let i = 0; i < g.t.length; i++) {
    const d = cwDisp(n, dv, leadS + g.t[i]);
    const { R, T, N } = rtn(g.p[i].r, g.p[i].v);
    let sum = 0;
    for (let k = 0; k < 3; k++) {
      const x = g.p[i].r[k] + (R[k] * d.R + T[k] * d.T + N[k] * d.N) / 1000 - g.s[i].r[k];
      sum += x * x;
    }
    const dist = Math.sqrt(sum);
    if (dist < best) {
      best = dist;
      bestI = i;
    }
  }
  return { missKm: best, atOffsetS: g.t[bestI] };
}

export interface Ctx {
  grid: EncounterGrid;
  n: number;
  periodS: number;
  secondsToTca: number;
  altKm: number;
  m0: number;
  sigmaM: number;
  radiusM: number;
}

export function planOne(
  ctx: Ctx,
  dir: Direction,
  leadOrbits: number,
  targetKm = A.targetMissKm,
  maxDv = 5,
  step = 0.005
) {
  const leadS = leadOrbits * ctx.periodS;
  if (leadS > ctx.secondsToTca) return null;
  const iMax = Math.round(maxDv / step);
  for (let i = 1; i <= iMax; i++) {
    const dv = i * step;
    const { missKm } = missAfterBurn(ctx.grid, dvVector(dir, dv), leadS, ctx.n);
    if (missKm >= targetKm) return { dir, leadOrbits, leadS, dv, missKm };
  }
  return null;
}

/**
 * Returns up to three options and the baseline used for "% saved".
 * early: lowest total delta-v over leads 3, 2, 1, 0.5 and along-track directions.
 * late: best of prograde/retrograde at 0.25 orbit (the baseline, printed on screen).
 * radial: best radial option over all leads.
 * Do not offer leads under 0.25 orbit: the along-track term crosses zero near 0.2 orbit.
 */
export function planAll(
  ctx: Ctx,
  isOverIndia: (lat: number, lon: number) => boolean,
  burnLatLon: (leadS: number) => { lat: number; lon: number }
): { options: Option[]; baselineDv: number | null } {
  const leads = [3, 2, 1, 0.5];
  const along: Direction[] = ['prograde', 'retrograde'];
  const radial: Direction[] = ['radial_out', 'radial_in'];

  const pick = (dirs: Direction[], ls: number[]) => {
    let best: ReturnType<typeof planOne> = null;
    for (const d of dirs) {
      for (const l of ls) {
        const o = planOne(ctx, d, l);
        if (o && (!best || o.dv < best.dv)) best = o;
      }
    }
    return best;
  };

  const raw = {
    early: pick(along, leads),
    late: pick(along, [0.25]),
    radial: pick(radial, [...leads, 0.25]),
  };

  const mk = (key: Option['key'], o: NonNullable<ReturnType<typeof planOne>>): Option => {
    const ll = burnLatLon(o.leadS);
    const total = o.dv * (1 + A.recoveryBurnFactor);
    return {
      key,
      direction: o.dir,
      leadOrbits: o.leadOrbits,
      leadS: o.leadS,
      dvMs: o.dv,
      totalDvMs: total,
      missKm: o.missKm,
      pcAfter: screeningPc(o.missKm * 1000, ctx.radiusM, ctx.sigmaM),
      propellantKg: propUsedKg(ctx.m0, total),
      lifeCostDays: lifeCostDays(total),
      driftKmPerDay: o.dir.startsWith('radial') ? 0 : driftKmPerDay(o.dv, ctx.altKm),
      burnLat: ll.lat,
      burnLon: ll.lon,
      burnOverIndia: isOverIndia(ll.lat, ll.lon),
    };
  };

  const options: Option[] = [];
  if (raw.early) options.push(mk('early', raw.early));
  if (raw.late) options.push(mk('late', raw.late));
  if (raw.radial) options.push(mk('radial', raw.radial));

  return { options, baselineDv: raw.late ? raw.late.dv : null };
}
