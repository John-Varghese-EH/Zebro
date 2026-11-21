import { ConjunctionEvent, SatelliteAsset, AvoidancePlan } from '../services/orbitalApi';

// Standard gravitational acceleration at sea level (m/s^2)
export const G0 = 9.80665;

// Earth gravitational parameter mu = GM (km^3 / s^2)
export const MU_KM3_S2 = 398600.4418;
export const RE_KM = 6378.137;

/**
 * Computes mean orbital motion n (rad/s) for a given orbital altitude in km
 */
export function computeMeanMotion(altitudeKm: number): number {
  const rKm = RE_KM + altitudeKm;
  return Math.sqrt(MU_KM3_S2 / Math.pow(rKm, 3));
}

/**
 * Computes fuel mass consumed via the ideal Tsiolkovsky rocket equation:
 * Delta_m = m_0 * (1 - exp(-Delta_v / (Isp * g0)))
 */
export function computeTsiolkovskyFuel(
  initialMassKg: number,
  deltaVMs: number,
  ispSec = 220
): number {
  if (deltaVMs <= 0 || initialMassKg <= 0 || ispSec <= 0) return 0;
  const exponent = -deltaVMs / (ispSec * G0);
  const fuelUsed = initialMassKg * (1 - Math.exp(exponent));
  return Math.round(fuelUsed * 1000) / 1000;
}

/**
 * Computes along-track Clohessy-Wiltshire impulsive Delta-V required to produce
 * a specified target displacement at TCA given lead time in orbits.
 *
 * For along-track impulse:
 * delta_x(tau) = (Delta_v / n) * (4 * sin(n*tau) - 3 * n * tau)
 * Therefore:
 * Delta_v = targetSeparationM / |(4 * sin(n*tau) - 3 * n * tau) / n|
 */
export function computeAlongTrackDeltaV(
  altitudeKm: number,
  leadTimeOrbits: number,
  targetSeparationM = 5000
): number {
  const n = computeMeanMotion(altitudeKm);
  const periodS = (2 * Math.PI) / n;
  const tauSec = Math.max(60, leadTimeOrbits * periodS);

  const secularFactor = Math.abs((4 * Math.sin(n * tauSec) - 3 * n * tauSec) / n);
  if (secularFactor <= 0) return 10.0;

  const dvMs = targetSeparationM / secularFactor;
  // Apply practical engineering floor of 0.05 m/s for RCS minimum impulse bit
  return Math.max(0.05, Math.round(dvMs * 1000) / 1000);
}

/**
 * Computes reactive late avoidance impulse when action is delayed to late threshold
 * (typically 0.25 orbits / 20 minutes before TCA)
 */
export function computeLateReactiveDeltaV(altitudeKm: number, targetSeparationM = 5000): number {
  // 0.25 orbits is the standard emergency threshold before TCA
  return computeAlongTrackDeltaV(altitudeKm, 0.25, targetSeparationM);
}

/**
 * Generates an AvoidancePlan comparing early predictive vs late reactive burn
 */
export function generateAvoidancePlan(
  event: ConjunctionEvent,
  asset: SatelliteAsset,
  leadTimeOrbits = 2.0,
  targetClearanceM = 5000
): AvoidancePlan {
  const earlyDeltaVMs = computeAlongTrackDeltaV(asset.altitudeKm, leadTimeOrbits, targetClearanceM);
  const reactiveDeltaVMs = computeLateReactiveDeltaV(asset.altitudeKm, targetClearanceM);

  const fuelCostKg = computeTsiolkovskyFuel(asset.wetMassKg, earlyDeltaVMs, asset.ispSec);
  const reactiveFuelCostKg = computeTsiolkovskyFuel(asset.wetMassKg, reactiveDeltaVMs, asset.ispSec);

  const fuelSavedKg = Math.max(0, Math.round((reactiveFuelCostKg - fuelCostKg) * 1000) / 1000);
  const fuelSavedPercent = reactiveFuelCostKg > 0
    ? Math.max(0, Math.min(95, Math.round(((reactiveFuelCostKg - fuelCostKg) / reactiveFuelCostKg) * 100)))
    : 0;

  const n = computeMeanMotion(asset.altitudeKm);
  const periodS = (2 * Math.PI) / n;
  const burnWindowDate = new Date(new Date(event.tcaUtc).getTime() - leadTimeOrbits * periodS * 1000);

  return {
    eventId: event.id,
    burnWindowStartUtc: burnWindowDate.toISOString(),
    leadTimeOrbits,
    deltaVTotalMs: earlyDeltaVMs,
    fuelCostKg,
    reactiveBurnDeltaVMs: reactiveDeltaVMs,
    reactiveFuelCostKg,
    fuelSavedKg,
    fuelSavedPercent,
    postManeuverMissDistanceM: Math.max(targetClearanceM, event.missDistanceM + targetClearanceM),
    direction: 'prograde',
    orbitAdjustmentSummary: `Prograde along-track burn of ${earlyDeltaVMs.toFixed(2)} m/s shifts semi-major axis by +${(earlyDeltaVMs * 2).toFixed(1)} m, expanding clearance to ${(targetClearanceM / 1000).toFixed(1)} km at TCA.`,
  };
}
