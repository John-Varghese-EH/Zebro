import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface HeroEarthCanvasProps {
  phase: 'approach' | 'critical' | 'avoided';
  altitudeKm?: number;
  satelliteName?: string;
}

/**
 * Photorealistic 3D Earth Mesh with NASA Day Map and Night City Lights
 */
const EarthModel: React.FC<{ phase: 'approach' | 'critical' | 'avoided'; altitudeKm: number }> = ({
  phase,
  altitudeKm,
}) => {
  const earthGroupRef = useRef<THREE.Group>(null);
  const satRef = useRef<THREE.Mesh>(null);
  const debRef = useRef<THREE.Mesh>(null);

  const [dayTex, nightTex] = useLoader(THREE.TextureLoader, [
    '/textures/earth_day_2k.jpg',
    '/textures/earth_night_2k.jpg',
  ]);

  useMemo(() => {
    if (dayTex) {
      dayTex.colorSpace = THREE.SRGBColorSpace;
      dayTex.anisotropy = 4;
    }
    if (nightTex) {
      nightTex.colorSpace = THREE.SRGBColorSpace;
      nightTex.anisotropy = 4;
    }
  }, [dayTex, nightTex]);

  // Scaled units: Earth radius = 2.4 units (representing 6,378 km)
  const earthRadius = 2.4;
  const satOrbitRadius = earthRadius + (altitudeKm / 6378) * earthRadius; // ~2.68 for 747km
  const debOrbitRadius = earthRadius + 0.32; // Intersecting shell

  // Generate 3D Primary Satellite Orbit Line points
  const satOrbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 120;
    const inc = 1.71; // ~98 deg SSO inclination in radians
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = satOrbitRadius * Math.cos(theta);
      const y = satOrbitRadius * Math.sin(theta) * Math.cos(inc);
      const z = satOrbitRadius * Math.sin(theta) * Math.sin(inc);
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [satOrbitRadius]);

  // Generate 3D Debris Intersecting Orbit Line points
  const debOrbitPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 100;
    const inc = 1.15; // ~66 deg inclination
    const raan = 0.85; // Right ascension node rotation
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x0 = debOrbitRadius * Math.cos(theta);
      const y0 = debOrbitRadius * Math.sin(theta) * Math.cos(inc);
      const z0 = debOrbitRadius * Math.sin(theta) * Math.sin(inc);
      const x = x0 * Math.cos(raan) + z0 * Math.sin(raan);
      const z = -x0 * Math.sin(raan) + z0 * Math.cos(raan);
      pts.push(new THREE.Vector3(x, y0, z));
    }
    return pts;
  }, [debOrbitRadius]);

  const satOrbitLine = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(satOrbitPoints);
    const color = phase === 'critical' ? 0xef4444 : phase === 'avoided' ? 0x10b981 : 0xe2e8f0;
    const mat = new THREE.LineBasicMaterial({
      color,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.85,
    });
    return new THREE.Line(geom, mat);
  }, [satOrbitPoints, phase]);

  const debOrbitLine = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(debOrbitPoints);
    const mat = new THREE.LineBasicMaterial({
      color: phase === 'critical' ? 0xf43f5e : 0x94a3b8,
      linewidth: 1,
      transparent: true,
      opacity: phase === 'critical' ? 0.9 : 0.35,
    });
    return new THREE.Line(geom, mat);
  }, [debOrbitPoints, phase]);

  // Animation frame loop: Earth rotation and satellite motion
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y = t * 0.05; // Gentle axial rotation
    }

    if (satRef.current) {
      const theta = t * 0.65;
      const inc = 1.71;
      const r = phase === 'avoided' ? satOrbitRadius + 0.06 : satOrbitRadius;
      satRef.current.position.x = r * Math.cos(theta);
      satRef.current.position.y = r * Math.sin(theta) * Math.cos(inc);
      satRef.current.position.z = r * Math.sin(theta) * Math.sin(inc);
    }

    if (debRef.current) {
      const theta = t * 0.72 + 0.4;
      const inc = 1.15;
      const raan = 0.85;
      const x0 = debOrbitRadius * Math.cos(theta);
      const y0 = debOrbitRadius * Math.sin(theta) * Math.cos(inc);
      const z0 = debOrbitRadius * Math.sin(theta) * Math.sin(inc);
      debRef.current.position.x = x0 * Math.cos(raan) + z0 * Math.sin(raan);
      debRef.current.position.y = y0;
      debRef.current.position.z = -x0 * Math.sin(raan) + z0 * Math.cos(raan);
    }
  });

  return (
    <group>
      {/* Rotating Earth Mesh */}
      <group ref={earthGroupRef}>
        {/* Surface Sphere */}
        <mesh>
          <sphereGeometry args={[earthRadius, 48, 48]} />
          <meshStandardMaterial
            map={dayTex}
            emissiveMap={nightTex}
            emissive={new THREE.Color(0xffe8a0)}
            emissiveIntensity={0.5}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* Primary Atmospheric Rim Glow */}
        <mesh>
          <sphereGeometry args={[earthRadius * 1.025, 48, 48]} />
          <meshBasicMaterial
            color="#94A3B8"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Outer Neutral Space Haze */}
        <mesh>
          <sphereGeometry args={[earthRadius * 1.06, 32, 32]} />
          <meshBasicMaterial
            color="#64748B"
            transparent
            opacity={0.03}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* Primary Satellite Orbit Path */}
      <primitive object={satOrbitLine} />

      {/* Debris Orbit Path */}
      <primitive object={debOrbitLine} />

      {/* Primary Spacecraft Marker */}
      <mesh ref={satRef}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial
          color={phase === 'avoided' ? '#10B981' : phase === 'critical' ? '#EF4444' : '#FFFFFF'}
          emissive={phase === 'avoided' ? '#10B981' : phase === 'critical' ? '#EF4444' : '#FFFFFF'}
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Debris Body Marker */}
      <mesh ref={debRef}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial
          color="#F43F5E"
          emissive="#F43F5E"
          emissiveIntensity={1.0}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
};

export const HeroEarthCanvas: React.FC<HeroEarthCanvasProps> = ({
  phase,
  altitudeKm = 747,
}) => {
  return (
    <div className="relative w-full h-full select-none">
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center font-mono text-xs text-sky-400">
            <span>Loading 3D Earth model...</span>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 2.2, 5.5], fov: 42 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[8, 5, 6]} intensity={1.5} />

          <EarthModel phase={phase} altitudeKm={altitudeKm} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.08}
            autoRotate={true}
            autoRotateSpeed={0.5}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={(Math.PI * 3) / 4}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};
