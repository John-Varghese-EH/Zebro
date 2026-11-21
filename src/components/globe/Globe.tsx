import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useMission } from '../../store/useMission';
import { Fleet } from './Fleet';
import { Background } from './Background';
import { Orbits } from './Orbits';
import { Burst } from './Burst';
import { EARTH_LON_OFFSET, RE } from '../../engine/constants';
import { playClickTone, playTacticalBeep } from '../../utils/audio';

// Photorealistic Earth sphere with NASA day map and night city lights
const EarthSphere: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);

  const [dayTex, nightTex] = useLoader(THREE.TextureLoader, [
    '/textures/earth_day_2k.jpg',
    '/textures/earth_night_2k.jpg',
  ]);

  useMemo(() => {
    if (dayTex) {
      dayTex.colorSpace = THREE.SRGBColorSpace;
      dayTex.anisotropy = 8;
    }
    if (nightTex) {
      nightTex.colorSpace = THREE.SRGBColorSpace;
      nightTex.anisotropy = 8;
    }
  }, [dayTex, nightTex]);

  useFrame(() => {
    if (earthRef.current) {
      const currentSimMs = useMission.getState().getPreciseSimMs();
      const gmst = satellite.gstime(new Date(currentSimMs));
      // Rotate Earth mesh by Greenwich Mean Sidereal Time
      earthRef.current.rotation.y = gmst + EARTH_LON_OFFSET;
    }
  });

  return (
    <group>
      {/* Earth Surface (radius 6.378 units = 6,378 km) */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[6.378, 64, 64]} />
        <meshStandardMaterial
          map={dayTex}
          emissiveMap={nightTex}
          emissive={new THREE.Color(0xffe8a0)}
          emissiveIntensity={0.65}
          roughness={0.65}
          metalness={0.12}
        />
      </mesh>

      {/* Primary Atmospheric Rim Glow */}
      <mesh>
        <sphereGeometry args={[6.48, 64, 64]} />
        <meshBasicMaterial
          color="#8FC4E8"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer Cyan Haze Layer */}
      <mesh>
        <sphereGeometry args={[6.62, 48, 48]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

// Deep space cosmic starfield sphere
const CosmicBackground: React.FC = () => {
  const starTex = useLoader(THREE.TextureLoader, '/textures/stars_2k.jpg');
  const starRef = useRef<THREE.Mesh>(null);

  useMemo(() => {
    if (starTex) {
      starTex.colorSpace = THREE.SRGBColorSpace;
    }
  }, [starTex]);

  useFrame((_, delta) => {
    if (starRef.current) {
      // Slow cosmic rotation for celestial depth
      starRef.current.rotation.y += delta * 0.001;
    }
  });

  return (
    <mesh ref={starRef}>
      <sphereGeometry args={[55, 32, 32]} />
      <meshBasicMaterial
        map={starTex}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// Smooth Camera Controller with Apple-like spring easing & Spacecraft Chase Cam
export type GlobeViewMode = 'overview' | 'satellite' | 'india';

interface CameraRigProps {
  viewMode: GlobeViewMode;
  controlsRef: React.RefObject<any>;
}

const CameraRig: React.FC<CameraRigProps> = ({ viewMode, controlsRef }) => {
  const { fleet, fleetSatrecs, selSatId } = useMission();

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Default: Global fleet overview
    let targetPos = new THREE.Vector3(0, 8, 16);
    let targetLook = new THREE.Vector3(0, 0, 0);
    const currentSimMs = useMission.getState().getPreciseSimMs();

    if (viewMode === 'satellite') {
      // Spacecraft Chase / Inspection Perspective
      const sat = fleet.find((f) => f.id === selSatId) ?? fleet[0];
      const satrec = sat ? fleetSatrecs[sat.noradId] : null;
      if (satrec) {
        const pv = satellite.propagate(satrec, new Date(currentSimMs));
        if (pv && typeof pv.position !== 'boolean' && pv.position && pv.velocity) {
          const satPos = new THREE.Vector3(
            pv.position.x / 1000,
            pv.position.z / 1000,
            -pv.position.y / 1000
          );
          targetLook = satPos.clone();

          // Calculate radial up and velocity direction vectors
          const up = satPos.clone().normalize();
          const vel = new THREE.Vector3(
            pv.velocity.x / 1000,
            pv.velocity.z / 1000,
            -pv.velocity.y / 1000
          ).normalize();

          // Close-up cinematic chase camera: 0.34 units behind along-track, 0.16 units radial above
          // Renders spacecraft large and prominent with Earth horizon curving behind
          targetPos = satPos
            .clone()
            .add(vel.clone().multiplyScalar(-0.34))
            .add(up.clone().multiplyScalar(0.16));
        }
      }
    } else if (viewMode === 'india') {
      // India Zenith perspective
      const gmst = satellite.gstime(new Date(currentSimMs));
      const indiaLon = 78.5 * (Math.PI / 180) + gmst + EARTH_LON_OFFSET;
      const indiaLat = 22.5 * (Math.PI / 180);
      const r = 14;
      targetPos = new THREE.Vector3(
        r * Math.cos(indiaLat) * Math.sin(indiaLon),
        r * Math.sin(indiaLat),
        r * Math.cos(indiaLat) * Math.cos(indiaLon)
      );
      targetLook = new THREE.Vector3(0, 0, 0);
    }

    // Smooth spring interpolation
    const ease = Math.min(1.0, delta * 3.5);
    state.camera.position.lerp(targetPos, ease);
    controls.target.lerp(targetLook, ease);
    controls.update();
  });

  return null;
};

export const Globe: React.FC = React.memo(() => {
  const controlsRef = useRef<any>(null);
  const {
    fleet,
    selSatId,
    setSelSatId,
    propellantPct,
    globePerspective,
    setGlobePerspective,
  } = useMission();
  const selectedSat = fleet.find((f) => f.id === selSatId) ?? fleet[0];
  const viewMode = globePerspective;

  // Precision Zoom Controller
  const handleZoom = (action: 'in' | 'out' | 'reset') => {
    playClickTone();
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    if (!camera) return;

    if (action === 'reset') {
      if (viewMode === 'satellite') {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(0.42);
        camera.position.copy(controls.target).add(offset);
      } else if (viewMode === 'india') {
        camera.position.setLength(14);
      } else {
        camera.position.set(0, 8, 16);
        controls.target.set(0, 0, 0);
      }
    } else {
      const factor = action === 'in' ? 0.75 : 1.33;
      const offset = camera.position.clone().sub(controls.target);
      const newLen = offset.length() * factor;
      const minLen = viewMode === 'satellite' ? 0.12 : 6.8;
      const maxLen = viewMode === 'satellite' ? 6.0 : 45.0;
      offset.setLength(Math.max(minLen, Math.min(maxLen, newLen)));
      camera.position.copy(controls.target).add(offset);
    }
    controls.update();
  };

  const handleSelectSatellite = (id: string) => {
    playTacticalBeep();
    setSelSatId(id);
    setGlobePerspective('satellite');
  };

  const currentPropellantKg = selectedSat
    ? (selectedSat.propellantKg * (propellantPct[selectedSat.id] ?? 100)) / 100
    : 42.6;

  return (
    <div className="w-full h-full relative select-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 8, 16], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#050D1A' }}
      >
        <ambientLight intensity={0.4} />
        {/* Sun directional light illuminating Earth terminator */}
        <directionalLight position={[16, 8, 12]} intensity={1.4} />

        <CosmicBackground />
        <EarthSphere />
        <Orbits />
        <Background />
        <Fleet viewMode={viewMode} />
        <Burst />

        <CameraRig viewMode={viewMode} controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.08}
          minDistance={viewMode === 'satellite' ? 0.12 : 6.8}
          maxDistance={viewMode === 'satellite' ? 8.0 : 45}
        />
      </Canvas>

      {/* Tactical Floating Perspective Mode Switcher */}
      <div className="absolute top-3 left-3 z-10 p-0.5 bg-white/[0.04] border border-white/10 ring-1 ring-white/5 rounded-full backdrop-blur-2xl shadow-2xl flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => {
            playTacticalBeep();
            setGlobePerspective('overview');
          }}
          className={`px-3 py-1 rounded-full text-[11px] font-sans font-semibold transition-all active:scale-95 ${
            viewMode === 'overview'
              ? 'bg-sky text-navy-950 font-bold shadow-sm'
              : 'text-chalk-dim hover:text-chalk hover:bg-white/5'
          }`}
        >
          Fleet View
        </button>
        <button
          type="button"
          onClick={() => {
            playTacticalBeep();
            setGlobePerspective('satellite');
          }}
          className={`px-3 py-1 rounded-full text-[11px] font-sans font-semibold transition-all active:scale-95 flex items-center gap-1.5 ${
            viewMode === 'satellite'
              ? 'bg-sky text-navy-950 font-bold shadow-sm'
              : 'text-chalk-dim hover:text-chalk hover:bg-white/5'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              viewMode === 'satellite' ? 'bg-navy-950' : 'bg-saffron animate-pulse'
            }`}
          />
          <span>Satellite View</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playTacticalBeep();
            setGlobePerspective('india');
          }}
          className={`px-3 py-1 rounded-full text-[11px] font-sans font-semibold transition-all active:scale-95 ${
            viewMode === 'india'
              ? 'bg-sky text-navy-950 font-bold shadow-sm'
              : 'text-chalk-dim hover:text-chalk hover:bg-white/5'
          }`}
        >
          India Zenith
        </button>
      </div>

      {/* Tactile Floating Zoom Control Panel */}
      <div className="absolute bottom-16 right-3 z-10 p-1 bg-white/[0.04] border border-white/10 ring-1 ring-white/5 rounded-2xl backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col items-center bg-[#070B13]/90 rounded-xl p-0.5 space-y-1">
          <button
            type="button"
            onClick={() => handleZoom('in')}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-chalk hover:text-sky hover:bg-white/10 active:scale-90 transition-all text-base font-bold font-mono"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleZoom('reset')}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-chalk-dim hover:text-chalk hover:bg-white/10 active:scale-90 transition-all text-xs font-mono"
            title="Reset Camera Framing"
            aria-label="Reset Camera Framing"
          >
            ⊙
          </button>
          <button
            type="button"
            onClick={() => handleZoom('out')}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-chalk hover:text-sky hover:bg-white/10 active:scale-90 transition-all text-base font-bold font-mono"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            -
          </button>
        </div>
      </div>

      {/* Spacecraft Telemetry HUD Card (active during Satellite View inspection) */}
      {viewMode === 'satellite' && selectedSat && (
        <div className="absolute top-14 left-3 z-10 w-80 max-h-[calc(100%-4.5rem)] overflow-y-auto p-1 rounded-2xl bg-white/[0.03] border border-white/10 ring-1 ring-white/5 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-xl bg-[#080D16]/95 border border-white/5 p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-saffron ring-4 ring-saffron/20" />
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-chalk-faint block">
                    Inspection Target
                  </span>
                  <span className="font-condensed font-bold uppercase tracking-wider text-chalk text-sm">
                    {selectedSat.name}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-chalk-dim px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                NORAD #{selectedSat.noradId}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-chalk-dim font-mono">
              <div className="flex justify-between">
                <span className="text-chalk-faint">Operational Mission:</span>
                <span className="text-chalk font-sans font-medium">{selectedSat.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk-faint">Orbital Regime:</span>
                <span className="text-chalk">SSO ({selectedSat.altitudeKm ?? 747} km)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk-faint">Orbital Velocity:</span>
                <span className="text-chalk tabular-nums">7.48 km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk-faint">Propellant Reserve:</span>
                <span className="text-sky font-semibold tabular-nums">
                  {currentPropellantKg.toFixed(1)} kg remaining
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk-faint">Attitude Orientation:</span>
                <span className="text-emerald-400 font-sans font-medium">3-Axis Nadir Locked</span>
              </div>
            </div>

            {/* Quick Fleet Switcher Pills */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[9px] text-chalk-faint uppercase tracking-[0.15em] block mb-1.5 font-mono">
                Switch Satellite Focus
              </span>
              <div className="flex flex-wrap gap-1">
                {fleet.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSatellite(s.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-all active:scale-95 ${
                      s.id === selectedSat.id
                        ? 'bg-sky text-navy-950 font-bold shadow-sm'
                        : 'bg-white/5 text-chalk-dim hover:text-chalk hover:bg-white/10'
                    }`}
                  >
                    {s.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subdued Telemetry & Coordinate Reference Overlay (Centered to avoid edge collisions) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 text-[10px] text-chalk-faint pointer-events-none font-mono bg-navy-950/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 whitespace-nowrap z-10 shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>TEME Inertial Reference</span>
        </span>
        <span>|</span>
        <span>R_E = {RE.toFixed(0)} km</span>
        <span>|</span>
        <span>NASA Blue Marble 2K</span>
      </div>
    </div>
  );
});
