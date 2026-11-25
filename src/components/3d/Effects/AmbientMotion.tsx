import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import type { HoverPreview } from '../../../types/heritage';

export function useReducedMotionPreference(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Subtle atmospheric light-motes drifting through the museum hall
 * (adapted from techtonic-website ParticleField with restrained count & opacity).
 */
export const HallParticleField: React.FC = () => {
  const reducedMotion = useReducedMotionPreference();
  const pointsRef = useRef<THREE.Points>(null);
  const count = reducedMotion ? 45 : 130;

  const { positions, colors } = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00F5FF'),
      new THREE.Color('#38e8ff'),
      new THREE.Color('#c864ff'),
    ];
    let seed = 20250409;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 30;
      arr[i * 3 + 1] = 0.8 + rand() * 5.0;
      arr[i * 3 + 2] = -17 + rand() * 44;

      const c = palette[i % palette.length];
      colArr[i * 3] = c.r;
      colArr[i * 3 + 1] = c.g;
      colArr[i * 3 + 2] = c.b;
    }
    return { positions: arr, colors: colArr };
  }, [count]);

  // Smooth circular radial glow sprite so particles never render as hard squares
  const spriteTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255, 255, 255, 1)');
      g.addColorStop(0.35, 'rgba(186, 230, 253, 0.75)');
      g.addColorStop(0.7, 'rgba(56, 189, 248, 0.2)');
      g.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => {
      spriteTexture.dispose();
    };
  }, [spriteTexture]);

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={spriteTexture}
        vertexColors
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.56}
        size={0.08}
        sizeAttenuation
        transparent
      />
    </points>
  );
};

interface OrgNodeConfig {
  id: string;
  color: string;
  position: [number, number, number];
  size: number;
}

const CENTER_NODE: OrgNodeConfig = {
  id: 'bcn',
  color: '#a855f7',
  position: [0, 0.15, 0],
  size: 0.34,
};

const DEPT_NODES: OrgNodeConfig[] = [
  { id: 'events', color: '#ef4444', position: [-1.45, 0.55, 0.12], size: 0.24 },
  { id: 'hr', color: '#eab308', position: [-0.8, -0.75, 0.2], size: 0.24 },
  { id: 'media', color: '#22c55e', position: [0.8, -0.75, -0.1], size: 0.24 },
  { id: 'tech', color: '#f97316', position: [1.45, 0.55, 0.05], size: 0.24 },
  { id: 'advisor', color: '#3b82f6', position: [0, -1.1, 0], size: 0.2 },
];

const ORG_PREVIEW: HoverPreview = {
  title: 'Mô Hình Tổ Chức TechTonic Club',
  badge: '3 Quản lý • 27 TV 4 Ban • 45+ TV Tự do',
  summary:
    'Hệ sinh thái tổ chức gồm Ban Chủ Nhiệm điều hành, 4 Ban chức năng, Cố vấn học thuật (sinh viên & giảng viên) và cộng đồng thành viên tự do.',
  bullets: [
    'Ban Chuyên Môn (8 TV) • Ban Sự Kiện (7 TV)',
    'Ban Truyền Thông (9 TV) • Ban Nhân Sự (3 TV)',
    '45+ Thành viên tự do: FE, BE, AI & Data, Product Team',
  ],
  actionLabel: 'Mở danh sách Ban Chủ Nhiệm 3 nhiệm kỳ',
};

/**
 * Floating 3D organizational constellation above Central Island
 * (adapted from techtonic-website DepartmentsHeroScene, elevated cleanly above eye-level).
 */
export const OrgConstellationOrbit: React.FC = () => {
  const reducedMotion = useReducedMotionPreference();
  const { setHoveringInteractive, openModal } = useHeritageStore();
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<Array<THREE.Group | null>>([]);
  const [hovered, setHovered] = useState(false);

  const connections = useMemo(() => {
    return DEPT_NODES.map((target) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          new Float32Array([...CENTER_NODE.position, ...target.position]),
          3
        )
      );
      const material = new THREE.LineBasicMaterial({
        color: '#a855f7',
        transparent: true,
        opacity: 0.24,
      });
      return new THREE.Line(geometry, material);
    });
  }, []);

  useEffect(() => {
    return () => {
      connections.forEach((line) => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
    };
  }, [connections]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (hovered ? 0.28 : 0.12);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.09;
    }
    DEPT_NODES.forEach((node, idx) => {
      const ref = nodeRefs.current[idx];
      if (ref) {
        ref.position.y = node.position[1] + Math.sin(t * 1.1 + idx * 0.8) * 0.055;
      }
    });
  });

  const handleOpen = () => openModal('shirt');

  return (
    <group
      position={[0, 4.35, -5]}
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveringInteractive(true, 'Xem Cơ cấu & Ban Chủ Nhiệm', handleOpen, ORG_PREVIEW);
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveringInteractive(false);
      }}
    >
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.14} enabled={!reducedMotion}>
        <group ref={groupRef}>
          {/* Orbit rings */}
          <group ref={ringRef} rotation={[0.38, 0, 0]}>
            <mesh>
              <torusGeometry args={[1.95, 0.009, 12, 96]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={hovered ? 0.38 : 0.16} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[2.12, 0.008, 12, 96]} />
              <meshBasicMaterial color="#a855f7" transparent opacity={hovered ? 0.34 : 0.14} />
            </mesh>
          </group>

          {/* Connection lines */}
          {connections.map((line, idx) => (
            <primitive key={`org-line-${idx}`} object={line} />
          ))}

          {/* Center BCN Node */}
          <group position={CENTER_NODE.position}>
            <mesh>
              <octahedronGeometry args={[CENTER_NODE.size, 0]} />
              <meshStandardMaterial
                color={CENTER_NODE.color}
                emissive={CENTER_NODE.color}
                emissiveIntensity={hovered ? 0.65 : 0.3}
                transparent
                opacity={0.75}
                roughness={0.25}
                metalness={0.5}
              />
            </mesh>
            <mesh>
              <octahedronGeometry args={[CENTER_NODE.size * 1.06, 0]} />
              <meshBasicMaterial color={CENTER_NODE.color} wireframe transparent opacity={0.55} />
            </mesh>
          </group>

          {/* Department & Advisor Nodes */}
          {DEPT_NODES.map((node, idx) => (
            <group
              key={node.id}
              ref={(el) => {
                nodeRefs.current[idx] = el;
              }}
              position={node.position}
            >
              <mesh>
                <boxGeometry args={[node.size, node.size * 0.72, node.size * 0.45]} />
                <meshBasicMaterial color={node.color} transparent opacity={0.35} />
              </mesh>
              <mesh>
                <boxGeometry args={[node.size, node.size * 0.72, node.size * 0.45]} />
                <meshBasicMaterial color={node.color} wireframe transparent opacity={0.75} />
              </mesh>
            </group>
          ))}
        </group>
      </Float>
    </group>
  );
};
