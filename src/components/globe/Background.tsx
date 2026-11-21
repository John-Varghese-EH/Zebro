import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useMission } from '../../store/useMission';

export const Background: React.FC = () => {
  const { background } = useMission();
  const pointsRef = useRef<THREE.Points>(null);
  const lastUpdateRef = useRef<number>(0);

  // Initialize satrecs for up to 1500 background objects
  const bgSatrecs = useMemo(() => {
    const list: satellite.SatRec[] = [];
    for (const obj of background.slice(0, 1500)) {
      try {
        const s = satellite.json2satrec(obj);
        list.push(s);
      } catch {
        // skip unparseable
      }
    }
    return list;
  }, [background]);

  const numPoints = bgSatrecs.length || 1;
  const positions = useMemo(() => new Float32Array(numPoints * 3), [numPoints]);

  // Throttled propagation loop inside Three.js frame to maintain 60 FPS
  useFrame(() => {
    const now = performance.now();
    const warp = useMission.getState().warp;
    // Adapt update frequency based on warp factor
    const throttleMs = warp > 10 ? 150 : 500;
    if (now - lastUpdateRef.current < throttleMs && lastUpdateRef.current !== 0) {
      return;
    }
    lastUpdateRef.current = now;

    const currentSimMs = useMission.getState().getPreciseSimMs();
    const date = new Date(currentSimMs);

    for (let i = 0; i < bgSatrecs.length; i++) {
      const s = bgSatrecs[i];
      const pv = satellite.propagate(s, date);
      if (pv && typeof pv.position !== 'boolean' && pv.position) {
        positions[i * 3 + 0] = pv.position.x / 1000;
        positions[i * 3 + 1] = pv.position.z / 1000;
        positions[i * 3 + 2] = -pv.position.y / 1000;
      } else {
        positions[i * 3 + 0] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
      }
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#62788F"
        size={0.035}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
};
