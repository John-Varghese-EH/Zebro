import { deorbitDvMs, dvBudgetMs, badge } from './orbitalMath';
import { A } from '../config/assumptions';

export interface DfsmEvaluation {
  requiredDvMs: number;
  availableDvMs: number;
  margin: number;
  verdict: 'green' | 'amber' | 'red';
  isNaturalDecayCandidate: boolean;
  notes: string;
}

export function evaluateDfsm(
  altKm: number,
  wetMassKg: number,
  propellantKg: number,
  plannedBurnDvMs: number = 0,
  isp: number = A.ispS
): DfsmEvaluation {
  const requiredDvMs = deorbitDvMs(altKm, A.deorbitPerigeeKm);

  // Available delta-v from remaining propellant
  const totalBudgetMs = dvBudgetMs(wetMassKg, propellantKg, isp);
  const availableDvMs = Math.max(0, totalBudgetMs - plannedBurnDvMs);

  const isNaturalDecayCandidate = altKm <= A.naturalDecayAltKm;
  const verdict = badge(availableDvMs, requiredDvMs, isNaturalDecayCandidate);
  const margin = requiredDvMs > 0 ? availableDvMs / requiredDvMs : 0;

  const notes = isNaturalDecayCandidate
    ? `Orbit perigee is below ${A.naturalDecayAltKm} km heuristic bound (atmospheric drag may assist 5-year compliance).`
    : availableDvMs >= requiredDvMs
    ? `Sufficient propellant for direct re-entry to ${A.deorbitPerigeeKm} km perigee.`
    : `Deficit of ${(requiredDvMs - availableDvMs).toFixed(1)} m/s for direct de-orbit to ${A.deorbitPerigeeKm} km perigee.`;

  return {
    requiredDvMs,
    availableDvMs,
    margin,
    verdict,
    isNaturalDecayCandidate,
    notes,
  };
}
