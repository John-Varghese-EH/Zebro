import { MU, RE, Vec3 } from './constants';
import { A } from '../config/assumptions';

const gauss = () =>
  Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random());

const randUnit = (): Vec3 => {
  const z = 2 * Math.random() - 1;
  const t = 2 * Math.PI * Math.random();
  const s = Math.sqrt(Math.max(0, 1 - z * z));
  return [s * Math.cos(t), s * Math.sin(t), z];
};

export interface Frag {
  r: Vec3;
  v: Vec3;
}

export function breakup(r: Vec3, v: Vec3, n: number = A.kesslerFragments): Frag[] {
  const lo = A.kesslerKickMinMs / 1000;
  const hi = A.kesslerKickMaxMs / 1000;
  return Array.from({ length: n }, () => {
    const u = randUnit();
    const kick = Math.min(hi, lo + Math.abs(gauss()) * 0.1); // km/s
    return {
      r: [...r] as Vec3,
      v: v.map((x, i) => x + u[i] * kick) as Vec3,
    };
  });
}

const acc = (p: Vec3): Vec3 => {
  const n = Math.hypot(...p);
  return [-MU * p[0] / Math.pow(n, 3), -MU * p[1] / Math.pow(n, 3), -MU * p[2] / Math.pow(n, 3)];
};

export function step(f: Frag, dt: number) {
  // leapfrog (kick-drift-kick)
  let a = acc(f.r);
  f.v = f.v.map((x, i) => x + 0.5 * dt * a[i]) as Vec3;
  f.r = f.r.map((x, i) => x + dt * f.v[i]) as Vec3;
  a = acc(f.r);
  f.v = f.v.map((x, i) => x + 0.5 * dt * a[i]) as Vec3;
}

export function orbitBand(f: Frag) {
  // altitude km
  const r = Math.hypot(...f.r);
  const v2 = f.v[0] ** 2 + f.v[1] ** 2 + f.v[2] ** 2;
  const invA = 2 / r - v2 / MU;
  if (invA <= 0) {
    // Parabolic or hyperbolic
    return { perigee: r - RE, apogee: 999999 };
  }
  const a = 1 / invA;
  const h: Vec3 = [
    f.r[1] * f.v[2] - f.r[2] * f.v[1],
    f.r[2] * f.v[0] - f.r[0] * f.v[2],
    f.r[0] * f.v[1] - f.r[1] * f.v[0],
  ];
  const h2 = h[0] ** 2 + h[1] ** 2 + h[2] ** 2;
  const e = Math.sqrt(Math.max(0, 1 - h2 / (MU * a)));
  return { perigee: a * (1 - e) - RE, apogee: a * (1 + e) - RE };
}

/** Tracked objects whose altitude lies inside any fragment's perigee-apogee band (+/- bandKm). */
export function threatened(
  frags: Frag[],
  tracked: { id: string; altKm: number }[],
  bandKm = A.kesslerBandKm
) {
  const bands = frags.map(orbitBand).filter(b => b.perigee > 0);
  return tracked.filter(t =>
    bands.some(b => t.altKm >= b.perigee - bandKm && t.altKm <= b.apogee + bandKm)
  );
}
