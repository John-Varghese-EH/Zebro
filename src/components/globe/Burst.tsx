import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMission } from '../../store/useMission';
import { breakup, step, Frag } from '../../engine/kessler';
import { Vec3 } from '../../engine/constants';
import { temeToThree } from './Orbits';

export const Burst: React.FC = () => {
  const { kessler, events, selAlertId } = useMission();
  const alert = events.find((e) => e.id === selAlertId) ?? events[0];

  const numDrawn = 400;
  const fragsRef = useRef<Frag[]>([]);
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => new Float32Array(numDrawn * 3), [numDrawn]);

  useEffect(() => {
    if (kessler === 'running' && alert) {
      // TCA position in TEME km
      const r0: Vec3 = alert.r_pri_tca ?? [7125, 0, 0];
      const v0: Vec3 = alert.v_pri_tca ?? [0, 7.48, 0];
      fragsRef.current = breakup(r0, v0, numDrawn);
    } else {
      fragsRef.current = [];
    }
  }, [kessler, alert]);

  useFrame((_, delta) => {
    if (kessler !== 'running' || fragsRef.current.length === 0) return;

    // Advance fragments by 60x warp
    const simDt = delta * 60;
    for (let i = 0; i < fragsRef.current.length; i++) {
      const f = fragsRef.current[i];
      step(f, simDt);

      const p3 = temeToThree(f.r);
      positions[i * 3 + 0] = p3.x;
      positions[i * 3 + 1] = p3.y;
      positions[i * 3 + 2] = p3.z;
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (kessler !== 'running') return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          color="#E23D5C"
          size={0.06}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.85}
        />
      </points>
    </group>
  );
};
