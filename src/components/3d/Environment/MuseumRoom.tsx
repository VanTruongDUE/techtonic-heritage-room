import React, { useEffect, useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

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
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#121927';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.strokeStyle = '#1c263b';
      ctx.lineWidth = 2;
      const gridSize = 64;
      for (let x = 0; x <= 1024; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(512, 512, 380, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(512, 512, 420, 0, Math.PI * 2);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      floorTexture.dispose();
    };
  }, [floorTexture]);

  return (
    <group>
      {/* ================= FLOOR WITH PHYSICS ================= */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh position={[0, -0.05, -5]} receiveShadow>
          <boxGeometry args={[34, 0.1, 28]} />
          <meshStandardMaterial
            color="#101726"
            roughness={0.55}
            metalness={0.28}
            map={floorTexture}
          />
        </mesh>

        <mesh position={[0, -0.05, 12]} receiveShadow>
          <boxGeometry args={[6, 0.1, 10]} />
          <meshStandardMaterial
            color="#0e1422"
            roughness={0.55}
            metalness={0.3}
            map={floorTexture}
          />
        </mesh>
      </RigidBody>

      {/* ================= CEILING, COFFER PANELS & LIGHT FIXTURES ================= */}
      <mesh position={[0, 6.5, -3]}>
        <boxGeometry args={[36, 0.2, 40]} />
        <meshStandardMaterial color="#0d1320" roughness={0.75} metalness={0.15} />
      </mesh>

      {/* Architectural Ceiling Beams with Integrated Soft Light Channels */}
      {[-12, -7, -2, 3].map((z) => (
        <group key={`beam-${z}`} position={[0, 6.32, z]}>
          <mesh>
            <boxGeometry args={[32, 0.28, 0.44]} />
            <meshStandardMaterial color="#182236" metalness={0.5} roughness={0.45} />
          </mesh>
          {/* Recessed linear ceiling light strip (soft daylight white) */}
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

      {/* Recessed Ceiling Downlight Fixtures (Grid across corridor + hall) */}
      {CEILING_DOWNLIGHTS.map((pos, idx) => (
        <group key={`downlight-${idx}`} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.42, 0.12, 24]} />
            <meshStandardMaterial color="#1b263b" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3, 24]} />
            <meshBasicMaterial color="#eef6ff" />
          </mesh>
        </group>
      ))}

      {/* Aimed Gallery Track Spotlight Cans */}
      {TRACK_SPOTS.map((pos, idx) => (
        <group key={`trackspot-${idx}`} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.17, 0.24, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.11, 16]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}

      {/* ================= WALLS WITH RAPIER RIGIDBODIES ================= */}
      <RigidBody type="fixed">
        <mesh position={[0, 3.25, -19]} receiveShadow>
          <boxGeometry args={[34, 6.5, 0.8]} />
          <meshStandardMaterial color="#141c2d" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[-17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial color="#141d2e" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial color="#141d2e" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[-9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial color="#141d2e" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial color="#141d2e" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[-2.6, 3.25, 12.5]}>
          <boxGeometry args={[0.4, 6.5, 8]} />
          <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[2.6, 3.25, 12.5]}>
          <boxGeometry args={[0.4, 6.5, 8]} />
          <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh position={[0, 3.25, 16.5]}>
          <boxGeometry args={[5.6, 6.5, 0.4]} />
          <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* ================= PERIMETER COVE LIGHTING & ARCHITECTURAL TRIM ================= */}
      {/* Upper Wall Cove Light Strips (soft indirect wash, comfortable brightness) */}
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

      {/* Subtle Corridor Floor Guiding Strips */}
      <mesh position={[-2.3, 0.02, 12.5]}>
        <boxGeometry args={[0.06, 0.02, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[2.3, 0.02, 12.5]}>
        <boxGeometry args={[0.06, 0.02, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Floor Wayfinding Bars */}
      {[12, 10, 8, 5, 2.5].map((z) => (
        <mesh key={`guide-${z}`} position={[0, 0.015, z]}>
          <boxGeometry args={[0.7, 0.01, 0.05]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.45} />
        </mesh>
      ))}

      <mesh position={[0, 0.02, -18.5]}>
        <boxGeometry args={[33, 0.02, 0.08]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      <mesh position={[0, 0.2, -18.5]}>
        <boxGeometry args={[33, 0.4, 0.1]} />
        <meshStandardMaterial color="#1b2436" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* ================= ARCHITECTURAL ACCENT PILLARS & SOFT SCONCES ================= */}
      {[-14, -9, -4, 1, 6].map((z) => (
        <group key={`left-pillar-${z}`} position={[-16.8, 3.25, z]}>
          <mesh>
            <boxGeometry args={[0.12, 5.8, 0.4]} />
            <meshStandardMaterial color="#1a2438" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0.07, 0, 0]}>
            <boxGeometry args={[0.02, 5.2, 0.06]} />
            <meshBasicMaterial color="#7dd3fc" />
          </mesh>
        </group>
      ))}

      {[-14, -9, -4, 1, 6].map((z) => (
        <group key={`right-pillar-${z}`} position={[16.8, 3.25, z]}>
          <mesh>
            <boxGeometry args={[0.12, 5.8, 0.4]} />
            <meshStandardMaterial color="#1a2438" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-0.07, 0, 0]}>
            <boxGeometry args={[0.02, 5.2, 0.06]} />
            <meshBasicMaterial color="#93c5fd" />
          </mesh>
        </group>
      ))}

      {/* Entrance Portal Archway */}
      <group position={[0, 3.25, 8.5]}>
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[5.2, 0.4, 0.9]} />
          <meshStandardMaterial color="#182236" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.58, 0]}>
          <boxGeometry args={[4.8, 0.04, 0.92]} />
          <meshBasicMaterial color="#bae6fd" />
        </mesh>
      </group>
    </group>
  );
};
