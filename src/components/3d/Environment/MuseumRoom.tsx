import React, { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { createFloorMaps } from '../utils/proceduralMaterials';

const CEILING_DOWNLIGHTS: [number, number, number][] = [
  [0, 6.32, 14],
  [0, 6.32, 10],
  [-10, 6.32, -13],
  [0, 6.32, -13],
  [10, 6.32, -13],
  [-10, 6.32, -5],
  [0, 6.32, -5],
  [10, 6.32, -5],
  [-10, 6.32, 3],
  [0, 6.32, 3],
  [10, 6.32, 3],
];

const TRACK_SPOTS: [number, number, number][] = [
  [0, 6.18, -11],
  [-7.5, 6.18, -11.5],
  [7.5, 6.18, -11.5],
  [8.5, 6.18, -4],
  [-8.5, 6.18, -6],
  [-8.5, 6.18, 4],
  [6.0, 6.18, -12.5],
];

export const MuseumRoom: React.FC = () => {
  const floorMaps = useMemo(() => createFloorMaps(), []);

  useEffect(() => {
    return () => {
      floorMaps.map.dispose();
      floorMaps.roughnessMap.dispose();
    };
  }, [floorMaps]);

  return (
    <group>
      {/* ================= FLOOR WITH TERRAZZO PBR MAPS & PHYSICS ================= */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh position={[0, -0.05, -5]} receiveShadow>
          <boxGeometry args={[34, 0.1, 28]} />
          <meshStandardMaterial
            map={floorMaps.map}
            roughnessMap={floorMaps.roughnessMap}
            color="#d8e4f5"
            roughness={0.82}
            metalness={0.18}
          />
        </mesh>

        <mesh position={[0, -0.05, 12]} receiveShadow>
          <boxGeometry args={[6, 0.1, 10]} />
          <meshStandardMaterial
            map={floorMaps.map}
            roughnessMap={floorMaps.roughnessMap}
            color="#cdd9ec"
            roughness={0.85}
            metalness={0.18}
          />
        </mesh>
      </RigidBody>

      {/* ================= CEILING, COFFER BEAMS & LIGHT FIXTURES ================= */}
      <mesh position={[0, 6.5, -3]}>
        <boxGeometry args={[36, 0.2, 40]} />
        <meshStandardMaterial color="#0d1320" roughness={0.75} metalness={0.15} />
      </mesh>

      {[-12, -7, -2, 3].map((z) => (
        <group key={`beam-${z}`} position={[0, 6.32, z]}>
          <RoundedBox args={[32, 0.28, 0.44]} radius={0.04} smoothness={4}>
            <meshStandardMaterial color="#182236" metalness={0.5} roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[28, 0.02, 0.14]} />
            <meshBasicMaterial color="#dbeafe" />
          </mesh>
        </group>
      ))}

      {/* Entrance Corridor Ceiling Linear Lights */}
      <group position={[0, 6.35, 12]}>
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[0.14, 0.04, 6.5]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[0.14, 0.04, 6.5]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
      </group>

      {/* Recessed Ceiling Downlight Fixtures */}
      {CEILING_DOWNLIGHTS.map((pos, idx) => (
        <group key={`downlight-${idx}`} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.42, 0.12, 32]} />
            <meshStandardMaterial color="#273654" metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 32]} />
            <meshBasicMaterial color="#eef6ff" />
          </mesh>
        </group>
      ))}

      {/* Aimed Gallery Track Spotlight Cans */}
      {TRACK_SPOTS.map((pos, idx) => (
        <group key={`trackspot-${idx}`} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.17, 0.24, 24]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.26} />
          </mesh>
          <mesh position={[0, -0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.11, 24]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}

      {/* ================= WALLS WITH RAPIER RIGIDBODIES ================= */}
      <RigidBody type="fixed">
        <mesh position={[0, 3.25, -19]} receiveShadow>
          <boxGeometry args={[34, 6.5, 0.8]} />
          <meshStandardMaterial color="#141c2d" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[-17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial color="#141d2e" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial color="#141d2e" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[-9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial color="#141d2e" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial color="#141d2e" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[-2.6, 3.25, 12.5]}>
          <boxGeometry args={[0.4, 6.5, 8]} />
          <meshStandardMaterial color="#121928" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[2.6, 3.25, 12.5]}>
          <boxGeometry args={[0.4, 6.5, 8]} />
          <meshStandardMaterial color="#121928" roughness={0.62} metalness={0.18} />
        </mesh>

        <mesh position={[0, 3.25, 16.5]}>
          <boxGeometry args={[5.6, 6.5, 0.4]} />
          <meshStandardMaterial color="#121928" roughness={0.62} metalness={0.18} />
        </mesh>
      </RigidBody>

      {/* ================= PERIMETER COVE LIGHTING & BRUSHED BASEBOARDS ================= */}
      {/* Upper Wall Cove Light Strips */}
      <mesh position={[0, 6.22, -18.55]}>
        <boxGeometry args={[32.8, 0.06, 0.08]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>
      <mesh position={[-16.55, 6.22, -5]}>
        <boxGeometry args={[0.08, 0.06, 26.8]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>
      <mesh position={[16.55, 6.22, -5]}>
        <boxGeometry args={[0.08, 0.06, 26.8]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>
      <mesh position={[-9.75, 6.22, 8.05]}>
        <boxGeometry args={[13.2, 0.06, 0.08]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>
      <mesh position={[9.75, 6.22, 8.05]}>
        <boxGeometry args={[13.2, 0.06, 0.08]} />
        <meshBasicMaterial color="#bae6fd" />
      </mesh>

      {/* Brushed Metallic Architectural Baseboards across All Hall Walls */}
      <mesh position={[0, 0.14, -18.55]}>
        <boxGeometry args={[33.2, 0.28, 0.08]} />
        <meshStandardMaterial color="#273654" metalness={0.75} roughness={0.32} />
      </mesh>
      <mesh position={[-16.55, 0.14, -5]}>
        <boxGeometry args={[0.08, 0.28, 27.2]} />
        <meshStandardMaterial color="#273654" metalness={0.75} roughness={0.32} />
      </mesh>
      <mesh position={[16.55, 0.14, -5]}>
        <boxGeometry args={[0.08, 0.28, 27.2]} />
        <meshStandardMaterial color="#273654" metalness={0.75} roughness={0.32} />
      </mesh>

      {/* Subtle Corridor Floor Guiding Strips */}
      <mesh position={[-2.3, 0.015, 12.5]}>
        <boxGeometry args={[0.05, 0.015, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[2.3, 0.015, 12.5]}>
        <boxGeometry args={[0.05, 0.015, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {[12, 10, 8, 5, 2.5].map((z) => (
        <mesh key={`guide-${z}`} position={[0, 0.012, z]}>
          <boxGeometry args={[0.68, 0.01, 0.045]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.4} />
        </mesh>
      ))}

      <mesh position={[0, 0.015, -18.5]}>
        <boxGeometry args={[33, 0.015, 0.06]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* ================= CHAMFERED ARCHITECTURAL PILASTERS ================= */}
      {[-14, -9, -4, 1, 6].map((z) => (
        <group key={`left-pillar-${z}`} position={[-16.62, 3.25, z]}>
          <RoundedBox args={[0.18, 5.9, 0.42]} radius={0.03} smoothness={4} castShadow>
            <meshStandardMaterial color="#1b263d" metalness={0.55} roughness={0.38} />
          </RoundedBox>
          <mesh position={[0.095, 0, 0]}>
            <boxGeometry args={[0.02, 5.2, 0.05]} />
            <meshBasicMaterial color="#7dd3fc" />
          </mesh>
        </group>
      ))}

      {[-14, -9, -4, 1, 6].map((z) => (
        <group key={`right-pillar-${z}`} position={[16.62, 3.25, z]}>
          <RoundedBox args={[0.18, 5.9, 0.42]} radius={0.03} smoothness={4} castShadow>
            <meshStandardMaterial color="#1b263d" metalness={0.55} roughness={0.38} />
          </RoundedBox>
          <mesh position={[-0.095, 0, 0]}>
            <boxGeometry args={[0.02, 5.2, 0.05]} />
            <meshBasicMaterial color="#93c5fd" />
          </mesh>
        </group>
      ))}

      {/* Entrance Portal Archway */}
      <group position={[0, 3.25, 8.5]}>
        <RoundedBox position={[0, 2.8, 0]} args={[5.2, 0.42, 0.92]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color="#182236" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 2.58, 0]}>
          <boxGeometry args={[4.8, 0.04, 0.94]} />
          <meshBasicMaterial color="#bae6fd" />
        </mesh>
      </group>
    </group>
  );
};
