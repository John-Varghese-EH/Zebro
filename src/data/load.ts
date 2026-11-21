import * as satellite from 'satellite.js';
import { PrimaryMission, ConjunctionEvent, Manifest } from '../engine/constants';
import { MU, RE } from '../engine/constants';

export interface LoadedMissionData {
  fleet: PrimaryMission[];
  fleetSatrecs: Record<number, satellite.SatRec>;
  background: any[];
  events: ConjunctionEvent[];
  manifest: Manifest | null;
}

export async function loadMissionData(): Promise<LoadedMissionData> {
  const [missionsRes, fleetGpRes, bgRes, conjRes, manRes] = await Promise.allSettled([
    fetch('/data/isro_missions.json'),
    fetch('/data/fleet_gp.json'),
    fetch('/data/background.json'),
    fetch('/data/conjunctions.json'),
    fetch('/data/manifest.json'),
  ]);

  const missions: PrimaryMission[] = missionsRes.status === 'fulfilled' && missionsRes.value.ok
    ? await missionsRes.value.json()
    : [];

  let fleetGp: any[] = fleetGpRes.status === 'fulfilled' && fleetGpRes.value.ok
    ? await fleetGpRes.value.json()
    : [];

  // Attempt live upstream CelesTrak refresh for primary fleet if online
  try {
    const liveController = new AbortController();
    const timer = setTimeout(() => liveController.abort(), 1800);
    const liveRes = await fetch('/api/celestrak/NORAD/elements/gp.php?CATNR=51656&FORMAT=json', {
      signal: liveController.signal,
    });
    clearTimeout(timer);
    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      if (Array.isArray(liveJson) && liveJson.length > 0) {
        const liveRecord = liveJson[0];
        const idx = fleetGp.findIndex((g) => Number(g.NORAD_CAT_ID) === Number(liveRecord.NORAD_CAT_ID));
        if (idx !== -1) {
          fleetGp[idx] = liveRecord;
        }
      }
    }
  } catch {
    // Retain verified mirror cache from fleet_gp.json
  }

  const background: any[] = bgRes.status === 'fulfilled' && bgRes.value.ok
    ? await bgRes.value.json()
    : [];

  const conjData = conjRes.status === 'fulfilled' && conjRes.value.ok
    ? await conjRes.value.json()
    : { events: [] };

  const manifest: Manifest | null = manRes.status === 'fulfilled' && manRes.value.ok
    ? await manRes.value.json()
    : null;

  const fleetSatrecs: Record<number, satellite.SatRec> = {};
  const nowMs = Date.now();

  // Combine static mission specs with runtime OMM DATA
  const fleet: PrimaryMission[] = missions.map(m => {
    const gp = fleetGp.find(g => Number(g.NORAD_CAT_ID) === m.noradId);
    if (!gp) return m;

    try {
      const satrec = satellite.json2satrec(gp);
      fleetSatrecs[m.noradId] = satrec;

      const nRevPerDay = Number(gp.MEAN_MOTION);
      const nRadPerS = (nRevPerDay * 2 * Math.PI) / 86400;
      const aKm = Math.pow(MU / (nRadPerS * nRadPerS), 1 / 3);
      const altKm = Math.round((aKm - RE) * 10) / 10;
      const incDeg = Math.round(Number(gp.INCLINATION) * 100) / 100;
      const periodMin = Math.round((1440 / nRevPerDay) * 10) / 10;

      const epochStr = String(gp.EPOCH);
      const epochDate = new Date(epochStr.endsWith('Z') ? epochStr : epochStr + 'Z');
      const ageDays = Math.max(0, (nowMs - epochDate.getTime()) / (86400 * 1000));

      return {
        ...m,
        altitudeKm: altKm,
        inclinationDeg: incDeg,
        periodMin,
        epoch: gp.EPOCH,
        epochAgeDays: Math.round(ageDays * 100) / 100,
      };
    } catch {
      return m;
    }
  });

  return {
    fleet,
    fleetSatrecs,
    background,
    events: conjData.events || [],
    manifest,
  };
}
