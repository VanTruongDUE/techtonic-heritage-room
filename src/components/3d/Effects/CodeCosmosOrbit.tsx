import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import { useReducedMotionPreference } from './AmbientMotion';

interface TechCosmosItem {
  label: string;
  category: 'LANG' | 'QUERY' | 'TOOL';
  color: string;
  glyph: string;
  radiusX: number;
  radiusY: number;
  radiusZ: number;
  speed: number;
  phase: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  scale: number;
}

const TECH_COSMOS_ITEMS: TechCosmosItem[] = [
  // Programming Languages
  { label: 'TypeScript', category: 'LANG', color: '#38bdf8', glyph: 'TS', radiusX: 4.1, radiusY: 1.05, radiusZ: 1.5, speed: 0.32, phase: 0.2, tiltX: 0.45, tiltY: 0.3, tiltZ: -0.25, scale: 0.88 },
  { label: 'Python', category: 'LANG', color: '#facc15', glyph: 'PY', radiusX: 3.7, radiusY: 1.25, radiusZ: 1.8, speed: -0.28, phase: 1.4, tiltX: -0.52, tiltY: 0.65, tiltZ: 0.38, scale: 0.9 },
  { label: 'JavaScript', category: 'LANG', color: '#fde047', glyph: 'JS', radiusX: 4.5, radiusY: 0.95, radiusZ: 1.35, speed: 0.24, phase: 2.5, tiltX: 0.28, tiltY: -0.58, tiltZ: 0.42, scale: 0.84 },
  { label: 'C++', category: 'LANG', color: '#60a5fa', glyph: 'C++', radiusX: 3.2, radiusY: 1.35, radiusZ: 1.65, speed: -0.35, phase: 3.7, tiltX: -0.38, tiltY: -0.4, tiltZ: -0.5, scale: 0.82 },
  { label: 'Java', category: 'LANG', color: '#fb7185', glyph: 'JV', radiusX: 4.7, radiusY: 1.1, radiusZ: 1.4, speed: 0.21, phase: 4.8, tiltX: 0.62, tiltY: 0.18, tiltZ: 0.35, scale: 0.8 },
  { label: 'Go', category: 'LANG', color: '#22d3ee', glyph: 'GO', radiusX: 2.9, radiusY: 1.15, radiusZ: 1.7, speed: 0.38, phase: 5.6, tiltX: -0.24, tiltY: 0.72, tiltZ: -0.32, scale: 0.78 },
  { label: 'C#', category: 'LANG', color: '#c084fc', glyph: 'C#', radiusX: 4.3, radiusY: 1.28, radiusZ: 1.55, speed: -0.25, phase: 0.9, tiltX: 0.5, tiltY: -0.32, tiltZ: -0.45, scale: 0.8 },

  // Query Languages
  { label: 'SQL', category: 'QUERY', color: '#00F0FF', glyph: 'DB', radiusX: 3.5, radiusY: 1.18, radiusZ: 1.65, speed: 0.34, phase: 2.0, tiltX: -0.6, tiltY: -0.22, tiltZ: 0.48, scale: 0.88 },
  { label: 'PostgreSQL', category: 'QUERY', color: '#7dd3fc', glyph: 'PG', radiusX: 4.8, radiusY: 0.92, radiusZ: 1.3, speed: -0.22, phase: 3.2, tiltX: 0.35, tiltY: 0.55, tiltZ: -0.28, scale: 0.86 },
  { label: 'GraphQL', category: 'QUERY', color: '#f472b6', glyph: 'GQL', radiusX: 3.9, radiusY: 1.32, radiusZ: 1.75, speed: 0.29, phase: 4.3, tiltX: -0.45, tiltY: 0.48, tiltZ: 0.52, scale: 0.84 },
  { label: 'MongoDB', category: 'QUERY', color: '#34d399', glyph: 'MDB', radiusX: 4.4, radiusY: 1.0, radiusZ: 1.45, speed: -0.31, phase: 5.2, tiltX: 0.42, tiltY: -0.68, tiltZ: 0.22, scale: 0.84 },

  // Tools & Frameworks
  { label: 'React', category: 'TOOL', color: '#67e8f9', glyph: '⚛', radiusX: 3.1, radiusY: 1.22, radiusZ: 1.55, speed: -0.36, phase: 0.55, tiltX: 0.58, tiltY: 0.25, tiltZ: -0.4, scale: 0.88 },
  { label: 'Docker', category: 'TOOL', color: '#38bdf8', glyph: '🐳', radiusX: 4.6, radiusY: 1.2, radiusZ: 1.5, speed: 0.26, phase: 1.85, tiltX: -0.32, tiltY: -0.62, tiltZ: -0.36, scale: 0.86 },
  { label: 'Git', category: 'TOOL', color: '#fb923c', glyph: '⌥', radiusX: 2.7, radiusY: 1.05, radiusZ: 1.4, speed: 0.41, phase: 2.95, tiltX: 0.48, tiltY: 0.44, tiltZ: 0.3, scale: 0.8 },
  { label: 'Three.js', category: 'TOOL', color: '#e2e8f0', glyph: '3D', radiusX: 3.8, radiusY: 1.3, radiusZ: 1.7, speed: -0.27, phase: 4.05, tiltX: -0.55, tiltY: -0.18, tiltZ: 0.58, scale: 0.84 },
  { label: 'Node.js', category: 'TOOL', color: '#4ade80', glyph: 'JS', radiusX: 4.9, radiusY: 1.08, radiusZ: 1.35, speed: 0.23, phase: 5.9, tiltX: 0.22, tiltY: 0.7, tiltZ: -0.44, scale: 0.82 },
  { label: 'PyTorch', category: 'TOOL', color: '#f97316', glyph: 'AI', radiusX: 3.4, radiusY: 1.26, radiusZ: 1.6, speed: -0.33, phase: 1.1, tiltX: -0.48, tiltY: 0.36, tiltZ: -0.54, scale: 0.82 },
  { label: 'Figma', category: 'TOOL', color: '#a855f7', glyph: 'FG', radiusX: 4.2, radiusY: 0.98, radiusZ: 1.5, speed: 0.3, phase: 3.55, tiltX: 0.64, tiltY: -0.45, tiltZ: 0.26, scale: 0.8 },
];

const COSMOS_RINGS: Array<{ radius: number; color: string; rot: [number, number, number]; speed: [number, number] }> = [
  { radius: 3.3, color: '#00F0FF', rot: [0.65, 0.35, 0.2], speed: [0.09, 0.14] },
  { radius: 4.1, color: '#a855f7', rot: [-0.55, 0.72, -0.3], speed: [-0.07, 0.11] },
  { radius: 4.8, color: '#38bdf8', rot: [0.28, -0.62, 0.55], speed: [0.06, -0.1] },
];

function createBadgeSpriteTexture(item: TechCosmosItem): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(256, 88, 2);
  if (ctx) {
    // Pill card body with neon accent border
    ctx.fillStyle = 'rgba(9, 16, 32, 0.92)';
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 76, 38);
    ctx.fill();

    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 76, 38);
    ctx.stroke();

    // Left circular tech glyph pill
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(44, 44, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06101f';
    ctx.font = '800 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.glyph, 44, 45);

    // Label + category micro-tag
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(item.label, 80, 44, 152);

    ctx.fillStyle = item.color;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    const catLabel =
      item.category === 'LANG' ? 'NGÔN NGỮ' : item.category === 'QUERY' ? 'TRUY VẤN' : 'CÔNG CỤ';
    ctx.fillText(catLabel, 80, 66);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 8, srgb: true });
}

/**
 * Undirected 3D cosmic cloud of programming languages, query languages, and engineering tools
 * orbiting dynamically around the central Dream It - Code It emblem.
 */
export const CodeCosmosOrbit: React.FC = () => {
  const reducedMotion = useReducedMotionPreference();
  const spriteRefs = useRef<Array<THREE.Sprite | null>>([]);
  const ringRefs = useRef<Array<THREE.Mesh | null>>([]);
  const starPointsRef = useRef<THREE.Points>(null);

  const badgeTextures = useMemo(
    () => TECH_COSMOS_ITEMS.map((item) => createBadgeSpriteTexture(item)),
    []
  );

  const starData = useMemo(() => {
    const count = 160;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00F0FF'),
      new THREE.Color('#a855f7'),
      new THREE.Color('#facc15'),
      new THREE.Color('#34d399'),
    ];
    let seed = 773123;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 1.6 + rand() * 3.8;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.35;
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.45;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.55;

      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { pos, col };
  }, []);

  const starSpriteTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.45, 'rgba(186,230,253,0.7)');
      g.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 48, 48);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => {
      badgeTextures.forEach((t) => t.dispose());
      starSpriteTex.dispose();
    };
  }, [badgeTextures, starSpriteTex]);

  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempEuler = useMemo(() => new THREE.Euler(), []);

  useFrame((state, delta) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;

    TECH_COSMOS_ITEMS.forEach((item, idx) => {
      const sprite = spriteRefs.current[idx];
      if (!sprite) return;

      const angle = item.phase + t * item.speed;
      // Organic 3D spherical/Lissajous drift across non-aligned inclined orbital planes
      const lx = Math.cos(angle) * item.radiusX;
      const ly = Math.sin(angle * 1.15 + item.phase * 0.5) * item.radiusY;
      const lz = Math.sin(angle) * item.radiusZ;

      tempVec.set(lx, ly, lz);
      tempEuler.set(
        item.tiltX + Math.sin(t * 0.12 + idx) * 0.08,
        item.tiltY + t * 0.04 * (idx % 2 === 0 ? 1 : -1),
        item.tiltZ
      );
      tempVec.applyEuler(tempEuler);

      // Keep badges gently clear of the lower Vision/Mission reading plane (stay around emblem & outer wings)
      const clampedY = Math.max(-0.55, tempVec.y);
      const clampedZ = Math.max(-1.35, Math.min(2.1, tempVec.z));
      sprite.position.set(tempVec.x, clampedY, clampedZ);
    });

    if (!reducedMotion) {
      ringRefs.current.forEach((ring, idx) => {
        if (!ring) return;
        const cfg = COSMOS_RINGS[idx];
        ring.rotation.x += delta * cfg.speed[0];
        ring.rotation.y += delta * cfg.speed[1];
      });
      if (starPointsRef.current) {
        starPointsRef.current.rotation.y += delta * 0.05;
        starPointsRef.current.rotation.z += delta * 0.02;
      }
    }
  });

  return (
    <group position={[0, 4.95, -16.75]}>
      {/* Inclined undirected cosmic orbital rings */}
      {COSMOS_RINGS.map((ring, idx) => (
        <mesh
          key={`cosmos-ring-${idx}`}
          ref={(el) => {
            ringRefs.current[idx] = el;
          }}
          rotation={ring.rot}
        >
          <torusGeometry args={[ring.radius, 0.008, 10, 96]} />
          <meshBasicMaterial color={ring.color} transparent opacity={0.2} toneMapped={false} />
        </mesh>
      ))}

      {/* Cosmic stardust particles */}
      <points ref={starPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starData.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[starData.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={starSpriteTex}
          vertexColors
          transparent
          opacity={0.62}
          size={0.075}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Free-floating Language, Query & Tool Badges */}
      {TECH_COSMOS_ITEMS.map((item, idx) => (
        <sprite
          key={item.label}
          ref={(el) => {
            spriteRefs.current[idx] = el;
          }}
          scale={[item.scale * 1.48, item.scale * 0.51, 1]}
        >
          <spriteMaterial
            map={badgeTextures[idx]}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
};
