import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import { useReducedMotionPreference } from './AmbientMotion';
import { useHeritageStore } from '../../../store/useHeritageStore';

interface TechBadgeDef {
  label: string;
  category: 'LANG' | 'QUERY' | 'TOOL';
  color: string;
  glyph: string;
}

interface OrbitRingDef {
  id: string;
  items: TechBadgeDef[];
  rx: number;
  ry: number;
  rz: number;
  speed: number;
  tilt: [number, number, number];
  ringColor: string;
}

const ORBIT_RINGS: OrbitRingDef[] = [
  {
    id: 'lang-ring',
    rx: 3.15,
    ry: 0.62,
    rz: 1.05,
    speed: 0.22,
    tilt: [0.22, 0.14, 0.12],
    ringColor: '#38bdf8',
    items: [
      { label: 'TypeScript', category: 'LANG', color: '#38bdf8', glyph: 'TS' },
      { label: 'Python', category: 'LANG', color: '#facc15', glyph: 'PY' },
      { label: 'JavaScript', category: 'LANG', color: '#fde047', glyph: 'JS' },
      { label: 'C++', category: 'LANG', color: '#60a5fa', glyph: 'C++' },
      { label: 'Java', category: 'LANG', color: '#fb7185', glyph: 'JV' },
      { label: 'Go', category: 'LANG', color: '#22d3ee', glyph: 'GO' },
      { label: 'C#', category: 'LANG', color: '#c084fc', glyph: 'C#' },
    ],
  },
  {
    id: 'query-ring',
    rx: 4.35,
    ry: 0.85,
    rz: 1.35,
    speed: -0.17,
    tilt: [-0.24, -0.18, -0.15],
    ringColor: '#00F0FF',
    items: [
      { label: 'SQL', category: 'QUERY', color: '#00F0FF', glyph: 'DB' },
      { label: 'PostgreSQL', category: 'QUERY', color: '#7dd3fc', glyph: 'PG' },
      { label: 'GraphQL', category: 'QUERY', color: '#f472b6', glyph: 'GQL' },
      { label: 'MongoDB', category: 'QUERY', color: '#34d399', glyph: 'MDB' },
    ],
  },
  {
    id: 'tool-ring',
    rx: 5.45,
    ry: 1.02,
    rz: 1.55,
    speed: 0.13,
    tilt: [0.1, -0.22, 0.16],
    ringColor: '#a855f7',
    items: [
      { label: 'React', category: 'TOOL', color: '#67e8f9', glyph: '⚛' },
      { label: 'Docker', category: 'TOOL', color: '#38bdf8', glyph: '🐳' },
      { label: 'Git', category: 'TOOL', color: '#fb923c', glyph: '⌥' },
      { label: 'Three.js', category: 'TOOL', color: '#e2e8f0', glyph: '3D' },
      { label: 'Node.js', category: 'TOOL', color: '#4ade80', glyph: 'JS' },
      { label: 'PyTorch', category: 'TOOL', color: '#f97316', glyph: 'AI' },
      { label: 'Figma', category: 'TOOL', color: '#a855f7', glyph: 'FG' },
    ],
  },
];

function createBadgeSpriteTexture(item: TechBadgeDef): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(256, 86, 2);
  if (ctx) {
    ctx.fillStyle = 'rgba(4, 9, 20, 0.96)';
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 74, 37);
    ctx.fill();

    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 74, 37);
    ctx.stroke();

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(43, 43, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06101f';
    ctx.font = '800 17px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.glyph, 43, 44);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 23px Inter, sans-serif';
    ctx.fillText(item.label, 76, 42, 156);

    ctx.fillStyle = item.color;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    const catLabel =
      item.category === 'LANG' ? 'NGÔN NGỮ' : item.category === 'QUERY' ? 'TRUY VẤN' : 'CÔNG CỤ';
    ctx.fillText(catLabel, 76, 64);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 8, srgb: true });
}

/**
 * Harmonious, collision-free 3-ring cosmic halo of programming languages, query languages,
 * and engineering tools orbiting cleanly around the Dream It - Code It emblem.
 */
export const CodeCosmosOrbit: React.FC = () => {
  const reducedMotion = useReducedMotionPreference();
  const isCenterWallCinemaActive = useHeritageStore((s) => s.isCenterWallCinemaActive);
  const spriteRefs = useRef<Array<THREE.Sprite | null>>([]);
  const starPointsRef = useRef<THREE.Points>(null);

  const flattenedItems = useMemo(() => {
    const result: Array<{
      item: TechBadgeDef;
      ring: OrbitRingDef;
      baseAngle: number;
      globalIdx: number;
    }> = [];
    let idx = 0;
    ORBIT_RINGS.forEach((ring) => {
      const step = (Math.PI * 2) / ring.items.length;
      ring.items.forEach((item, itemIdx) => {
        result.push({
          item,
          ring,
          baseAngle: itemIdx * step,
          globalIdx: idx++,
        });
      });
    });
    return result;
  }, []);

  const badgeTextures = useMemo(
    () => flattenedItems.map((entry) => createBadgeSpriteTexture(entry.item)),
    [flattenedItems]
  );

  const starData = useMemo(() => {
    const count = 120;
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
      const r = 2.0 + rand() * 3.8;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.45;
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.35;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.45;

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
  const ringEulers = useMemo(
    () => ORBIT_RINGS.map((r) => new THREE.Euler(r.tilt[0], r.tilt[1], r.tilt[2])),
    []
  );
  const ringEulerMap = useMemo(() => {
    const map = new Map<string, THREE.Euler>();
    ORBIT_RINGS.forEach((r, idx) => map.set(r.id, ringEulers[idx]));
    return map;
  }, [ringEulers]);

  useFrame((state, delta) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;

    flattenedItems.forEach((entry) => {
      const sprite = spriteRefs.current[entry.globalIdx];
      if (!sprite) return;

      const angle = entry.baseAngle + t * entry.ring.speed;
      const lx = Math.cos(angle) * entry.ring.rx;
      const ly = Math.sin(angle) * entry.ring.ry;
      const lz = Math.sin(angle) * entry.ring.rz;

      tempVec.set(lx, ly, lz);
      const euler = ringEulerMap.get(entry.ring.id);
      if (euler) tempVec.applyEuler(euler);

      // Keep clean clearance above Vision/Mission text & softly spaced around Emblem
      const finalY = Math.max(-0.62, tempVec.y);
      const finalZ = Math.max(-1.15, Math.min(1.65, tempVec.z));
      sprite.position.set(tempVec.x, finalY, finalZ);
    });

    if (!reducedMotion && starPointsRef.current) {
      starPointsRef.current.rotation.y += delta * 0.035;
    }
  });

  return (
    <group position={[0, 5.15, -16.85]} visible={!isCenterWallCinemaActive}>
      {/* 3 Clean Ordered Elliptical Orbital Guide Tracks */}
      {ORBIT_RINGS.map((ring) => (
        <group key={ring.id} rotation={ring.tilt} scale={[ring.rx, ring.ry, ring.rz]}>
          <mesh>
            <torusGeometry args={[1, 0.004, 8, 96]} />
            <meshBasicMaterial color={ring.ringColor} transparent opacity={0.18} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Subtle Stardust Field */}
      <points ref={starPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starData.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[starData.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={starSpriteTex}
          vertexColors
          transparent
          opacity={0.55}
          size={0.07}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Evenly Spaced Language, Query & Tool Badges */}
      {flattenedItems.map((entry) => (
        <sprite
          key={entry.item.label}
          ref={(el) => {
            spriteRefs.current[entry.globalIdx] = el;
          }}
          scale={[1.08, 0.365, 1]}
        >
          <spriteMaterial
            map={badgeTextures[entry.globalIdx]}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
};
