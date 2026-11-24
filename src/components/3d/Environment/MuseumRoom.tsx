import React, { useEffect, useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const SPOT_FIXTURES: [number, number, number][] = [
  [0, 6.26, -11],
  [-8, 6.26, -12],
  [8, 6.26, -12],
  [0, 6.26, -5],
  [8, 6.26, -4],
  [-8, 6.26, -4],
  [6, 6.26, -13],
];

export const MuseumRoom: React.FC = () => {
  // Procedural floor tile texture canvas
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.strokeStyle = '#121824';
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

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
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
        {/* Main Hall Floor: 34m x 28m */}
        <mesh position={[0, -0.05, -5]} receiveShadow>
          <boxGeometry args={[34, 0.1, 28]} />
          <meshStandardMaterial
            color="#080b11"
            roughness={0.25}
            metalness={0.7}
            map={floorTexture}
          />
        </mesh>

        {/* Entrance Corridor Floor: 6m x 10m */}
        <mesh position={[0, -0.05, 12]} receiveShadow>
          <boxGeometry args={[6, 0.1, 10]} />
          <meshStandardMaterial
            color="#06080d"
            roughness={0.3}
            metalness={0.8}
            map={floorTexture}
          />
        </mesh>
      </RigidBody>

      {/* ================= CEILING & SPOTLIGHT FIXTURES ================= */}
      <mesh position={[0, 6.5, -3]}>
        <boxGeometry args={[36, 0.2, 40]} />
        <meshStandardMaterial color="#040608" roughness={0.9} metalness={0.2} />
      </mesh>

      {[-12, -7, -2, 3].map((z) => (
        <mesh key={z} position={[0, 6.35, z]}>
          <boxGeometry args={[32, 0.3, 0.4]} />
          <meshStandardMaterial color="#0e131d" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {SPOT_FIXTURES.map((pos, idx) => (
        <group key={`fixture-${idx}`} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.18, 0.24, 16]} />
            <meshStandardMaterial color="#151b28" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 16]} />
            <meshBasicMaterial color="#99f6ff" />
          </mesh>
        </group>
      ))}

      {/* ================= WALLS WITH RAPIER RIGIDBODIES ================= */}
      <RigidBody type="fixed">
        <mesh position={[0, 3.25, -19]} receiveShadow>
          <boxGeometry args={[34, 6.5, 0.8]} />
          <meshStandardMaterial color="#0b0e16" roughness={0.4} metalness={0.5} />
        </mesh>

        <mesh position={[-17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial color="#0c0f18" roughness={0.4} metalness={0.5} />
        </mesh>

        <mesh position={[17, 3.25, -5]} receiveShadow>
          <boxGeometry args={[0.8, 6.5, 28]} />
          <meshStandardMaterial color="#0c0f18" roughness={0.4} metalness={0.5} />
        </mesh>

        <mesh position={[-9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial color="#0c0f18" roughness={0.4} metalness={0.5} />
        </mesh>

        <mesh position={[9.75, 3.25, 8.5]} receiveShadow>
          <boxGeometry args={[14.5, 6.5, 0.8]} />
          <meshStandardMaterial color="#0c0f18" roughness={0.4} metalness={0.5} />
        </mesh>

        <mesh position={[-2.6, 3.25, 12.5]}>
          <boxGeometry args={[0.4, 6.5, 8]} />
          <meshStandardMaterial color="#090c13" roughness={0.5} metalness={0.4} />
        </mesh>

        <mesh position={[2.6, 3.25, 12.5]}>
          <boxGeometry args={[0.4, 6.5, 8]} />
          <meshStandardMaterial color="#090c13" roughness={0.5} metalness={0.4} />
        </mesh>

        <mesh position={[0, 3.25, 16.5]}>
          <boxGeometry args={[5.6, 6.5, 0.4]} />
          <meshStandardMaterial color="#090c13" roughness={0.5} metalness={0.4} />
        </mesh>
      </RigidBody>

      {/* ================= ARCHITECTURAL NEON GLOW STRIPS ================= */}
      <mesh position={[-2.3, 0.02, 12.5]}>
        <boxGeometry args={[0.08, 0.02, 8]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>
      <mesh position={[2.3, 0.02, 12.5]}>
        <boxGeometry args={[0.08, 0.02, 8]} />
        <meshBasicMaterial color="#0066FF" />
      </mesh>

      {/* Subtle Floor Wayfinding Light Bars from Entrance toward Hall */}
      {[12, 10, 8, 5, 2.5].map((z) => (
        <mesh key={`guide-${z}`} position={[0, 0.015, z]}>
          <boxGeometry args={[0.8, 0.01, 0.06]} />
          <meshBasicMaterial color="#00F0FF" transparent opacity={0.45} />
        </mesh>
      ))}

      <mesh position={[0, 0.02, -18.5]}>
        <boxGeometry args={[33, 0.02, 0.1]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>

      <mesh position={[0, 0.2, -18.5]}>
        <boxGeometry args={[33, 0.4, 0.1]} />
        <meshStandardMaterial color="#141a29" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ================= ARCHITECTURAL ACCENT PILLARS & NEON BARS ================= */}
      {[-14, -9, -4, 1, 6].map((z) => (
        <group key={`left-pillar-${z}`} position={[-16.8, 3.25, z]}>
          <mesh>
            <boxGeometry args={[0.1, 5.8, 0.4]} />
            <meshStandardMaterial color="#121828" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.06, 0, 0]}>
            <boxGeometry args={[0.02, 5.4, 0.08]} />
            <meshBasicMaterial color="#00F0FF" />
          </mesh>
        </group>
      ))}

      {[-14, -9, -4, 1, 6].map((z) => (
        <group key={`right-pillar-${z}`} position={[16.8, 3.25, z]}>
          <mesh>
            <boxGeometry args={[0.1, 5.8, 0.4]} />
            <meshStandardMaterial color="#121828" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.06, 0, 0]}>
            <boxGeometry args={[0.02, 5.4, 0.08]} />
            <meshBasicMaterial color="#0066FF" />
          </mesh>
        </group>
      ))}

      {/* Entrance Portal Archway */}
      <group position={[0, 3.25, 8.5]}>
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[5.2, 0.4, 0.9]} />
          <meshStandardMaterial color="#0c121e" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.58, 0]}>
          <boxGeometry args={[4.8, 0.04, 0.92]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </group>
    </group>
  );
};
