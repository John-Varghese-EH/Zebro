import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useMission } from '../../store/useMission';
import { temeToThree } from './Orbits';
import { isOverIndia } from '../../geo/india';

interface SpacecraftModelProps {
  isSelected: boolean;
  name: string;
  onClick: () => void;
  isBurnActive?: boolean;
  isInspectionView?: boolean;
}

// High-fidelity 3D spacecraft structure with gold MLI foil, articulated solar wings, and SAR payloads
const SpacecraftModel: React.FC<SpacecraftModelProps> = ({
  isSelected,
  name,
  onClick,
  isBurnActive = false,
  isInspectionView = false,
}) => {
  return (
    <group onClick={onClick}>
      {/* Central Satellite Body with Multi-Layer Insulation (MLI) Gold Foil */}
      <mesh castShadow>
        <boxGeometry args={[0.11, 0.065, 0.075]} />
        <meshStandardMaterial
          color={isSelected ? '#F59E0B' : '#B45309'}
          metalness={0.88}
          roughness={0.22}
        />
      </mesh>

      {/* ISRO Sovereign Identifier Tricolor Accent on Bus Deck */}
      <mesh position={[0, 0.033, 0]}>
        <boxGeometry args={[0.08, 0.001, 0.015]} />
        <meshBasicMaterial color="#FF9933" />
      </mesh>

      {/* Port Solar Photovoltaic Wing with Structural Hinge Strut */}
      <group position={[-0.17, 0, 0]}>
        {/* Silicon Solar Panel */}
        <mesh>
          <boxGeometry args={[0.18, 0.065, 0.006]} />
          <meshStandardMaterial
            color="#1E3A8A"
            metalness={0.65}
            roughness={0.25}
          />
        </mesh>
        {/* Articulation Hinge Boom */}
        <mesh position={[0.10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.004, 0.004, 0.035, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Starboard Solar Photovoltaic Wing with Structural Hinge Strut */}
      <group position={[0.17, 0, 0]}>
        {/* Silicon Solar Panel */}
        <mesh>
          <boxGeometry args={[0.18, 0.065, 0.006]} />
          <meshStandardMaterial
            color="#1E3A8A"
            metalness={0.65}
            roughness={0.25}
          />
        </mesh>
        {/* Articulation Hinge Boom */}
        <mesh position={[-0.10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.004, 0.004, 0.035, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Satellite-Specific Payload Hardware Architecture */}
      {name.toUpperCase().includes('NISAR') ? (
        /* NISAR: Iconic 12-meter deployable mesh reflector radar boom */
        <group position={[0, 0.05, -0.01]} rotation={[-0.4, 0.2, 0]}>
          {/* Articulated Deployable Lattice Boom */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* 12-meter Mesh Reflector Dish */}
          <group position={[0, 0.16, 0]} rotation={[0.5, 0, 0]}>
            <mesh>
              <coneGeometry args={[0.11, 0.035, 32, 1, true]} />
              <meshStandardMaterial
                color="#F59E0B"
                metalness={0.85}
                roughness={0.2}
                wireframe={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Dish Perimeter Rim Ring */}
            <mesh>
              <torusGeometry args={[0.11, 0.004, 8, 32]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        </group>
      ) : name.toUpperCase().includes('EOS-04') || name.toUpperCase().includes('RISAT') ? (
        /* EOS-04 (RISAT-1A): Planar C-band Active Phased Array SAR Antenna */
        <group position={[0, -0.045, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.22, 0.09, 0.008]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Tiled T/R Module Active Sub-arrays */}
          <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.20, 0.075, 0.002]} />
            <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ) : name.toUpperCase().includes('CARTOSAT') ? (
        /* CARTOSAT-3: High-Resolution Panchromatic Dual Telescope Optical Housing */
        <group position={[0, -0.045, 0]} rotation={[Math.PI, 0, 0]}>
          {/* Dual Telescope Housing Box */}
          <mesh>
            <boxGeometry args={[0.07, 0.045, 0.05]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Primary High-Resolution Optic Barrel */}
          <mesh position={[-0.018, 0.03, 0]}>
            <cylinderGeometry args={[0.016, 0.018, 0.035, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Secondary Optic Barrel */}
          <mesh position={[0.018, 0.03, 0]}>
            <cylinderGeometry args={[0.014, 0.016, 0.035, 20]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ) : (
        /* Default ISRO Multi-Spectral Earth Observation Sensor (EOS-06 / RESOURCESAT-2A) */
        <group position={[0, -0.04, 0]} rotation={[Math.PI, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.026, 0.035, 20]} />
            <meshStandardMaterial
              color="#E2E8F0"
              metalness={0.92}
              roughness={0.12}
            />
          </mesh>
          {/* Front Optic Element */}
          <mesh position={[0, 0.018, 0]}>
            <circleGeometry args={[0.018, 20]} />
            <meshStandardMaterial
              color="#047857"
              metalness={0.95}
              roughness={0.05}
            />
          </mesh>
        </group>
      )}

      {/* Prograde Along-Track Maneuver Thruster (+T) */}
      <mesh position={[0.045, -0.025, 0.035]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.007, 0.012, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Retrograde Along-Track Maneuver Thruster (-T) */}
      <mesh position={[-0.045, -0.025, -0.035]} rotation={[0, Math.PI, 0]}>
        <coneGeometry args={[0.007, 0.012, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Active Chemical Thruster Exhaust Plume Glow */}
      {isBurnActive && (
        <mesh position={[0.045, -0.025, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.016, 0.05, 16]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Selection Beacon Halo */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[0.22, 0.25, 32]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Primary Satellite Label - fixed screen-space scale, hidden in inspection view */}
      {!isInspectionView && (
        <Html
          position={[0, 0.22, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-sans whitespace-nowrap border shadow-sm transition-all ${
              isSelected
                ? 'bg-navy-900/95 text-sky border-sky/80 font-bold ring-1 ring-sky/40'
                : 'bg-navy-950/85 text-chalk-dim border-white/10'
            }`}
          >
            {name}
          </div>
        </Html>
      )}
    </group>
  );
};

interface FleetProps {
  viewMode?: 'overview' | 'satellite' | 'india';
}

export const Fleet: React.FC<FleetProps> = ({ viewMode = 'overview' }) => {
  const {
    fleet,
    fleetSatrecs,
    selSatId,
    setSelSatId,
    scenario,
    executed,
    selAlertId,
    events,
  } = useMission();

  const groupRef = useRef<THREE.Group>(null);
  const selectedAlert = events.find((e) => e.id === selAlertId);
  const isBurnExecuted = selectedAlert ? !!executed[selectedAlert.id] : false;

  // Track positions, nadir orientation, and group object references
  const satGroupRefs = useRef<Record<string, THREE.Group | null>>({});
  const secGroupRef = useRef<THREE.Group | null>(null);
  const satPositions = useRef<Record<string, THREE.Vector3>>({});
  const satOverIndia = useRef<Record<string, boolean>>({});
  const secPosition = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
    const currentSimMs = useMission.getState().getPreciseSimMs();
    const simDate = new Date(currentSimMs);
    const gmst = satellite.gstime(simDate);

    // Propagate 5 fleet satellites and update Three.js scene graph directly
    fleet.forEach((sat) => {
      const satrec = fleetSatrecs[sat.noradId];
      if (satrec) {
        const pv = satellite.propagate(satrec, simDate);
        if (pv && typeof pv.position !== 'boolean' && pv.position && pv.velocity) {
          const threePos = temeToThree([
            pv.position.x,
            pv.position.y,
            pv.position.z,
          ]);
          satPositions.current[sat.id] = threePos;

          // Align satellite: nadir points toward Earth center (0,0,0)
          const up = threePos.clone().normalize();
          const vel = temeToThree([
            pv.velocity.x,
            pv.velocity.y,
            pv.velocity.z,
          ]).normalize();
          const right = new THREE.Vector3().crossVectors(vel, up).normalize();
          const rotMatrix = new THREE.Matrix4().makeBasis(right, up, vel);
          const rotEuler = new THREE.Euler().setFromRotationMatrix(rotMatrix);

          // Direct scene transform update without React re-render
          const grp = satGroupRefs.current[sat.id];
          if (grp) {
            grp.position.copy(threePos);
            grp.rotation.copy(rotEuler);
          }

          // Check if ground track is over India observation corridor
          const geo = satellite.eciToGeodetic(pv.position, gmst);
          const lat = satellite.degreesLat(geo.latitude);
          const lon = satellite.degreesLong(geo.longitude);
          satOverIndia.current[sat.id] = isOverIndia(lat, lon);
        }
      }
    });

    // Propagate secondary threat if scenario is active
    if (scenario) {
      const dtS = (currentSimMs - new Date(scenario.event.tca_utc).getTime()) / 1000;
      const secState = scenario.sAt(dtS);
      const secThreePos = temeToThree(secState.r);
      secPosition.current = secThreePos;
      if (secGroupRef.current) {
        secGroupRef.current.position.copy(secThreePos);
      }
    } else {
      secPosition.current = null;
    }
  });

  const selectedSat = fleet.find((f) => f.id === selSatId);
  const isSelectedOverIndia = selectedSat ? satOverIndia.current[selectedSat.id] : false;

  return (
    <group ref={groupRef}>
      {fleet.map((sat) => {
        const isSelected = sat.id === selSatId;
        const initPos = satPositions.current[sat.id] ?? new THREE.Vector3(7, 0, 0);

        return (
          <group
            key={sat.id}
            ref={(el) => {
              satGroupRefs.current[sat.id] = el;
            }}
            position={initPos}
          >
            <SpacecraftModel
              isSelected={isSelected}
              name={sat.name}
              isBurnActive={isBurnExecuted && isSelected}
              isInspectionView={isSelected && viewMode === 'satellite'}
              onClick={() => setSelSatId(sat.id)}
            />

            {/* Earth Observation Sensor Swath Projection Footprint */}
            {isSelected && (
              <group>
                <mesh position={[0, -0.4, 0]} rotation={[0, 0, 0]}>
                  <cylinderGeometry
                    args={[
                      (sat.swathKm || 240) / 1000, // Bottom footprint radius
                      0.02,                         // Top sensor aperture
                      0.75,                         // Beam length toward surface
                      24,
                      1,
                      true                          // Open cylinder beam
                    ]}
                  />
                  <meshBasicMaterial
                    color={isSelectedOverIndia ? '#F59E0B' : '#38BDF8'}
                    transparent
                    opacity={isSelectedOverIndia ? 0.18 : 0.09}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* Secondary threat satellite marker in Rose-Red or Cleared Green */}
      {scenario && (
        <group
          ref={secGroupRef}
          position={secPosition.current ?? new THREE.Vector3(7.1, 0, 0)}
        >
          {/* Debris / Secondary threat core marker */}
          <mesh>
            <octahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial
              color={isBurnExecuted ? '#10B981' : '#F43F5E'}
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>

          {/* 3D Encounter Covariance Uncertainty Ellipsoid (1-Sigma Core) */}
          <mesh>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshBasicMaterial
              color={isBurnExecuted ? '#10B981' : '#F43F5E'}
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>

          {/* 3-Sigma Outer Uncertainty Volume Wireframe */}
          <mesh>
            <sphereGeometry args={[0.34, 14, 14]} />
            <meshBasicMaterial
              color={isBurnExecuted ? '#10B981' : '#F43F5E'}
              wireframe={true}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>

          {/* Secondary threat tag - fixed screen-space scale */}
          <Html
            position={[0.2, 0.12, 0]}
            center={false}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-sans whitespace-nowrap border shadow-sm transition-all ${
                isBurnExecuted
                  ? 'bg-ok/25 text-ok border-ok/50 font-bold'
                  : 'bg-alert/25 text-alert border-alert/60 font-bold ring-1 ring-alert/40'
              }`}
            >
              <span>{scenario.event.secondary.name}</span>
              <span className="text-[9px] block font-mono font-normal opacity-90">
                {isBurnExecuted ? 'Separation assured (>5 km)' : 'Covariance 1σ / 3σ volume'}
              </span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};
