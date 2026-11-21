import { describe, it, expect } from 'vitest';
import {
  computeMeanMotion,
  computeTsiolkovskyFuel,
  computeAlongTrackDeltaV,
  computeLateReactiveDeltaV,
  generateAvoidancePlan,
} from '../predictionEngine';
import { classifyRisk, ConjunctionEvent, SatelliteAsset } from '../../services/orbitalApi';

describe('ZEBRO Early Prediction & Fuel Optimization Engine', () => {
  it('computes realistic mean motion for NISAR altitude (747 km)', () => {
    const n = computeMeanMotion(747);
    const periodMin = (2 * Math.PI) / (n * 60);
    // 747 km circular LEO orbit period should be between 99 and 100 minutes
    expect(periodMin).toBeGreaterThan(99);
    expect(periodMin).toBeLessThan(101);
  });

  it('computes fuel mass with Tsiolkovsky rocket equation correctly', () => {
    // 2800 kg satellite, 0.15 m/s delta-v, Isp = 220 s
    const fuelKg = computeTsiolkovskyFuel(2800, 0.15, 220);
    // Delta_m = 2800 * (1 - exp(-0.15 / (220 * 9.80665))) ~= 0.194 kg
    expect(fuelKg).toBeGreaterThan(0.18);
    expect(fuelKg).toBeLessThan(0.21);
  });

  it('demonstrates early burn (2.0 orbits) preserves over 75% fuel vs reactive burn (0.25 orbits)', () => {
    const altKm = 747;
    const earlyDv = computeAlongTrackDeltaV(altKm, 2.0, 5000);
    const lateDv = computeLateReactiveDeltaV(altKm, 5000);

    // Early burn should be under 0.3 m/s, whereas reactive burn is over 4.0 m/s
    expect(earlyDv).toBeLessThan(0.3);
    expect(lateDv).toBeGreaterThan(4.0);

    const earlyFuel = computeTsiolkovskyFuel(2800, earlyDv, 220);
    const lateFuel = computeTsiolkovskyFuel(2800, lateDv, 220);

    const savingsPct = ((lateFuel - earlyFuel) / lateFuel) * 100;
    expect(savingsPct).toBeGreaterThan(80);
  });

  it('generates consistent avoidance plan without mathematical contradictions', () => {
    const dummyAsset: SatelliteAsset = {
      id: 'SAT-65053',
      noradId: 65053,
      name: 'NISAR',
      operator: 'ISRO / NASA',
      isIndian: true,
      orbitType: 'SSO',
      altitudeKm: 747,
      inclinationDeg: 98.4,
      periodMin: 99.8,
      currentFuelKg: 185,
      wetMassKg: 2800,
      dryMassKg: 2615,
      ispSec: 220,
      status: 'OPERATIONAL',
      epochUtc: new Date().toISOString(),
    };

    const dummyEvent: ConjunctionEvent = {
      id: 'CONJ-65053-34456',
      assetId: 'SAT-65053',
      debrisId: 'DEB-34456',
      assetName: 'NISAR',
      debrisName: 'COSMOS 2251 DEBRIS',
      assetNorad: 65053,
      debrisNorad: 34456,
      isIndianAsset: true,
      tcaUtc: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      timeToTcaSec: 10800,
      missDistanceM: 210,
      probabilityOfCollision: 4.8e-4,
      riskTier: 'CRITICAL',
      detectionLeadTimeSec: 10800,
      relativeVelocityKms: 13.1,
    };

    const plan = generateAvoidancePlan(dummyEvent, dummyAsset, 2.0, 5000);
    expect(plan.deltaVTotalMs).toBeLessThan(plan.reactiveBurnDeltaVMs);
    expect(plan.fuelCostKg).toBeLessThan(plan.reactiveFuelCostKg);
    expect(plan.fuelSavedKg).toBeCloseTo(plan.reactiveFuelCostKg - plan.fuelCostKg, 2);
    expect(plan.fuelSavedPercent).toBeGreaterThanOrEqual(75);
    expect(plan.postManeuverMissDistanceM).toBeGreaterThanOrEqual(5000);
  });

  it('correctly classifies risk tiers', () => {
    expect(classifyRisk(450, 2e-4)).toBe('CRITICAL');
    expect(classifyRisk(2500, 5e-6)).toBe('WATCH');
    expect(classifyRisk(8500, 1e-7)).toBe('NOMINAL');
  });
});
