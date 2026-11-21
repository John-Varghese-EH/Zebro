export const MU = 398600.4418;      // km^3/s^2
export const RE = 6378.137;         // km, equatorial
export const G0 = 9.80665;          // m/s^2
export const OMEGA_E = 7.2921159e-5; // rad/s
export const EARTH_LON_OFFSET = 0;   // rad, calibrated with test

export type Vec3 = [number, number, number];
export interface State { r: Vec3; v: Vec3 }            // km, km/s, TEME
export interface DvRTN { R: number; T: number; N: number } // m/s
export type Direction = 'prograde' | 'retrograde' | 'radial_out' | 'radial_in';
export type Tag = 'DATA' | 'COMPUTED' | 'ASSUMED' | 'SCENARIO';

export interface Option {
  key: 'early' | 'late' | 'radial';
  direction: Direction;
  leadOrbits: number;
  leadS: number;
  dvMs: number;            // burn
  totalDvMs: number;       // burn + recovery
  missKm: number;          // after burn, at TCA
  pcAfter: number;
  propellantKg: number;
  lifeCostDays: number;
  driftKmPerDay: number;   // along-track burns only
  burnLat: number;
  burnLon: number;
  burnOverIndia: boolean;
}

export interface PrimaryMission {
  id: string;
  name: string;
  noradId: number;
  role: string;
  swathKm: number;
  wetMassKg: number;
  propellantKg: number;
  radiusM: number;
  verified: boolean;
  isIndian?: boolean;
  // Runtime derived DATA:
  altitudeKm?: number;
  inclinationDeg?: number;
  periodMin?: number;
  epoch?: string;
  epochAgeDays?: number;
}

export interface ConjunctionEvent {
  id: string;
  primary: { name: string; norad: number };
  secondary: { name: string; norad: number; kind: string };
  tca_utc: string;
  miss_km: number;
  rel_speed_kms: number;
  class: 'alert' | 'watch';
  pc: number;
  sigma_m: number;
  radii_m: { primary: number; secondary: number };
  element_age_days: { primary: number; secondary: number };
  tag?: Tag;
  r_pri_tca?: Vec3;
  v_pri_tca?: Vec3;
  r_sec_tca?: Vec3;
  v_sec_tca?: Vec3;
}

export interface Manifest {
  fetched_utc: string;
  source: string;
  fleet_epoch_oldest: string;
  fleet_epoch_newest: string;
  counts: { fleet: number; background: number; screened: number };
}

export interface ExecutedBurn {
  id: string;
  alertId: string;
  satelliteId: string;
  satelliteName: string;
  optionKey: Option['key'];
  direction: Direction;
  leadOrbits: number;
  dvMs: number;
  baselineDvMs: number;
  propellantSavedKg: number;
  executedSimMs: number;
  burnLat: number;
  burnLon: number;
  burnOverIndia: boolean;
  newMissKm: number;
  newPc: number;
}
