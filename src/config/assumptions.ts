// Every constant here is shown in the UI with the ASSUMED tag.
export const A = {
  sigmaBaseM: 1000,          // position 1-sigma at element epoch
  sigmaPerDayM: 500,         // growth per day of element age
  radiusPayloadM: 2.0,
  radiusDebrisM: 0.5,
  radiusRocketBodyM: 3.0,
  targetMissKm: 5,
  alertKm: 5,
  watchKm: 25,
  pcRedAt: 1e-4,             // commonly used manoeuvre-consideration level
  pcAmberAt: 1e-5,
  ispS: 220,
  annualSkDvMs: 8,
  deorbitPerigeeKm: 60,
  naturalDecayAltKm: 500,    // heuristic flag only
  recoveryBurnFactor: 1.0,   // recovery burn = factor x burn
  badgeGreenMargin: 1.5,
  ghostExaggeration: 150,    // visual only, always labelled
  kesslerFragments: 1500,
  kesslerDrawn: 400,
  kesslerKickMinMs: 20,
  kesslerKickMaxMs: 300,
  kesslerBandKm: 20,
} as const;
