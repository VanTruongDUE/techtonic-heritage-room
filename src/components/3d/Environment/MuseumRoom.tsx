import React, { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import {
  createArchitecturalWallMaps,
  createBrushedMetalMaps,
  createFloorMaps,
  createLeatherMaps,
} from '../utils/proceduralMaterials';

const CEILING_DOWNLIGHTS: [number, number, number][] = [
  [0, 6.32, 26],
  [0, 6.32, 22],
  [0, 6.32, 18],
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

const TRACK_SPOTS: Array<{ pos: [number, number, number]; tilt: [number, number, number] }> = [
  { pos: [0, 6.18, -11], tilt: [0.42, 0, 0] },
  { pos: [-7.5, 6.18, -11.5], tilt: [0.45, -0.35, 0] },
  { pos: [7.5, 6.18, -11.5], tilt: [0.45, 0.35, 0] },
  { pos: [8.5, 6.18, -4], tilt: [0, 0, -0.52] },
  { pos: [-8.5, 6.18, -6], tilt: [0, 0, 0.52] },
  { pos: [-8.5, 6.18, 4], tilt: [0, 0, 0.52] },
  { pos: [6.0, 6.18, -12.5], tilt: [0.4, 0.25, 0] },
  { pos: [-5.2, 6.18, -8.2], tilt: [0.42, -0.38, 0] },
];

const ISLAND_CORNER_STANCHIONS: [number, number, number][] = [
  [-3.85, 0, -1.15],
  [3.85, 0, -1.15],
  [-3.85, 0, -8.85],
  [3.85, 0, -8.85],
];

const BENCH_POSITIONS: Array<{ pos: [number, number, number]; rotY: number }> = [
  { pos: [-5.8, 0, 2.2], rotY: 0.32 },
  { pos: [4.2, 0, 2.8], rotY: -0.42 },
];

export const MuseumRoom: React.FC = () => {
  const floorMaps = useMemo(() => createFloorMaps(), []);
  const wallMaps = useMemo(() => createArchitecturalWallMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);
  const leatherMaps = useMemo(() => createLeatherMaps(), []);

  useEffect(() => {
    return () => {
      floorMaps.map.dispose();
      floorMaps.roughnessMap.dispose();
      floorMaps.bumpMap.dispose();
      wallMaps.map.dispose();
      wallMaps.roughnessMap.dispose();
      wallMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
      leatherMaps.roughnessMap.dispose();
      leatherMaps.bumpMap.dispose();
    };
  }, [floorMaps, wallMaps, metalMaps, leatherMaps]);

  return (
    <group>
      {/* ================= HONED TERRAZZO FLOOR WITH PBR BUMP & SPECULAR ================= */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh position={[0, -0.05, -5]} receiveShadow>
          <boxGeometry args={[34, 0.1, 28]} />
          <meshStandardMaterial
            map={floorMaps.map}
            roughnessMap={floorMaps.roughnessMap}
            bumpMap={floorMaps.bumpMap}
            bumpScale={0.008}
            color="#d8e6f8"
            roughness={0.55}
            metalness={0.22}
            envMapIntensity={0.95}
          />
        </mesh>

        <mesh position={[0, -0.05, 18.5]} receiveShadow>
          <boxGeometry args={[6, 0.1, 20.4]} />
          <meshStandardMaterial
            map={floorMaps.map}
            roughnessMap={floorMaps.roughnessMap}
            bumpMap={floorMaps.bumpMap}
            bumpScale={0.008}
            color="#cfdcf0"
            roughness={0.58}
            metalness={0.2}
            envMapIntensity={0.85}
          />
        </mesh>
      </RigidBody>

      {/* ================= CEILING, COFFER BEAMS & GIMBAL TRACK LIGHTS ================= */}
      <mesh position={[0, 6.5, 5]}>
        <boxGeometry args={[36, 0.2, 52]} />
        <meshStandardMaterial color="#0b111d" roughness={0.78} metalness={0.18} />
      </mesh>

      {[-12, -7, -2, 3].map((z) => (
        <group key={`beam-${z}`} position={[0, 6.32, z]}>
          <RoundedBox args={[32, 0.28, 0.44]} radius={0.04} smoothness={4}>
            <meshStandardMaterial
              color="#192438"
              roughnessMap={metalMaps.roughnessMap}
              bumpMap={metalMaps.bumpMap}
              bumpScale={0.004}
              metalness={0.58}
              roughness={0.42}
            />
          </RoundedBox>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[28, 0.02, 0.14]} />
            <meshBasicMaterial color="#dbeafe" />
          </mesh>
        </group>
      ))}

      {/* Extended Entrance Tunnel Architectural Rib Arches & Linear Ceiling Strips */}
      {[26, 22, 18, 14, 10].map((tz) => (
        <group key={`tunnel-rib-${tz}`} position={[0, 6.26, tz]}>
          <RoundedBox args={[4.8, 0.24, 0.34]} radius={0.03} smoothness={4}>
            <meshStandardMaterial
              color="#1c2940"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.68}
              roughness={0.34}
            />
          </RoundedBox>
          <mesh position={[0, -0.13, 0]}>
            <boxGeometry args={[4.2, 0.02, 0.08]} />
            <meshBasicMaterial color="#bae6fd" />
          </mesh>
        </group>
      ))}
      <group position={[0, 6.35, 18.5]}>
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[0.14, 0.04, 19.2]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[0.14, 0.04, 19.2]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
      </group>

      {/* Recessed Ceiling Downlight Fixtures */}
      {CEILING_DOWNLIGHTS.map((pos, idx) => (
        <group key={`downlight-${idx}`} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.42, 0.12, 32]} />
            <meshStandardMaterial
              color="#2b3b5a"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.78}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 32]} />
            <meshBasicMaterial color="#eef6ff" />
          </mesh>
        </group>
      ))}

      {/* Aimed Gallery Track Spotlight Cans with Gimbal Yokes */}
      {TRACK_SPOTS.map((spot, idx) => (
        <group key={`trackspot-${idx}`} position={spot.pos}>
          {/* Ceiling track rail stem */}
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.22, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
          </mesh>
          <group rotation={spot.tilt}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.16, 0.28, 24]} />
              <meshStandardMaterial
                color="#334155"
                roughnessMap={metalMaps.roughnessMap}
                metalness={0.85}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, -0.145, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.11, 24]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          </group>
        </group>
      ))}

      {/* ================= ARCHITECTURAL WALLS WITH PLASTER TEXTURE & PHYSICS ================= */}
      <RigidBody type="fixed">
        <mesh position={[0, 3.25, -19]} receiveShadow>
          <boxGeometry args={[34, 6.5, 0.8]} />
          <meshStandardMaterial
            map={wallMaps.map}
            roughnessMap={wallMaps.roughnessMap}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.012}
            color="#d8e3f4"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>

        <mesh position={[-17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial
            map={wallMaps.map}
            roughnessMap={wallMaps.roughnessMap}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.012}
            color="#d8e3f4"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>

        <mesh position={[17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial
            map={wallMaps.map}
            roughnessMap={wallMaps.roughnessMap}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.012}
            color="#d8e3f4"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>

        <mesh position={[-9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial
            map={wallMaps.map}
            roughnessMap={wallMaps.roughnessMap}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.012}
            color="#d8e3f4"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>

        <mesh position={[9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial
            map={wallMaps.map}
            roughnessMap={wallMaps.roughnessMap}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.012}
            color="#d8e3f4"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>

        <mesh position={[-2.6, 3.25, 18.5]} receiveShadow>
          <boxGeometry args={[0.4, 6.5, 20.4]} />
          <meshStandardMaterial
            map={wallMaps.map}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.01}
            color="#cfdcf0"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>

        <mesh position={[2.6, 3.25, 18.5]} receiveShadow>
          <boxGeometry args={[0.4, 6.5, 20.4]} />
          <meshStandardMaterial
            map={wallMaps.map}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.01}
            color="#cfdcf0"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>

        <mesh position={[0, 3.25, 28.7]}>
          <boxGeometry args={[5.6, 6.5, 0.4]} />
          <meshStandardMaterial
            map={wallMaps.map}
            bumpMap={wallMaps.bumpMap}
            bumpScale={0.01}
            color="#cfdcf0"
            roughness={0.68}
            metalness={0.14}
          />
        </mesh>
      </RigidBody>

      {/* ================= SCULPTURAL ENTRANCE THRESHOLD PORTAL ================= */}
      <group position={[0, 0, 8.5]}>
        {[-2.42, 2.42].map((px) => (
          <group key={`portal-col-${px}`} position={[px, 2.8, 0]}>
            <RoundedBox args={[0.24, 5.6, 0.56]} radius={0.03} smoothness={4} castShadow>
              <meshStandardMaterial
                color="#1f2d47"
                roughnessMap={metalMaps.roughnessMap}
                metalness={0.78}
                roughness={0.28}
              />
            </RoundedBox>
            <mesh position={[px > 0 ? -0.125 : 0.125, 0, 0]}>
              <boxGeometry args={[0.02, 5.2, 0.06]} />
              <meshBasicMaterial color="#7dd3fc" />
            </mesh>
          </group>
        ))}
        <RoundedBox position={[0, 5.55, 0]} args={[5.1, 0.34, 0.58]} radius={0.03} smoothness={4}>
          <meshStandardMaterial
            color="#1f2d47"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.78}
            roughness={0.28}
          />
        </RoundedBox>
        <mesh position={[0, 5.37, 0]}>
          <boxGeometry args={[4.6, 0.025, 0.08]} />
          <meshBasicMaterial color="#bae6fd" />
        </mesh>
      </group>

      {/* ================= PERIMETER COVE LIGHTING & BRUSHED BASEBOARDS ================= */}
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
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-16.55, 0.14, -5]}>
        <boxGeometry args={[0.08, 0.28, 27.2]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[16.55, 0.14, -5]}>
        <boxGeometry args={[0.08, 0.28, 27.2]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Tunnel Brushed Baseboards & Corridor Floor Guiding Strips */}
      <mesh position={[-2.38, 0.14, 18.5]}>
        <boxGeometry args={[0.06, 0.28, 20]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[2.38, 0.14, 18.5]}>
        <boxGeometry args={[0.06, 0.28, 20]} />
        <meshStandardMaterial
          color="#2b3b5a"
          roughnessMap={metalMaps.roughnessMap}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[-2.3, 0.015, 18.5]}>
        <boxGeometry args={[0.05, 0.015, 20]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[2.3, 0.015, 18.5]}>
        <boxGeometry args={[0.05, 0.015, 20]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {[25.5, 23, 20.5, 18, 15.5, 13, 10.5, 8, 5, 2.5].map((z) => (
        <mesh key={`guide-${z}`} position={[0, 0.012, z]}>
          <boxGeometry args={[0.68, 0.01, 0.045]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.42} />
        </mesh>
      ))}

      <mesh position={[0, 0.015, -18.5]}>
        <boxGeometry args={[33, 0.015, 0.06]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* ================= MUSEUM CORNER STANCHION BOLLARDS AROUND CENTRAL ISLAND ================= */}
      {ISLAND_CORNER_STANCHIONS.map((pos, idx) => (
        <group key={`stanchion-${idx}`} position={pos}>
          {/* Weighted brushed-steel base */}
          <mesh position={[0, 0.025, 0]} receiveShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.05, 32]} />
            <meshStandardMaterial
              color="#94a3b8"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.9}
              roughness={0.22}
            />
          </mesh>
          {/* Vertical post */}
          <mesh position={[0, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.028, 0.82, 20]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
          </mesh>
          {/* Crown finial sphere */}
          <mesh position={[0, 0.87, 0]}>
            <sphereGeometry args={[0.042, 20, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
          </mesh>
          {/* Subtle cyan collar accent */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.02, 20]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* ================= SCULPTED LEATHER & TITANIUM MUSEUM BENCHES ================= */}
      {BENCH_POSITIONS.map((bench, idx) => (
        <RigidBody
          key={`museum-bench-${idx}`}
          type="fixed"
          position={bench.pos}
          rotation={[0, bench.rotY, 0]}
        >
          {/* Left & Right Brushed Steel Frame Legs */}
          {[-0.95, 0.95].map((lx) => (
            <group key={`bench-leg-${lx}`} position={[lx, 0.21, 0]}>
              <RoundedBox args={[0.08, 0.42, 0.62]} radius={0.015} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial
                  color="#64748b"
                  roughnessMap={metalMaps.roughnessMap}
                  metalness={0.86}
                  roughness={0.24}
                />
              </RoundedBox>
            </group>
          ))}
          {/* Center Under-frame Spine */}
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[1.9, 0.06, 0.22]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Tufted Leather Seat Cushion */}
          <RoundedBox position={[0, 0.47, 0]} args={[2.28, 0.13, 0.7]} radius={0.045} smoothness={6} castShadow receiveShadow>
            <meshStandardMaterial
              color="#192842"
              roughnessMap={leatherMaps.roughnessMap}
              bumpMap={leatherMaps.bumpMap}
              bumpScale={0.01}
              roughness={0.62}
              metalness={0.12}
            />
          </RoundedBox>
          {/* Decorative Center Seam Stitch */}
          <mesh position={[0, 0.537, 0]}>
            <boxGeometry args={[0.015, 0.008, 0.68]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </RigidBody>
      ))}

      {/* ================= CHAMFERED ARCHITECTURAL PILASTERS ================= */}
      {[-18.1, -11.9, -4, 1, 6].map((z) => (
        <group key={`left-pillar-${z}`} position={[-16.62, 3.25, z]}>
          <RoundedBox args={[0.18, 5.9, 0.42]} radius={0.03} smoothness={4} castShadow>
            <meshStandardMaterial
              color="#1d2942"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.6}
              roughness={0.35}
            />
          </RoundedBox>
          <mesh position={[0.095, 0, 0]}>
            <boxGeometry args={[0.02, 5.2, 0.05]} />
            <meshBasicMaterial color="#7dd3fc" />
          </mesh>
        </group>
      ))}

      {[-18.1, -11.9, -4, 1, 6].map((z) => (
        <group key={`right-pillar-${z}`} position={[16.62, 3.25, z]}>
          <RoundedBox args={[0.18, 5.9, 0.42]} radius={0.03} smoothness={4} castShadow>
            <meshStandardMaterial
              color="#1d2942"
              roughnessMap={metalMaps.roughnessMap}
              metalness={0.6}
              roughness={0.35}
            />
          </RoundedBox>
          <mesh position={[-0.095, 0, 0]}>
            <boxGeometry args={[0.02, 5.2, 0.05]} />
            <meshBasicMaterial color="#93c5fd" />
          </mesh>
        </group>
      ))}
    </group>
  );
};
