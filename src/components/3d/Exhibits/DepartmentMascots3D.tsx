import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps, createMarbleMaps } from '../utils/proceduralMaterials';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { Department, HoverPreview } from '../../../types/heritage';

type EmblemKind = 'owl' | 'phoenix' | 'fox' | 'camera' | 'crown';

interface DeptEmblemConfig {
  id: string;
  dept: Department;
  kind: EmblemKind;
  isMascot: boolean;
  position: [number, number, number];
  rotationY: number;
  badge: string;
  title: string;
  subtitle: string;
  accent: string;
  secondary: string;
  description: string;
}

const CURRENT_TERM = 'Nhiệm kỳ 2026 - 2027';

/**
 * 5 custom 3D Department Mascots (animated living creatures) & Rotating Artifacts
 * positioned cleanly beside each of the 5 Department stages with zero collision
 * against portraits, team photo pedestals, benches, or room walls.
 */
const DEPT_EMBLEMS: DeptEmblemConfig[] = [
  {
    id: 'emblem-bcm-owl',
    dept: 'Ban Chuyên Môn',
    kind: 'owl',
    isMascot: true,
    position: [-14.87, 0, -12.95],
    rotationY: Math.PI / 2,
    badge: 'LINH THÚ • BAN CHUYÊN MÔN',
    title: 'Cú Công Nghệ (Cyber Owl)',
    subtitle: 'Trí tuệ • Tư duy sâu • Bền bỉ đêm khuya',
    accent: '#fb923c',
    secondary: '#00F5FF',
    description:
      'Linh thú biểu trưng cho sự minh mẫn, tinh thần ham học hỏi, tư duy thuật toán sắc bén và những đêm miệt mài code dự án của Ban Chuyên Môn.',
  },
  {
    id: 'emblem-bsk-phoenix',
    dept: 'Ban Sự Kiện',
    kind: 'phoenix',
    isMascot: true,
    position: [14.87, 0, -12.95],
    rotationY: -Math.PI / 2,
    badge: 'LINH THÚ • BAN SỰ KIỆN',
    title: 'Phượng Hoàng Sân Khấu',
    subtitle: 'Bùng nổ • Sáng tạo • Tỏa sáng',
    accent: '#c084fc',
    secondary: '#f472b6',
    description:
      'Linh thú Phượng Hoàng rực rỡ tượng trưng cho năng lượng bùng nổ, tinh thần kiến tạo những sân khấu công nghệ ấn tượng như TechXplore & TechWare.',
  },
  {
    id: 'emblem-bns-fox',
    dept: 'Ban Nhân Sự',
    kind: 'fox',
    isMascot: true,
    position: [2.95, 0, 6.4],
    rotationY: Math.PI,
    badge: 'LINH THÚ • BAN NHÂN SỰ',
    title: 'Cáo Kết Nối (Cyber Fox)',
    subtitle: 'Khéo léo • Ấm áp • Gắn kết cộng đồng',
    accent: '#34d399',
    secondary: '#a7f3d0',
    description:
      'Linh thú Cáo linh hoạt, tinh tế và thân thiện — biểu trưng cho sự chu đáo, gắn kết thành viên và vận hành hậu cần vững vàng của Ban Nhân Sự.',
  },
  {
    id: 'emblem-btt-camera',
    dept: 'Ban Truyền Thông',
    kind: 'camera',
    isMascot: false,
    position: [-3.55, 0, 6.35],
    rotationY: Math.PI,
    badge: 'VẬT PHẨM • BAN TRUYỀN THÔNG',
    title: 'Máy Quay Điện Ảnh 3D',
    subtitle: 'Góc nhìn sáng tạo • Lan tỏa hình ảnh',
    accent: '#38bdf8',
    secondary: '#00F5FF',
    description:
      'Vật phẩm biểu tượng của Ban Truyền Thông — lưu giữ từng khung hình thanh xuân, sản xuất ấn phẩm truyền thông và đưa thương hiệu TechTonic vươn xa.',
  },
  {
    id: 'emblem-bcn-crown',
    dept: 'Ban Chủ Nhiệm',
    kind: 'crown',
    isMascot: false,
    position: [15.95, 0, 6.9],
    rotationY: Math.PI - 0.35,
    badge: 'VẬT PHẨM • BAN CHỦ NHIỆM',
    title: 'Vương Miện & La Bàn Định Hướng',
    subtitle: 'Dẫn dắt • Tầm nhìn • Chiến lược',
    accent: '#fbbf24',
    secondary: '#00F5FF',
    description:
      'Vương miện hoàng kim lồng trong la bàn con quay định hướng — biểu tượng cho vai trò lãnh đạo, kết nối 4 Ban và định vị tầm nhìn phát triển CLB.',
  },
];

function createEmblemPlaqueTexture(cfg: DeptEmblemConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(448, 148, 1.5);
  if (ctx) {
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, 448, 148);

    ctx.strokeStyle = cfg.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 440, 140);

    ctx.fillStyle = cfg.accent;
    ctx.fillRect(4, 4, 440, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.accent;
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillText(cfg.badge, 224, 38, 412);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(cfg.title, 224, 80, 412);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillText(cfg.subtitle, 224, 118, 412);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

/* ================= 1. LIVING ANIMATED MASCOT: CYBER OWL (BAN CHUYÊN MÔN) ================= */
const CyberOwlMascot: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Gentle lifelike breathing bob
    if (bodyRef.current) {
      bodyRef.current.position.y = 1.18 + Math.sin(t * 2.2) * 0.018;
      const targetScale = hovered ? 1.09 : 1.0;
      bodyRef.current.scale.setScalar(THREE.MathUtils.lerp(bodyRef.current.scale.x, targetScale, dt * 7));
    }

    // Curious owl head turn & tilt
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.85) * 0.42;
      headRef.current.rotation.z = Math.sin(t * 1.3 + 0.5) * 0.09;
      headRef.current.rotation.x = Math.cos(t * 0.7) * 0.06;
    }

    // Periodic wing spread & subtle flutter
    const cycle = t % 4.5;
    const flap = cycle < 0.9 ? Math.sin((cycle / 0.9) * Math.PI * 2) * 0.34 : Math.sin(t * 2.2) * 0.04;
    if (leftWingRef.current) leftWingRef.current.rotation.z = 0.14 + Math.abs(flap) * 0.95;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -0.14 - Math.abs(flap) * 0.95;

    // Natural periodic blink every ~3.6s
    const blinkCycle = t % 3.6;
    const eyeScaleY = blinkCycle > 3.42 ? 0.12 : 1.0;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;
  });

  return (
    <group>
      {/* Glowing Perch Bar */}
      <mesh position={[0, 1.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.34, 14]} />
        <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.026, 0.026, 0.14, 14]} />
        <meshBasicMaterial color="#fb923c" toneMapped={false} />
      </mesh>

      <group ref={bodyRef} position={[0, 1.18, 0]}>
        {/* Sculpted Owl Torso */}
        <mesh position={[0, 0.14, 0]} scale={[0.88, 1.12, 0.84]}>
          <sphereGeometry args={[0.2, 24, 20]} />
          <meshStandardMaterial color="#1b2a46" metalness={0.48} roughness={0.34} />
        </mesh>
        {/* Warm Feather Chest Plastron */}
        <mesh position={[0, 0.12, 0.13]} scale={[0.72, 0.95, 0.48]}>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.55} metalness={0.12} />
        </mesh>
        {/* Neon Orange Tech Chest Emblem */}
        <mesh position={[0, 0.14, 0.205]}>
          <octahedronGeometry args={[0.036, 0]} />
          <meshBasicMaterial color="#fb923c" toneMapped={false} />
        </mesh>

        {/* Tail Feathers */}
        <mesh position={[0, -0.02, -0.17]} rotation={[0.45, 0, 0]}>
          <coneGeometry args={[0.1, 0.24, 6]} />
          <meshStandardMaterial color="#121e36" metalness={0.55} roughness={0.3} />
        </mesh>

        {/* Talons gripping perch */}
        {[-0.07, 0.07].map((tx, i) => (
          <mesh key={`talon-${i}`} position={[tx, -0.09, 0.02]}>
            <cylinderGeometry args={[0.018, 0.026, 0.1, 8]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.78} roughness={0.28} />
          </mesh>
        ))}

        {/* Articulated Left & Right Wings */}
        <group ref={leftWingRef} position={[-0.17, 0.22, -0.01]}>
          <mesh position={[-0.05, -0.12, 0]} scale={[0.38, 1.15, 0.72]}>
            <sphereGeometry args={[0.16, 16, 14]} />
            <meshStandardMaterial color="#14223b" metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[-0.08, -0.13, 0.02]}>
            <boxGeometry args={[0.014, 0.24, 0.024]} />
            <meshBasicMaterial color="#fb923c" toneMapped={false} />
          </mesh>
        </group>

        <group ref={rightWingRef} position={[0.17, 0.22, -0.01]}>
          <mesh position={[0.05, -0.12, 0]} scale={[0.38, 1.15, 0.72]}>
            <sphereGeometry args={[0.16, 16, 14]} />
            <meshStandardMaterial color="#14223b" metalness={0.55} roughness={0.28} />
          </mesh>
          <mesh position={[0.08, -0.13, 0.02]}>
            <boxGeometry args={[0.014, 0.24, 0.024]} />
            <meshBasicMaterial color="#fb923c" toneMapped={false} />
          </mesh>
        </group>

        {/* Articulated Owl Head */}
        <group ref={headRef} position={[0, 0.39, 0.02]}>
          <mesh scale={[1.05, 0.92, 0.96]}>
            <sphereGeometry args={[0.155, 22, 18]} />
            <meshStandardMaterial color="#1e3154" metalness={0.46} roughness={0.32} />
          </mesh>
          {/* Facial Disc Rings */}
          {[-0.062, 0.062].map((ex, i) => (
            <group key={`eye-${i}`} position={[ex, 0.015, 0.13]}>
              <mesh>
                <torusGeometry args={[0.044, 0.008, 8, 20]} />
                <meshBasicMaterial color="#fb923c" toneMapped={false} />
              </mesh>
              <mesh ref={i === 0 ? leftEyeRef : rightEyeRef} position={[0, 0, 0.006]}>
                <sphereGeometry args={[0.032, 14, 12]} />
                <meshBasicMaterial color="#00F5FF" toneMapped={false} />
              </mesh>
              <mesh position={[0, 0, 0.032]}>
                <sphereGeometry args={[0.012, 10, 8]} />
                <meshBasicMaterial color="#040812" />
              </mesh>
            </group>
          ))}
          {/* Sharp Beak */}
          <mesh position={[0, -0.025, 0.165]} rotation={[Math.PI / 2 + 0.2, 0, 0]}>
            <coneGeometry args={[0.028, 0.075, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Iconic Owl Ear Tufts */}
          <mesh position={[-0.105, 0.13, 0.01]} rotation={[0, 0, 0.42]}>
            <coneGeometry args={[0.034, 0.11, 5]} />
            <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0.105, 0.13, 0.01]} rotation={[0, 0, -0.42]}>
            <coneGeometry args={[0.034, 0.11, 5]} />
            <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.4} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/* ================= 2. LIVING ANIMATED MASCOT: COSMIC PHOENIX (BAN SỰ KIỆN) ================= */
const CosmicPhoenixMascot: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const rootRef = useRef<THREE.Group>(null);
  const leftInnerWing = useRef<THREE.Group>(null);
  const leftOuterWing = useRef<THREE.Group>(null);
  const rightInnerWing = useRef<THREE.Group>(null);
  const rightOuterWing = useRef<THREE.Group>(null);
  const tailRefs = useRef<Array<THREE.Mesh | null>>([]);
  const auraRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Graceful figure-8 levitating flight hover
    if (rootRef.current) {
      rootRef.current.position.y = 1.48 + Math.sin(t * 2.4) * 0.085;
      rootRef.current.position.x = Math.sin(t * 1.1) * 0.06;
      rootRef.current.rotation.y = Math.sin(t * 0.9) * 0.25;
      rootRef.current.rotation.x = 0.12 + Math.cos(t * 2.4) * 0.06;
      const targetScale = hovered ? 1.1 : 1.0;
      rootRef.current.scale.setScalar(THREE.MathUtils.lerp(rootRef.current.scale.x, targetScale, dt * 7));
    }

    // Two-joint realistic phoenix wingbeat wave
    const flapPrimary = Math.sin(t * 4.4) * 0.48;
    const flapTip = Math.sin(t * 4.4 - 0.85) * 0.42;
    if (leftInnerWing.current) leftInnerWing.current.rotation.z = 0.18 + flapPrimary;
    if (leftOuterWing.current) leftOuterWing.current.rotation.z = flapTip;
    if (rightInnerWing.current) rightInnerWing.current.rotation.z = -0.18 - flapPrimary;
    if (rightOuterWing.current) rightOuterWing.current.rotation.z = -flapTip;

    // Flowing silk tail plumes
    for (let i = 0; i < 3; i += 1) {
      const tail = tailRefs.current[i];
      if (!tail) continue;
      tail.rotation.x = -0.55 + Math.sin(t * 3.2 - i * 0.5) * 0.18;
    }

    if (auraRingRef.current) {
      auraRingRef.current.rotation.z = t * 1.1;
    }
  });

  return (
    <group>
      {/* Orbiting Flame Energy Ring on Pedestal Top */}
      <mesh ref={auraRingRef} position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.01, 8, 32]} />
        <meshBasicMaterial color="#c084fc" toneMapped={false} />
      </mesh>

      <group ref={rootRef} position={[0, 1.48, 0]}>
        {/* Sculpted Sleek Phoenix Body */}
        <mesh scale={[0.75, 0.85, 1.45]}>
          <sphereGeometry args={[0.13, 20, 16]} />
          <meshStandardMaterial
            color="#4c1d95"
            emissive="#a855f7"
            emissiveIntensity={0.55}
            metalness={0.55}
            roughness={0.22}
          />
        </mesh>

        {/* Graceful Arched Neck & Crowned Head */}
        <group position={[0, 0.13, 0.15]} rotation={[-0.25, 0, 0]}>
          <mesh position={[0, 0.05, 0.01]}>
            <cylinderGeometry args={[0.042, 0.064, 0.16, 14]} />
            <meshStandardMaterial color="#6d28d9" emissive="#c084fc" emissiveIntensity={0.45} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.15, 0.03]}>
            <sphereGeometry args={[0.068, 16, 14]} />
            <meshStandardMaterial color="#7e22ce" emissive="#c084fc" emissiveIntensity={0.5} roughness={0.22} />
          </mesh>
          {/* Radiant Golden Beak */}
          <mesh position={[0, 0.145, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.022, 0.08, 6]} />
            <meshBasicMaterial color="#fde047" toneMapped={false} />
          </mesh>
          {/* Glowing Eyes */}
          {[-0.044, 0.044].map((ex, i) => (
            <mesh key={`phx-eye-${i}`} position={[ex, 0.165, 0.068]}>
              <sphereGeometry args={[0.014, 10, 8]} />
              <meshBasicMaterial color="#00F5FF" toneMapped={false} />
            </mesh>
          ))}
          {/* 3-Plume Royal Phoenix Crest */}
          {[-0.025, 0, 0.025].map((cx, i) => (
            <mesh key={`crest-${i}`} position={[cx, 0.22, -0.02]} rotation={[-0.75, 0, cx * 5]}>
              <coneGeometry args={[0.012, 0.13, 5]} />
              <meshBasicMaterial color={i === 1 ? '#fde047' : '#f472b6'} toneMapped={false} />
            </mesh>
          ))}
        </group>

        {/* Two-Joint Articulated Left Wing */}
        <group ref={leftInnerWing} position={[-0.09, 0.06, 0.02]}>
          <mesh position={[-0.14, 0, -0.02]} rotation={[0, 0.18, 0]}>
            <boxGeometry args={[0.28, 0.022, 0.15]} />
            <meshStandardMaterial color="#9333ea" emissive="#c084fc" emissiveIntensity={0.62} roughness={0.24} />
          </mesh>
          <group ref={leftOuterWing} position={[-0.27, 0, -0.04]}>
            <mesh position={[-0.14, 0, -0.02]} rotation={[0, 0.25, 0]}>
              <boxGeometry args={[0.28, 0.016, 0.11]} />
              <meshBasicMaterial color="#f472b6" toneMapped={false} />
            </mesh>
            <mesh position={[-0.24, 0, -0.06]} rotation={[0, 0.45, 0]}>
              <coneGeometry args={[0.032, 0.16, 4]} />
              <meshBasicMaterial color="#fde047" toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* Two-Joint Articulated Right Wing */}
        <group ref={rightInnerWing} position={[0.09, 0.06, 0.02]}>
          <mesh position={[0.14, 0, -0.02]} rotation={[0, -0.18, 0]}>
            <boxGeometry args={[0.28, 0.022, 0.15]} />
            <meshStandardMaterial color="#9333ea" emissive="#c084fc" emissiveIntensity={0.62} roughness={0.24} />
          </mesh>
          <group ref={rightOuterWing} position={[0.27, 0, -0.04]}>
            <mesh position={[0.14, 0, -0.02]} rotation={[0, -0.25, 0]}>
              <boxGeometry args={[0.28, 0.016, 0.11]} />
              <meshBasicMaterial color="#f472b6" toneMapped={false} />
            </mesh>
            <mesh position={[0.24, 0, -0.06]} rotation={[0, -0.45, 0]}>
              <coneGeometry args={[0.032, 0.16, 4]} />
              <meshBasicMaterial color="#fde047" toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* 3 Flowing Luminous Tail Plumes */}
        {[-0.06, 0, 0.06].map((tx, i) => (
          <mesh
            key={`tail-${i}`}
            ref={(el) => {
              tailRefs.current[i] = el;
            }}
            position={[tx, -0.04, -0.26]}
            rotation={[-0.55, tx * 2, 0]}
          >
            <coneGeometry args={[0.026, i === 1 ? 0.44 : 0.34, 5]} />
            <meshBasicMaterial color={i === 1 ? '#fde047' : '#e879f9'} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/* ================= 3. LIVING ANIMATED MASCOT: CYBER FOX (BAN NHÂN SỰ) ================= */
const CyberFoxMascot: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Mesh>(null);
  const rightEarRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (rootRef.current) {
      const targetScale = hovered ? 1.09 : 1.0;
      rootRef.current.scale.setScalar(THREE.MathUtils.lerp(rootRef.current.scale.x, targetScale, dt * 7));
    }

    // Friendly curious head tilt & scan
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.1) * 0.34;
      headRef.current.rotation.z = Math.cos(t * 1.4) * 0.1;
    }

    // Happy rhythmic tail wag!
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(t * (hovered ? 6.2 : 3.6)) * 0.42;
      tailRef.current.rotation.x = 0.38 + Math.sin(t * 2.2) * 0.08;
    }

    // Subtle periodic ear twitch
    const twitch = (t % 3.2) > 2.95 ? Math.sin(t * 32) * 0.18 : 0;
    if (leftEarRef.current) leftEarRef.current.rotation.z = 0.24 + twitch;
    if (rightEarRef.current) rightEarRef.current.rotation.z = -0.24 - twitch * 0.6;
  });

  return (
    <group ref={rootRef} position={[0, 1.03, 0]}>
      {/* Seated Fox Body */}
      <mesh position={[0, 0.2, -0.02]} scale={[0.92, 1.15, 0.98]}>
        <sphereGeometry args={[0.175, 22, 18]} />
        <meshStandardMaterial color="#0f766e" emissive="#10b981" emissiveIntensity={0.28} roughness={0.36} metalness={0.28} />
      </mesh>
      {/* Crisp White Fluffy Chest Ruff */}
      <mesh position={[0, 0.22, 0.12]} scale={[0.72, 0.88, 0.52]}>
        <sphereGeometry args={[0.14, 18, 14]} />
        <meshStandardMaterial color="#ecfdf5" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Neon Emerald Collar */}
      <mesh position={[0, 0.36, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.115, 0.015, 8, 24]} />
        <meshBasicMaterial color="#34d399" toneMapped={false} />
      </mesh>

      {/* Seated Front Paws */}
      {[-0.075, 0.075].map((px, i) => (
        <group key={`paw-${i}`} position={[px, 0.08, 0.14]}>
          <mesh>
            <cylinderGeometry args={[0.032, 0.036, 0.16, 12]} />
            <meshStandardMaterial color="#115e59" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.07, 0.03]}>
            <sphereGeometry args={[0.038, 12, 10]} />
            <meshStandardMaterial color="#ecfdf5" roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* Articulated Wagging Fluffy Fox Tail */}
      <group ref={tailRef} position={[0, 0.1, -0.17]}>
        <mesh position={[0, 0.12, -0.14]} rotation={[-0.75, 0, 0]} scale={[0.75, 1.35, 0.75]}>
          <sphereGeometry args={[0.13, 18, 14]} />
          <meshStandardMaterial color="#0d9488" emissive="#10b981" emissiveIntensity={0.3} roughness={0.38} />
        </mesh>
        {/* Glowing White/Mint Tail Tip */}
        <mesh position={[0, 0.24, -0.24]} rotation={[-0.85, 0, 0]}>
          <coneGeometry args={[0.075, 0.17, 12]} />
          <meshBasicMaterial color="#a7f3d0" toneMapped={false} />
        </mesh>
      </group>

      {/* Articulated Expressive Fox Head */}
      <group ref={headRef} position={[0, 0.48, 0.03]}>
        <mesh scale={[1.05, 0.88, 1.0]}>
          <sphereGeometry args={[0.145, 22, 18]} />
          <meshStandardMaterial color="#0f766e" emissive="#10b981" emissiveIntensity={0.28} roughness={0.34} />
        </mesh>
        {/* White Cheek Fur */}
        {[-0.1, 0.1].map((cx, i) => (
          <mesh key={`cheek-${i}`} position={[cx, -0.03, 0.06]} scale={[0.75, 0.65, 0.7]}>
            <sphereGeometry args={[0.075, 14, 12]} />
            <meshStandardMaterial color="#ecfdf5" roughness={0.5} />
          </mesh>
        ))}
        {/* Pointed Fox Snout + Nose */}
        <mesh position={[0, -0.025, 0.155]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.065, 0.15, 12]} />
          <meshStandardMaterial color="#ecfdf5" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.018, 0.228]}>
          <sphereGeometry args={[0.022, 12, 10]} />
          <meshStandardMaterial color="#090d16" roughness={0.2} metalness={0.5} />
        </mesh>
        {/* Luminous Emerald-Cyan Eyes */}
        {[-0.06, 0.06].map((ex, i) => (
          <mesh key={`fox-eye-${i}`} position={[ex, 0.025, 0.125]}>
            <sphereGeometry args={[0.022, 12, 10]} />
            <meshBasicMaterial color="#6ee7b7" toneMapped={false} />
          </mesh>
        ))}
        {/* Big Articulated Pointed Fox Ears */}
        <mesh ref={leftEarRef} position={[-0.095, 0.145, -0.01]} rotation={[0.1, 0, 0.24]}>
          <coneGeometry args={[0.056, 0.19, 5]} />
          <meshStandardMaterial color="#10b981" emissive="#34d399" emissiveIntensity={0.42} roughness={0.3} />
        </mesh>
        <mesh ref={rightEarRef} position={[0.095, 0.145, -0.01]} rotation={[0.1, 0, -0.24]}>
          <coneGeometry args={[0.056, 0.19, 5]} />
          <meshStandardMaterial color="#10b981" emissive="#34d399" emissiveIntensity={0.42} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

/* ================= 4. ROTATING 3D ARTIFACT: CINEMA CAMERA RIG (BAN TRUYỀN THÔNG) ================= */
const CinemaCameraArtifact: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const spinRef = useRef<THREE.Group>(null);
  const reel1Ref = useRef<THREE.Mesh>(null);
  const reel2Ref = useRef<THREE.Mesh>(null);
  const recLightRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (spinRef.current) {
      spinRef.current.rotation.y += dt * (hovered ? 1.15 : 0.6);
      spinRef.current.position.y = 1.42 + Math.sin(t * 1.8) * 0.05;
      const targetScale = hovered ? 1.09 : 1.0;
      spinRef.current.scale.setScalar(THREE.MathUtils.lerp(spinRef.current.scale.x, targetScale, dt * 7));
    }
    if (reel1Ref.current) reel1Ref.current.rotation.z -= dt * 2.4;
    if (reel2Ref.current) reel2Ref.current.rotation.z -= dt * 2.4;
    if (recLightRef.current) {
      recLightRef.current.opacity = Math.sin(t * 5.0) > 0 ? 1.0 : 0.2;
    }
  });

  return (
    <group ref={spinRef} position={[0, 1.42, 0]}>
      {/* Main Matte Dark-Titanium Cinema Camera Body */}
      <RoundedBox args={[0.26, 0.24, 0.42]} radius={0.025} smoothness={2}>
        <meshStandardMaterial color="#101b33" metalness={0.84} roughness={0.22} />
      </RoundedBox>
      {/* Side Neon Accent Stripes */}
      {[-0.135, 0.135].map((sx, i) => (
        <mesh key={`cam-stripe-${i}`} position={[sx, 0, 0]}>
          <boxGeometry args={[0.01, 0.032, 0.34]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} />
        </mesh>
      ))}
      {/* Multi-Ring Optical Telephoto Lens Barrel */}
      <group position={[0, -0.01, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.095, 0.088, 0.18, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.18} />
        </mesh>
        {/* Lens Focus Ring */}
        <mesh position={[0, 0.02, 0]}>
          <torusGeometry args={[0.096, 0.01, 8, 24]} />
          <meshBasicMaterial color="#00F5FF" toneMapped={false} />
        </mesh>
        {/* Front Glass Optical Element */}
        <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.078, 24]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#00F5FF"
            emissiveIntensity={0.65}
            metalness={0.9}
            roughness={0.08}
          />
        </mesh>
      </group>
      {/* Twin Spinning Cinema Film/Data Reels on Top */}
      <mesh ref={reel1Ref} position={[0, 0.22, -0.1]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.095, 0.022, 10, 24]} />
        <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.25} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh ref={reel2Ref} position={[0, 0.22, 0.1]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.085, 0.022, 10, 24]} />
        <meshStandardMaterial color="#334155" emissive="#00F5FF" emissiveIntensity={0.25} metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Top Shotgun Broadcast Mic */}
      <mesh position={[0.09, 0.17, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.24} />
      </mesh>
      {/* Flip-Out Glowing Viewfinder Monitor */}
      <mesh position={[-0.22, 0.01, -0.04]} rotation={[0, -0.35, 0]}>
        <boxGeometry args={[0.16, 0.11, 0.016]} />
        <meshStandardMaterial color="#091529" emissive="#38bdf8" emissiveIntensity={0.75} roughness={0.2} />
      </mesh>
      {/* Live Blinking Red REC Tally Light */}
      <mesh position={[0.09, 0.1, 0.215]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshBasicMaterial ref={recLightRef} color="#ff2a55" transparent opacity={1} toneMapped={false} />
      </mesh>
      {/* Orbiting Cyan Shutter Ring */}
      <mesh rotation={[Math.PI / 2.2, 0.2, 0]}>
        <torusGeometry args={[0.36, 0.009, 8, 40]} />
        <meshBasicMaterial color="#00F5FF" toneMapped={false} />
      </mesh>
    </group>
  );
};

/* ================= 5. ROTATING 3D ARTIFACT: SOVEREIGN CROWN & ASTROLABE (BAN CHỦ NHIỆM) ================= */
const LeadershipCrownArtifact: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const crownRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (crownRef.current) {
      crownRef.current.rotation.y += dt * (hovered ? 1.2 : 0.65);
      crownRef.current.position.y = 1.44 + Math.sin(t * 1.7) * 0.055;
      const targetScale = hovered ? 1.1 : 1.0;
      crownRef.current.scale.setScalar(THREE.MathUtils.lerp(crownRef.current.scale.x, targetScale, dt * 7));
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += dt * 0.75;
      outerRingRef.current.rotation.y += dt * 0.45;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= dt * 0.95;
      innerRingRef.current.rotation.x -= dt * 0.4;
    }
  });

  return (
    <group ref={crownRef} position={[0, 1.44, 0]}>
      {/* Royal Champagne-Gold Crown Base Circlet */}
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.026, 12, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.38} metalness={0.94} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.185, 0.165, 0.1, 24, 1, true]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#fbbf24"
          emissiveIntensity={0.32}
          metalness={0.94}
          roughness={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 8 Crown Spires Tipped with Luminous Cyan Diamonds */}
      {Array.from({ length: 8 }).map((_, idx) => {
        const angle = (idx / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.175;
        const rz = Math.sin(angle) * 0.175;
        const isMain = idx % 2 === 0;
        const h = isMain ? 0.16 : 0.11;
        return (
          <group key={`spire-${idx}`} position={[rx, 0.06, rz]}>
            <mesh position={[0, h / 2, 0]}>
              <coneGeometry args={[0.028, h, 4]} />
              <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.42} metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, h + 0.018, 0]}>
              <octahedronGeometry args={[isMain ? 0.024 : 0.016, 0]} />
              <meshBasicMaterial color={isMain ? '#00F5FF' : '#fde047'} toneMapped={false} />
            </mesh>
          </group>
        );
      })}

      {/* Center Floating Leadership Star Jewel */}
      <mesh position={[0, 0.06, 0]}>
        <octahedronGeometry args={[0.065, 0]} />
        <meshBasicMaterial color="#00F5FF" toneMapped={false} />
      </mesh>

      {/* Counter-Rotating Gold & Cyan Astrolabe Compass Gimbal Rings */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[0.34, 0.011, 10, 42]} />
        <meshBasicMaterial color="#fbbf24" toneMapped={false} />
      </mesh>
      <mesh ref={innerRingRef}>
        <torusGeometry args={[0.28, 0.008, 10, 38]} />
        <meshBasicMaterial color="#00F5FF" toneMapped={false} />
      </mesh>
    </group>
  );
};

const DeptEmblemPedestal: React.FC<{
  cfg: DeptEmblemConfig;
  marbleMaps: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ cfg, marbleMaps, metalMaps }) => {
  const { setHoveringInteractive, openExecutiveBoard } = useHeritageStore();
  const [hovered, setHovered] = useState(false);

  const plaqueTex = useMemo(() => createEmblemPlaqueTexture(cfg), [cfg]);

  useEffect(() => {
    return () => {
      plaqueTex.dispose();
    };
  }, [plaqueTex]);

  const preview: HoverPreview = useMemo(
    () => ({
      title: cfg.title,
      badge: cfg.badge,
      summary: cfg.description,
      bullets: [cfg.subtitle, `Trực thuộc: ${cfg.dept} (${CURRENT_TERM})`],
      actionLabel: `Xem hồ sơ ${cfg.dept}`,
    }),
    [cfg]
  );

  const handleOpen = () => openExecutiveBoard(cfg.dept, CURRENT_TERM);

  return (
    <group
      position={cfg.position}
      rotation={[0, cfg.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveringInteractive(true, `${cfg.title} — ${cfg.dept}`, handleOpen, preview);
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveringInteractive(false);
      }}
    >
      {/* Sleek Cylindrical Dark-Obsidian Holo-Pedestal with Lightweight Collider */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.5, 0]}>
        <CylinderCollider args={[0.5, 0.34]} />

        {/* Glowing Floor Halo Ring */}
        <mesh position={[0, -0.492, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.36, 0.42, 32]} />
          <meshBasicMaterial
            color={cfg.accent}
            transparent
            opacity={hovered ? 0.9 : 0.48}
            toneMapped={false}
          />
        </mesh>

        {/* Titanium Base Ring */}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.35, 0.38, 0.08, 28]} />
          <meshStandardMaterial
            color="#0a1222"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.9}
            roughness={0.22}
          />
        </mesh>

        {/* Obsidian Marble Column */}
        <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.27, 0.3, 0.88, 28]} />
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#111d34"
            roughness={0.26}
            metalness={0.44}
          />
        </mesh>

        {/* Top Luminous Emitter Collar */}
        <mesh position={[0, 0.47, 0]}>
          <cylinderGeometry args={[0.32, 0.3, 0.055, 28]} />
          <meshStandardMaterial color="#13213a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.498, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.28, 32]} />
          <meshBasicMaterial color={cfg.accent} toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Anti-Glare Front Nameplate Plaque */}
      <group position={[0, 0.54, 0.32]} rotation={[-0.22, 0, 0]}>
        <RoundedBox args={[0.56, 0.2, 0.022]} radius={0.01} smoothness={2}>
          <meshStandardMaterial
            color="#121e36"
            metalness={0.86}
            roughness={0.22}
            emissive={cfg.accent}
            emissiveIntensity={hovered ? 0.36 : 0.12}
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[0.52, 0.172]} />
          <meshBasicMaterial map={plaqueTex} color={hovered ? '#ffffff' : '#dce8f8'} />
        </mesh>
      </group>

      {/* Custom 3D Animated Mascot OR Rotating 3D Artifact */}
      {cfg.kind === 'owl' && <CyberOwlMascot hovered={hovered} />}
      {cfg.kind === 'phoenix' && <CosmicPhoenixMascot hovered={hovered} />}
      {cfg.kind === 'fox' && <CyberFoxMascot hovered={hovered} />}
      {cfg.kind === 'camera' && <CinemaCameraArtifact hovered={hovered} />}
      {cfg.kind === 'crown' && <LeadershipCrownArtifact hovered={hovered} />}
    </group>
  );
};

export const DepartmentMascots3D: React.FC = () => {
  const marbleMaps = useMemo(() => createMarbleMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);

  useEffect(() => {
    return () => {
      marbleMaps.map.dispose();
      marbleMaps.roughnessMap.dispose();
      marbleMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
    };
  }, [marbleMaps, metalMaps]);

  return (
    <group name="department-mascots-and-artifacts-3d">
      {DEPT_EMBLEMS.map((cfg) => (
        <DeptEmblemPedestal
          key={cfg.id}
          cfg={cfg}
          marbleMaps={marbleMaps}
          metalMaps={metalMaps}
        />
      ))}
    </group>
  );
};
