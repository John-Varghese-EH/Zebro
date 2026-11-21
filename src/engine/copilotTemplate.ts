export interface CopilotFacts {
  primary: string;
  secondary: string;
  missKm: number;
  hours: number;
  minutes: number;
  relSpeed: number;
  pc: string; // e.g. "1.6e-4"
  tag: string;
  direction: string;
  lead: number;
  dv: number;
  totalDv: number;
  newMiss: number;
  savingPercent: number;
  baselineDv: number;
  days: number;
  burnOverIndia: boolean;
  elementAgeDays: number;
}

export function copilotTemplate(facts: CopilotFacts): string {
  const sentence1 = `${facts.primary} and ${facts.secondary} pass ${facts.missKm.toFixed(2)} km apart in ${facts.hours} h ${facts.minutes} min, closing at ${facts.relSpeed.toFixed(2)} km/s (Pc ${facts.pc}, ${facts.tag}).`;

  const sentence2 = `Recommended: ${facts.direction} burn ${facts.lead} orbits before closest approach, ${facts.dv.toFixed(3)} m/s (${facts.totalDv.toFixed(3)} m/s with recovery), clearing the object by ${facts.newMiss.toFixed(2)} km.`;

  const indiaNote = facts.burnOverIndia
    ? 'falls over India, which may interrupt imaging'
    : 'happens outside India';

  const sentence3 = `That is ${facts.savingPercent.toFixed(0)} percent less delta-v than a late burn (${facts.baselineDv.toFixed(3)} m/s), costs about ${facts.days.toFixed(1)} days of station-keeping, and ${indiaNote}. Screening-level estimate from public elements aged ${facts.elementAgeDays.toFixed(1)} days.`;

  return `${sentence1} ${sentence2} ${sentence3}`;
}
