import React, { useMemo } from 'react';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useMission } from '../../store/useMission';
import { cwDisp, dvVector, rtn } from '../../engine/orbitalMath';
import { A } from '../../config/assumptions';
import { Vec3 } from '../../engine/constants';

// Frame conversion from TEME km to Three.js units (1 unit = 1,000 km):
// (x, y, z) -> (x, z, -y) / 1000 per Section 7
export const temeToThree = (p: [number, number, number]): THREE.Vector3 =>
  new THREE.Vector3(p[0] / 1000, p[2] / 1000, -p[1] / 1000);

export const Orbits: React.FC = () => {
  const {
    fleet,
    fleetSatrecs,
    selSatId,
    scenario,
    options,
    selOptionKey,
    executed,
    selAlertId,
    events,
  } = useMission();

  const selectedSat = fleet.find((f) => f.id === selSatId);
  const selectedAlert = events.find((e) => e.id === selAlertId);
  const selectedOpt = options.find((o) => o.key === selOptionKey);
  const isBurnExecuted = selectedAlert ? !!executed[selectedAlert.id] : false;

  // Pre-sample 1 full period for fleet orbits
  const fleetLineObjects = useMemo(() => {
    return fleet.map((sat) => {
      const satrec = fleetSatrecs[sat.noradId];
      if (!satrec) return null;

      const pts: THREE.Vector3[] = [];
      const periodMin = sat.periodMin || 98;
      const numPts = 120;
      const t0 = new Date(sat.epoch || Date.now());

      for (let i = 0; i <= numPts; i++) {
        const t = new Date(t0.getTime() + (i / numPts) * periodMin * 60 * 1000);
        const pv = satellite.propagate(satrec, t);
        if (pv && typeof pv.position !== 'boolean' && pv.position) {
          pts.push(temeToThree([pv.position.x, pv.position.y, pv.position.z]));
        }
      }

      if (pts.length < 10) return null;
      const isSelected = sat.id === selSatId;
      const geometry = new THREE.BufferGeometry().setFromPoints(pts);
      const material = new THREE.LineBasicMaterial({
        color: isSelected ? 0x8fc4e8 : 0x26435f,
        transparent: true,
        opacity: isSelected ? 0.85 : 0.35,
        linewidth: 1,
      });

      return { id: sat.id, line: new THREE.Line(geometry, material) };
    });
  }, [fleet, fleetSatrecs, selSatId]);

  // Secondary threat orbit (scenario or selected alert)
  const secondaryLineObject = useMemo(() => {
    if (scenario && scenario.secondaryOrbitPoints.length > 0) {
      const pts = scenario.secondaryOrbitPoints.map((p) => temeToThree(p));
      const geometry = new THREE.BufferGeometry().setFromPoints(pts);
      const material = new THREE.LineBasicMaterial({
        color: 0xe23d5c,
        transparent: true,
        opacity: 0.75,
        linewidth: 1.5,
      });
      return new THREE.Line(geometry, material);
    }
    return null;
  }, [scenario]);

  // Ghost orbit showing avoidance trajectory displacement (150x exaggerated per Section 9.3)
  const ghostLineObject = useMemo(() => {
    if (!selectedSat || !selectedOpt) return null;
    const satrec = fleetSatrecs[selectedSat.noradId];
    if (!satrec) return null;

    const periodMin = selectedSat.periodMin || 98;
    const periodS = periodMin * 60;
    const n = (2 * Math.PI) / periodS;
    const numPts = 120;
    const pts: THREE.Vector3[] = [];
    const t0 = new Date(selectedSat.epoch || Date.now());
    const dvRtn = dvVector(selectedOpt.direction, selectedOpt.dvMs);

    for (let i = 0; i <= numPts; i++) {
      const dtS = (i / numPts) * periodS;
      const t = new Date(t0.getTime() + dtS * 1000);
      const pv = satellite.propagate(satrec, t);
      if (pv && typeof pv.position !== 'boolean' && pv.position && pv.velocity) {
        const r: Vec3 = [pv.position.x, pv.position.y, pv.position.z];
        const v: Vec3 = [pv.velocity.x, pv.velocity.y, pv.velocity.z];
        const d = cwDisp(n, dvRtn, selectedOpt.leadS + dtS);
        const { R, T, N } = rtn(r, v);

        // Apply visual exaggeration factor
        const ex = A.ghostExaggeration;
        const dispKmX = ((R[0] * d.R + T[0] * d.T + N[0] * d.N) / 1000) * ex;
        const dispKmY = ((R[1] * d.R + T[1] * d.T + N[1] * d.N) / 1000) * ex;
        const dispKmZ = ((R[2] * d.R + T[2] * d.T + N[2] * d.N) / 1000) * ex;

        pts.push(temeToThree([r[0] + dispKmX, r[1] + dispKmY, r[2] + dispKmZ]));
      }
    }

    if (pts.length < 10) return null;
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineDashedMaterial({
      color: 0x3fbf8f,
      transparent: true,
      opacity: 0.8,
      linewidth: 1.2,
      dashSize: isBurnExecuted ? 1000 : 0.4,
      gapSize: isBurnExecuted ? 0 : 0.2,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
  }, [selectedSat, selectedOpt, fleetSatrecs, isBurnExecuted]);

  return (
    <group>
      {/* Fleet Satellite Orbits */}
      {fleetLineObjects.map((orb) => {
        if (!orb) return null;
        return <primitive key={orb.id} object={orb.line} />;
      })}

      {/* Secondary Threat Orbit Line in Rose-Red */}
      {secondaryLineObject && <primitive object={secondaryLineObject} />}

      {/* Ghost Displaced Avoidance Orbit */}
      {ghostLineObject && <primitive object={ghostLineObject} />}
    </group>
  );
};
