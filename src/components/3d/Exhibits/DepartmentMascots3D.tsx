import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CylinderCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps, createMarbleMaps } from '../utils/proceduralMaterials';
import {
  createFoxFurMaps,
  createOwlPlumageMaps,
  createPhoenixPlumageMaps,
  createSculptedFeatherGeometry,
  createTaperedTubeGeometry,
} from '../utils/mythicalCreatureGeometries';
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
 * 5 Department Mythical 3D Living Mascots & Rotating Artifacts:
 * - Ban Chuyên Môn: Thần Cú Thiên Cơ (Great Horned Owl sculpted with layered feathers & curved talons)
 * - Ban Sự Kiện:    Phượng Hoàng Bất Tử (Celestial Phoenix with multi-feather flapping wings & ribbon plumes)
 * - Ban Nhân Sự:    Cửu Vĩ Linh Hồ (Mythical Spirit Fox with velvety fur & 5 undulating jade spirit tails)
 * - Ban Truyền Thông: Máy Quay Điện Ảnh 3D xoay 360°
 * - Ban Chủ Nhiệm:    Vương Miện & La Bàn Định Hướng 3D xoay 360°
 */
const DEPT_EMBLEMS: DeptEmblemConfig[] = [
  {
    id: 'emblem-bcm-owl',
    dept: 'Ban Chuyên Môn',
    kind: 'owl',
    isMascot: true,
    position: [-14.87, 0, -12.95],
    rotationY: Math.PI / 2,
    badge: 'LINH VẬT THẦN THOẠI • BAN CHUYÊN MÔN',
    title: 'Thần Cú Thiên Cơ',
    subtitle: 'Trí tuệ sâu sắc • Tầm nhìn xuyên màn đêm',
    accent: '#fb923c',
    secondary: '#00F5FF',
    description:
      'Linh vật Thần Cú điêu khắc bộ lông tầng tỉ mỉ, đôi mắt sáng tinh anh và sải cánh uy nghi — biểu trưng cho trí tuệ, tư duy thuật toán và tinh thần nghiên cứu bền bỉ của Ban Chuyên Môn.',
  },
  {
    id: 'emblem-bsk-phoenix',
    dept: 'Ban Sự Kiện',
    kind: 'phoenix',
    isMascot: true,
    position: [14.87, 0, -12.95],
    rotationY: -Math.PI / 2,
    badge: 'LINH VẬT THẦN THOẠI • BAN SỰ KIỆN',
    title: 'Phượng Hoàng Bất Tử',
    subtitle: 'Rực rỡ • Tái sinh sáng tạo • Bùng nổ sân khấu',
    accent: '#c084fc',
    secondary: '#f472b6',
    description:
      'Linh vật Phượng Hoàng huyền thoại với đôi cánh lông vũ hai khớp vỗ nhịp sống động, vương miện mào lửa và 5 dải đuôi uốn lượn — biểu tượng cho những sân khấu rực rỡ của Ban Sự Kiện.',
  },
  {
    id: 'emblem-bns-fox',
    dept: 'Ban Nhân Sự',
    kind: 'fox',
    isMascot: true,
    position: [2.95, 0, 6.4],
    rotationY: Math.PI,
    badge: 'LINH VẬT THẦN THOẠI • BAN NHÂN SỰ',
    title: 'Linh Hồ Ngọc Bích',
    subtitle: 'Tinh tế • Ấm áp • Gắn kết muôn người',
    accent: '#34d399',
    secondary: '#a7f3d0',
    description:
      'Linh Hồ thần thoại với bộ lông ngọc bích mượt mà, đôi tai lắng nghe nhạy bén và 5 chiếc đuôi linh khí uốn lượn mềm mại — biểu trưng cho sự khéo léo, tận tâm và gắn kết của Ban Nhân Sự.',
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
  const { canvas, ctx } = createHiResCanvas(460, 152, 1.5);
  if (ctx) {
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, 460, 152);

    ctx.strokeStyle = cfg.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 452, 144);

    ctx.fillStyle = cfg.accent;
    ctx.fillRect(4, 4, 452, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.accent;
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillText(cfg.badge, 230, 38, 424);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 25px Inter, sans-serif';
    ctx.fillText(cfg.title, 230, 82, 424);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 15px Inter, sans-serif';
    ctx.fillText(cfg.subtitle, 230, 120, 424);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

/* ================= 1. MYTHICAL GREAT HORNED OWL (THẦN CÚ THIÊN CƠ — BAN CHUYÊN MÔN) ================= */
const MythicalOwlMascot: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const leftLidRef = useRef<THREE.Mesh>(null);
  const rightLidRef = useRef<THREE.Mesh>(null);
  const leftHornRef = useRef<THREE.Mesh>(null);
  const rightHornRef = useRef<THREE.Mesh>(null);

  const plumage = useMemo(() => createOwlPlumageMaps(), []);

  const geoms = useMemo(() => {
    // Organic pear-shaped perched owl torso profile (LatheGeometry)
    const torsoPts = [
      new THREE.Vector2(0.0, -0.18),
      new THREE.Vector2(0.09, -0.16),
      new THREE.Vector2(0.155, -0.08),
      new THREE.Vector2(0.195, 0.04),
      new THREE.Vector2(0.205, 0.16),
      new THREE.Vector2(0.185, 0.27),
      new THREE.Vector2(0.135, 0.34),
      new THREE.Vector2(0.095, 0.37),
      new THREE.Vector2(0.0, 0.38),
    ];
    const torso = new THREE.LatheGeometry(torsoPts, 36);
    torso.computeVertexNormals();

    // Sculpted raptor hooked beak
    const beak = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0.012, 0),
        new THREE.Vector3(0, 0.008, 0.036),
        new THREE.Vector3(0, -0.015, 0.068),
        new THREE.Vector3(0, -0.052, 0.072),
      ],
      (t) => 0.032 * Math.pow(1 - t, 0.85),
      16,
      12,
      0.85,
      1.15
    );

    // Sweeping Great Horned Owl curved ear plumes (left & right)
    const leftHorn = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.04, 0.065, -0.01),
        new THREE.Vector3(-0.095, 0.13, -0.035),
        new THREE.Vector3(-0.14, 0.175, -0.06),
      ],
      (t) => 0.034 * (1 - t * 0.88),
      16,
      10,
      1.2,
      0.6
    );
    const rightHorn = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.04, 0.065, -0.01),
        new THREE.Vector3(0.095, 0.13, -0.035),
        new THREE.Vector3(0.14, 0.175, -0.06),
      ],
      (t) => 0.034 * (1 - t * 0.88),
      16,
      10,
      1.2,
      0.6
    );

    // Ancient gnarled twisted branch perch
    const branch = createTaperedTubeGeometry(
      [
        new THREE.Vector3(-0.26, 0.02, -0.02),
        new THREE.Vector3(-0.1, 0.05, 0.01),
        new THREE.Vector3(0.08, 0.045, 0.015),
        new THREE.Vector3(0.25, 0.08, -0.03),
      ],
      (t) => 0.028 * (1 - Math.abs(t - 0.5) * 0.45),
      20,
      12
    );

    // Curved gripping talon claw
    const talon = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.02, 0.035),
        new THREE.Vector3(0, -0.055, 0.045),
        new THREE.Vector3(0, -0.075, 0.02),
      ],
      (t) => 0.012 * (1 - t * 0.78),
      12,
      8
    );

    const primaryFeather = createSculptedFeatherGeometry(0.32, 0.068, 0.03);
    const covertFeather = createSculptedFeatherGeometry(0.21, 0.062, 0.022);
    const tailFeather = createSculptedFeatherGeometry(0.28, 0.058, 0.018);

    return {
      torso,
      beak,
      leftHorn,
      rightHorn,
      branch,
      talon,
      primaryFeather,
      covertFeather,
      tailFeather,
    };
  }, []);

  useEffect(() => {
    return () => {
      plumage.map.dispose();
      plumage.bumpMap.dispose();
      Object.values(geoms).forEach((g) => g.dispose());
    };
  }, [plumage, geoms]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (bodyRef.current) {
      // Natural slow chest breathing
      const breath = Math.sin(t * 2.0) * 0.014;
      bodyRef.current.position.y = 1.24 + breath;
      bodyRef.current.scale.set(
        THREE.MathUtils.lerp(bodyRef.current.scale.x, hovered ? 1.07 : 1.0, dt * 6),
        THREE.MathUtils.lerp(bodyRef.current.scale.y, (hovered ? 1.07 : 1.0) + breath * 0.6, dt * 6),
        THREE.MathUtils.lerp(bodyRef.current.scale.z, hovered ? 1.07 : 1.0, dt * 6)
      );
    }

    // Authentic smooth owl neck swivel & curious sideways head tilt
    if (headRef.current) {
      const lookWave = Math.sin(t * 0.68) * 0.52 + Math.sin(t * 1.45) * 0.14;
      headRef.current.rotation.y = lookWave;
      headRef.current.rotation.z = Math.sin(t * 0.95 + 0.8) * 0.14;
      headRef.current.rotation.x = Math.cos(t * 0.6) * 0.07;
    }

    // Subtle ear-plume alertness twitch
    const alert = Math.sin(t * 1.9) * 0.05;
    if (leftHornRef.current) leftHornRef.current.rotation.z = alert;
    if (rightHornRef.current) rightHornRef.current.rotation.z = -alert;

    // Periodic majestic wing-mantle spread every ~5.5s (or gently lifted on hover)
    const cycle = t % 5.5;
    const spread =
      cycle < 1.35
        ? Math.sin((cycle / 1.35) * Math.PI) * 0.62
        : hovered
        ? 0.24 + Math.sin(t * 2.8) * 0.05
        : Math.sin(t * 2.0) * 0.03;
    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = 0.08 + spread;
      leftWingRef.current.rotation.y = -spread * 0.35;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -0.08 - spread;
      rightWingRef.current.rotation.y = spread * 0.35;
    }

    // Smooth anatomical upper eyelid blink every ~3.8s
    const blinkPhase = t % 3.8;
    const lidAngle = blinkPhase > 3.6 ? Math.sin(((blinkPhase - 3.6) / 0.2) * Math.PI) * 1.35 : 0;
    if (leftLidRef.current) leftLidRef.current.rotation.x = -0.65 + lidAngle;
    if (rightLidRef.current) rightLidRef.current.rotation.x = -0.65 + lidAngle;
  });

  return (
    <group>
      {/* Sculpted Ancient Twisted Branch Perch mounted above pedestal */}
      <group position={[0, 1.03, 0]}>
        <mesh geometry={geoms.branch} castShadow>
          <meshStandardMaterial color="#3b2c26" roughness={0.82} metalness={0.12} />
        </mesh>
        {/* Subtle glowing amber rune ring around perch stem */}
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 0.12, 16]} />
          <meshStandardMaterial color="#271e1a" roughness={0.85} />
        </mesh>
      </group>

      <group ref={bodyRef} position={[0, 1.24, 0]}>
        {/* Sculpted Organic Owl Torso with Velvety Layered Plumage */}
        <mesh geometry={geoms.torso} scale={[1.0, 1.0, 0.92]} castShadow>
          <meshPhysicalMaterial
            map={plumage.map}
            bumpMap={plumage.bumpMap}
            bumpScale={0.015}
            color="#d8dee9"
            roughness={0.72}
            metalness={0.06}
            sheen={0.8}
            sheenRoughness={0.62}
            sheenColor="#fed7aa"
          />
        </mesh>

        {/* Soft Sculpted Cream-Gold Breast Plumage */}
        <mesh position={[0, 0.1, 0.135]} scale={[0.76, 1.05, 0.45]}>
          <sphereGeometry args={[0.165, 24, 20]} />
          <meshPhysicalMaterial
            map={plumage.map}
            bumpMap={plumage.bumpMap}
            bumpScale={0.01}
            color="#f5e6d3"
            roughness={0.78}
            sheen={0.85}
            sheenColor="#ffedd5"
          />
        </mesh>

        {/* 5 Fanned Sculpted Tail Feathers */}
        <group position={[0, -0.1, -0.14]} rotation={[-2.52, 0, 0]}>
          {[-0.36, -0.18, 0, 0.18, 0.36].map((ang, i) => (
            <mesh
              key={`owl-tail-${i}`}
              geometry={geoms.tailFeather}
              position={[ang * 0.14, 0, -Math.abs(ang) * 0.02]}
              rotation={[0, 0, -ang]}
            >
              <meshPhysicalMaterial
                map={plumage.map}
                color={i === 2 ? '#e2c29b' : '#94a3b8'}
                roughness={0.68}
                sheen={0.6}
                sheenColor="#fb923c"
              />
            </mesh>
          ))}
        </group>

        {/* Feathered Legs + Curved Raptor Talons gripping branch */}
        {[-0.075, 0.075].map((lx, legIdx) => (
          <group key={`owl-leg-${legIdx}`} position={[lx, -0.13, 0.015]}>
            <mesh scale={[0.85, 1.15, 0.85]}>
              <sphereGeometry args={[0.048, 14, 12]} />
              <meshStandardMaterial color="#e6d5c3" roughness={0.8} />
            </mesh>
            {[-0.35, 0, 0.35].map((yaw, cIdx) => (
              <mesh
                key={`claw-${cIdx}`}
                geometry={geoms.talon}
                position={[0, -0.025, 0.01]}
                rotation={[0, yaw, 0]}
              >
                <meshStandardMaterial color="#d97706" metalness={0.42} roughness={0.38} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Articulated Left & Right Multi-Feather Sculpted Wings */}
        {(['left', 'right'] as const).map((side) => {
          const sign = side === 'left' ? -1 : 1;
          return (
            <group
              key={`owl-wing-${side}`}
              ref={side === 'left' ? leftWingRef : rightWingRef}
              position={[sign * 0.18, 0.25, -0.02]}
            >
              {/* Shoulder wing covert fan (5 overlapping feathers) */}
              {[0, 1, 2, 3, 4].map((idx) => (
                <mesh
                  key={`covert-${idx}`}
                  geometry={geoms.covertFeather}
                  position={[sign * (0.015 + idx * 0.008), -0.01 - idx * 0.018, 0.025 - idx * 0.028]}
                  rotation={[Math.PI + 0.12, sign * 0.35, sign * (0.14 + idx * 0.08)]}
                >
                  <meshPhysicalMaterial
                    map={plumage.map}
                    bumpMap={plumage.bumpMap}
                    bumpScale={0.012}
                    color="#c7d2e5"
                    roughness={0.7}
                    sheen={0.75}
                    sheenColor="#fdba74"
                  />
                </mesh>
              ))}
              {/* Long swept primary flight feathers (6 tapered blades) */}
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <mesh
                  key={`primary-${idx}`}
                  geometry={geoms.primaryFeather}
                  position={[sign * (0.035 + idx * 0.006), -0.05 - idx * 0.022, 0.01 - idx * 0.026]}
                  rotation={[Math.PI + 0.06, sign * 0.28, sign * (0.08 + idx * 0.11)]}
                >
                  <meshPhysicalMaterial
                    map={plumage.map}
                    color={idx % 2 === 0 ? '#94a3b8' : '#7a8ba8'}
                    emissive="#fb923c"
                    emissiveIntensity={idx === 5 ? 0.32 : 0.08}
                    roughness={0.64}
                    sheen={0.75}
                    sheenColor="#fb923c"
                  />
                </mesh>
              ))}
            </group>
          );
        })}

        {/* Sculpted Anatomical Owl Head */}
        <group ref={headRef} position={[0, 0.42, 0.02]}>
          <mesh scale={[1.08, 0.94, 0.98]} castShadow>
            <sphereGeometry args={[0.148, 32, 24]} />
            <meshPhysicalMaterial
              map={plumage.map}
              bumpMap={plumage.bumpMap}
              bumpScale={0.014}
              color="#d8dee9"
              roughness={0.7}
              sheen={0.8}
              sheenColor="#fed7aa"
            />
          </mesh>

          {/* Iconic Heart-Shaped Facial Discs + Expressive Golden-Amber Raptor Eyes */}
          {[-0.062, 0.062].map((ex, eIdx) => (
            <group key={`owl-eye-${eIdx}`} position={[ex, 0.012, 0.116]}>
              {/* Feathered facial disc cushion */}
              <mesh position={[0, 0, -0.006]} scale={[1.05, 1.0, 0.45]}>
                <sphereGeometry args={[0.056, 20, 16]} />
                <meshStandardMaterial color="#f5e6d3" roughness={0.85} />
              </mesh>
              {/* Dark outer orbital rim */}
              <mesh position={[0, 0, 0.012]}>
                <torusGeometry args={[0.044, 0.007, 10, 24]} />
                <meshStandardMaterial color="#1e1b24" roughness={0.5} />
              </mesh>
              {/* Luminous Mythical Amber-Gold Iris */}
              <mesh position={[0, 0, 0.012]}>
                <sphereGeometry args={[0.036, 20, 16]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#fb923c"
                  emissiveIntensity={1.15}
                  roughness={0.12}
                  metalness={0.1}
                />
              </mesh>
              {/* Deep Obsidian Pupil + Bright Corneal Specular Catchlight */}
              <mesh position={[0, 0, 0.042]}>
                <sphereGeometry args={[0.017, 14, 12]} />
                <meshPhysicalMaterial color="#05060a" roughness={0.05} clearcoat={1} />
              </mesh>
              <mesh position={[0.012, 0.012, 0.052]}>
                <sphereGeometry args={[0.006, 8, 8]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
              </mesh>
              {/* Articulated Blinking Upper Eyelid */}
              <mesh
                ref={eIdx === 0 ? leftLidRef : rightLidRef}
                position={[0, 0.005, 0.014]}
                rotation={[-0.65, 0, 0]}
              >
                <sphereGeometry args={[0.041, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                <meshStandardMaterial color="#2a3852" roughness={0.75} />
              </mesh>
            </group>
          ))}

          {/* Sculpted Curved Hooked Raptor Beak */}
          <mesh geometry={geoms.beak} position={[0, -0.018, 0.135]}>
            <meshPhysicalMaterial
              color="#d97706"
              roughness={0.28}
              metalness={0.22}
              clearcoat={0.65}
            />
          </mesh>

          {/* Sweeping Curved Mythical Horned Ear Plumes */}
          <mesh ref={leftHornRef} geometry={geoms.leftHorn} position={[-0.075, 0.095, 0.04]}>
            <meshPhysicalMaterial
              map={plumage.map}
              color="#e6c39c"
              emissive="#fb923c"
              emissiveIntensity={0.22}
              roughness={0.62}
              sheen={0.8}
              sheenColor="#fed7aa"
            />
          </mesh>
          <mesh ref={rightHornRef} geometry={geoms.rightHorn} position={[0.075, 0.095, 0.04]}>
            <meshPhysicalMaterial
              map={plumage.map}
              color="#e6c39c"
              emissive="#fb923c"
              emissiveIntensity={0.22}
              roughness={0.62}
              sheen={0.8}
              sheenColor="#fed7aa"
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/* ================= 2. MYTHICAL CELESTIAL PHOENIX (PHƯỢNG HOÀNG BẤT TỬ — BAN SỰ KIỆN) ================= */
const MythicalPhoenixMascot: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const rootRef = useRef<THREE.Group>(null);
  const leftShoulderRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const tailGroupRefs = useRef<Array<THREE.Group | null>>([]);
  const embersRef = useRef<THREE.Points>(null);

  const plumage = useMemo(() => createPhoenixPlumageMaps(), []);

  const geoms = useMemo(() => {
    // Seamless organic S-curved avian torso -> graceful arched neck -> head base
    const spineBody = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, -0.06, -0.22),
        new THREE.Vector3(0, -0.02, -0.06),
        new THREE.Vector3(0, 0.03, 0.1),
        new THREE.Vector3(0, 0.16, 0.2),
        new THREE.Vector3(0, 0.28, 0.19),
        new THREE.Vector3(0, 0.34, 0.25),
      ],
      (t) => {
        if (t < 0.45) return 0.03 + Math.sin((t / 0.45) * Math.PI * 0.72) * 0.115; // plump proud chest
        if (t < 0.8) return 0.09 - (t - 0.45) * 0.14; // graceful slender swan neck
        return 0.048 + Math.sin(((t - 0.8) / 0.2) * Math.PI) * 0.022; // sleek eagle head
      },
      36,
      18,
      0.88,
      1.0
    );

    const beak = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0.008, 0),
        new THREE.Vector3(0, 0.005, 0.045),
        new THREE.Vector3(0, -0.016, 0.088),
      ],
      (t) => 0.024 * (1 - t * 0.9),
      14,
      10
    );

    // Sweeping royal flame crest plumes
    const crest = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.06, -0.06),
        new THREE.Vector3(0, 0.11, -0.16),
        new THREE.Vector3(0, 0.09, -0.26),
      ],
      (t) => 0.015 * (1 - t * 0.82),
      18,
      8
    );

    // Flowing S-wave mythical silk tail plumes
    const tailRibbon = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.04, -0.18),
        new THREE.Vector3(0, 0.03, -0.38),
        new THREE.Vector3(0, -0.06, -0.58),
        new THREE.Vector3(0, 0.02, -0.74),
      ],
      (t) => 0.022 * Math.sin(Math.min(1, t + 0.1) * Math.PI * 0.88) + 0.005,
      26,
      8,
      1.4,
      0.45
    );

    const innerFeather = createSculptedFeatherGeometry(0.28, 0.072, 0.032);
    const outerFeather = createSculptedFeatherGeometry(0.38, 0.064, 0.045);

    // 42 glowing celestial ember sparks spiraling gently around the Phoenix
    const emberCount = 42;
    const emberPos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i += 1) {
      const a = (i / emberCount) * Math.PI * 6;
      const r = 0.22 + (i % 7) * 0.042;
      emberPos[i * 3] = Math.cos(a) * r;
      emberPos[i * 3 + 1] = 1.08 + (i / emberCount) * 0.85;
      emberPos[i * 3 + 2] = Math.sin(a) * r;
    }

    return {
      spineBody,
      beak,
      crest,
      tailRibbon,
      innerFeather,
      outerFeather,
      emberPos,
    };
  }, []);

  useEffect(() => {
    return () => {
      plumage.map.dispose();
      plumage.bumpMap.dispose();
      geoms.spineBody.dispose();
      geoms.beak.dispose();
      geoms.crest.dispose();
      geoms.tailRibbon.dispose();
      geoms.innerFeather.dispose();
      geoms.outerFeather.dispose();
    };
  }, [plumage, geoms]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (rootRef.current) {
      rootRef.current.position.y = 1.54 + Math.sin(t * 2.3) * 0.075;
      rootRef.current.position.x = Math.sin(t * 0.95) * 0.055;
      rootRef.current.rotation.y = Math.sin(t * 0.78) * 0.3;
      rootRef.current.rotation.x = 0.08 + Math.cos(t * 2.3) * 0.07;
      const targetScale = hovered ? 1.08 : 1.0;
      rootRef.current.scale.setScalar(THREE.MathUtils.lerp(rootRef.current.scale.x, targetScale, dt * 6));
    }

    // Living phase-delayed 2-joint avian wingbeat wave
    const flapSpeed = hovered ? 4.8 : 3.6;
    const shoulderWave = Math.sin(t * flapSpeed) * 0.44;
    const forearmWave = Math.sin(t * flapSpeed - 0.95) * 0.48;
    if (leftShoulderRef.current) leftShoulderRef.current.rotation.z = 0.22 + shoulderWave;
    if (leftForearmRef.current) leftForearmRef.current.rotation.z = forearmWave;
    if (rightShoulderRef.current) rightShoulderRef.current.rotation.z = -0.22 - shoulderWave;
    if (rightForearmRef.current) rightForearmRef.current.rotation.z = -forearmWave;

    // Liquid-silk tail plume undulation
    for (let i = 0; i < 5; i += 1) {
      const tg = tailGroupRefs.current[i];
      if (!tg) continue;
      tg.rotation.x = -0.18 + Math.sin(t * 2.8 - i * 0.55) * 0.16;
      tg.rotation.y = (i - 2) * 0.2 + Math.cos(t * 2.1 - i * 0.45) * 0.08;
    }

    if (embersRef.current) {
      embersRef.current.rotation.y += dt * 0.55;
      embersRef.current.position.y = Math.sin(t * 1.4) * 0.04;
    }
  });

  return (
    <group>
      {/* Swirling Celestial Ember Sparks */}
      <points ref={embersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[geoms.emberPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#f5d0fe"
          size={0.026}
          sizeAttenuation
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      <group ref={rootRef} position={[0, 1.54, 0]}>
        {/* Seamless Sculpted S-Curve Phoenix Torso, Neck & Head */}
        <mesh geometry={geoms.spineBody} castShadow>
          <meshPhysicalMaterial
            map={plumage.map}
            bumpMap={plumage.bumpMap}
            bumpScale={0.014}
            color="#f5d0fe"
            emissive="#9333ea"
            emissiveIntensity={0.45}
            roughness={0.32}
            metalness={0.28}
            iridescence={1.0}
            iridescenceIOR={1.5}
            sheen={0.9}
            sheenColor="#fde047"
          />
        </mesh>

        {/* Sculpted Golden Raptor Beak & Luminous Sapphire Eyes */}
        <group position={[0, 0.34, 0.27]}>
          <mesh geometry={geoms.beak}>
            <meshPhysicalMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.45}
              metalness={0.78}
              roughness={0.18}
              clearcoat={0.8}
            />
          </mesh>
          {[-0.042, 0.042].map((ex, i) => (
            <mesh key={`phx-eye-${i}`} position={[ex, 0.015, -0.01]}>
              <sphereGeometry args={[0.014, 14, 12]} />
              <meshBasicMaterial color="#00F5FF" toneMapped={false} />
            </mesh>
          ))}
          {/* 3 Sweeping Royal Flame Crest Plumes */}
          {[-0.24, 0, 0.24].map((ang, i) => (
            <mesh
              key={`phx-crest-${i}`}
              geometry={geoms.crest}
              position={[ang * 0.06, 0.035, -0.02]}
              rotation={[0.08 * Math.abs(i - 1), ang, ang * 0.5]}
            >
              <meshBasicMaterial color={i === 1 ? '#fde047' : '#f472b6'} toneMapped={false} />
            </mesh>
          ))}
        </group>

        {/* Articulated 2-Joint Layered Multi-Feather Wings (14 sculpted feathers per wing!) */}
        {(['left', 'right'] as const).map((side) => {
          const sign = side === 'left' ? -1 : 1;
          return (
            <group
              key={`phx-wing-${side}`}
              ref={side === 'left' ? leftShoulderRef : rightShoulderRef}
              position={[sign * 0.085, 0.055, 0.04]}
            >
              {/* Inner Secondary Feathers (7 overlapping curved feathers) */}
              {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                <mesh
                  key={`sec-${idx}`}
                  geometry={geoms.innerFeather}
                  position={[sign * (0.04 + idx * 0.042), 0.01, 0.02 - idx * 0.018]}
                  rotation={[Math.PI / 2 + 0.14, sign * 0.12, -sign * (1.28 + idx * 0.09)]}
                >
                  <meshPhysicalMaterial
                    map={plumage.map}
                    color="#f0abfc"
                    emissive="#a855f7"
                    emissiveIntensity={0.48}
                    roughness={0.34}
                    iridescence={0.95}
                    sheen={0.8}
                    sheenColor="#fde047"
                  />
                </mesh>
              ))}

              {/* Articulated Outer Forearm & Long Primary Flight Feather Fan (7 radiant blades) */}
              <group
                ref={side === 'left' ? leftForearmRef : rightForearmRef}
                position={[sign * 0.3, 0, -0.06]}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <mesh
                    key={`prim-${idx}`}
                    geometry={geoms.outerFeather}
                    position={[sign * (0.02 + idx * 0.035), 0.005, 0.01 - idx * 0.016]}
                    rotation={[Math.PI / 2 + 0.08, sign * 0.08, -sign * (1.42 + idx * 0.11)]}
                  >
                    <meshPhysicalMaterial
                      map={plumage.map}
                      color={idx >= 4 ? '#fde047' : '#f472b6'}
                      emissive={idx >= 4 ? '#f59e0b' : '#d946ef'}
                      emissiveIntensity={idx >= 4 ? 0.85 : 0.58}
                      roughness={0.28}
                      iridescence={1.0}
                    />
                  </mesh>
                ))}
              </group>
            </group>
          );
        })}

        {/* 5 Long Undulating Silk Tail Plumes with Glowing Peacock-Eye Medallions */}
        {[-0.08, -0.04, 0, 0.04, 0.08].map((tx, idx) => (
          <group
            key={`phx-tail-${idx}`}
            ref={(el) => {
              tailGroupRefs.current[idx] = el;
            }}
            position={[tx, -0.05, -0.2]}
            scale={[1, 1, idx === 2 ? 1.18 : idx === 1 || idx === 3 ? 1.0 : 0.82]}
          >
            <mesh geometry={geoms.tailRibbon}>
              <meshPhysicalMaterial
                color={idx === 2 ? '#fde047' : '#e879f9'}
                emissive={idx === 2 ? '#f59e0b' : '#c026d3'}
                emissiveIntensity={0.78}
                roughness={0.25}
                iridescence={1.0}
              />
            </mesh>
            {/* Glowing Mythical Tail Eye Medallion */}
            <mesh position={[0, 0.02, -0.74]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.008, 16]} />
              <meshBasicMaterial color={idx % 2 === 0 ? '#fde047' : '#00F5FF'} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

/* ================= 3. MYTHICAL SPIRIT FOX (LINH HỒ NGỌC BÍCH — BAN NHÂN SỰ) ================= */
const MythicalSpiritFoxMascot: React.FC<{ hovered: boolean }> = ({ hovered }) => {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const tailRefs = useRef<Array<THREE.Group | null>>([]);
  const spiritOrbRef = useRef<THREE.Mesh>(null);

  const fur = useMemo(() => createFoxFurMaps(), []);

  const geoms = useMemo(() => {
    // Organic seated fox torso (broad chest tapering smoothly into seated haunches)
    const torsoPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.145, 0.02),
      new THREE.Vector2(0.165, 0.1),
      new THREE.Vector2(0.135, 0.22),
      new THREE.Vector2(0.142, 0.33),
      new THREE.Vector2(0.11, 0.42),
      new THREE.Vector2(0.072, 0.48),
      new THREE.Vector2(0.0, 0.5),
    ];
    const torso = new THREE.LatheGeometry(torsoPts, 36);
    torso.computeVertexNormals();

    // Smooth anatomical fox snout (tapered organic muzzle bridge, not a sharp cone!)
    const snout = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0.015, 0),
        new THREE.Vector3(0, 0.004, 0.058),
        new THREE.Vector3(0, -0.012, 0.115),
        new THREE.Vector3(0, -0.016, 0.155),
      ],
      (t) => 0.068 * Math.pow(1 - t * 0.72, 0.9),
      18,
      16,
      1.1,
      0.82
    );

    // Sculpted agile front leg
    const leg = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0.24, -0.02),
        new THREE.Vector3(0, 0.14, 0.015),
        new THREE.Vector3(0, 0.04, 0.01),
        new THREE.Vector3(0, 0.01, 0.048),
      ],
      (t) => (t > 0.8 ? 0.032 : 0.038 - t * 0.014),
      18,
      12
    );

    // Lush S-curved mythical spirit fox tail (plump bushy middle tapering to fine spirit flame tip!)
    const spiritTail = createTaperedTubeGeometry(
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.08, -0.14),
        new THREE.Vector3(0, 0.24, -0.22),
        new THREE.Vector3(0, 0.39, -0.17),
        new THREE.Vector3(0, 0.51, -0.25),
      ],
      (t) => {
        if (t < 0.15) return 0.032 + t * 0.22;
        if (t < 0.72) return 0.065 + Math.sin(((t - 0.15) / 0.57) * Math.PI) * 0.035;
        return Math.max(0.004, 0.065 * Math.pow((1 - t) / 0.28, 1.1));
      },
      26,
      14
    );

    // Hollowed sculpted outer fox ear shell
    const earShape = new THREE.Shape();
    earShape.moveTo(-0.052, 0);
    earShape.bezierCurveTo(-0.058, 0.08, -0.025, 0.17, 0, 0.21);
    earShape.bezierCurveTo(0.025, 0.17, 0.058, 0.08, 0.052, 0);
    earShape.closePath();
    const ear = new THREE.ExtrudeGeometry(earShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.006,
      bevelSegments: 3,
      curveSegments: 16,
    });
    ear.computeVertexNormals();

    return { torso, snout, leg, spiritTail, ear };
  }, []);

  useEffect(() => {
    return () => {
      fur.map.dispose();
      fur.bumpMap.dispose();
      Object.values(geoms).forEach((g) => g.dispose());
    };
  }, [fur, geoms]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (rootRef.current) {
      const targetScale = hovered ? 1.07 : 1.0;
      rootRef.current.scale.setScalar(THREE.MathUtils.lerp(rootRef.current.scale.x, targetScale, dt * 6));
    }

    // Attentive lifelike fox head scan & playful sideways tilt
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.92) * 0.36;
      headRef.current.rotation.z = Math.cos(t * 1.25) * 0.11;
      headRef.current.rotation.x = Math.sin(t * 0.7) * 0.05;
    }

    // Natural ear perk & listening twitch
    const twitch = (t % 3.4) > 3.15 ? Math.sin(t * 34) * 0.16 : 0;
    if (leftEarRef.current) leftEarRef.current.rotation.z = 0.24 + twitch;
    if (rightEarRef.current) rightEarRef.current.rotation.z = -0.24 - twitch * 0.5;

    // 5 Mythical Kitsune Spirit Tails undulating organically in phase waves
    const wagSpeed = hovered ? 3.8 : 2.1;
    for (let i = 0; i < 5; i += 1) {
      const tg = tailRefs.current[i];
      if (!tg) continue;
      const spreadAngle = (i - 2) * 0.36;
      tg.rotation.y = spreadAngle + Math.sin(t * wagSpeed - i * 0.65) * 0.16;
      tg.rotation.z = spreadAngle * 0.45 + Math.cos(t * 1.7 - i * 0.5) * 0.08;
    }

    // Orbiting sacred jade spirit pearl
    if (spiritOrbRef.current) {
      spiritOrbRef.current.position.set(
        Math.cos(t * 1.4) * 0.28,
        0.58 + Math.sin(t * 2.2) * 0.05,
        Math.sin(t * 1.4) * 0.28
      );
    }
  });

  return (
    <group ref={rootRef} position={[0, 1.01, 0]}>
      {/* Floating Sacred Jade Spirit Orb orbiting the Spirit Fox */}
      <mesh ref={spiritOrbRef} position={[0.28, 0.58, 0]}>
        <sphereGeometry args={[0.036, 18, 14]} />
        <meshBasicMaterial color="#6ee7b7" toneMapped={false} />
      </mesh>

      {/* Organic Seated Fox Torso with Plush Velvet Fur */}
      <mesh geometry={geoms.torso} position={[0, 0, -0.02]} scale={[0.92, 1.0, 1.08]} castShadow>
        <meshPhysicalMaterial
          map={fur.map}
          bumpMap={fur.bumpMap}
          bumpScale={0.012}
          color="#a7f3d0"
          emissive="#047857"
          emissiveIntensity={0.22}
          roughness={0.68}
          sheen={0.92}
          sheenRoughness={0.52}
          sheenColor="#ecfdf5"
        />
      </mesh>

      {/* Seated Sculpted Hind Haunches */}
      {[-0.105, 0.105].map((hx, i) => (
        <mesh key={`haunch-${i}`} position={[hx, 0.11, -0.05]} scale={[0.72, 0.95, 1.12]}>
          <sphereGeometry args={[0.115, 20, 16]} />
          <meshPhysicalMaterial
            map={fur.map}
            bumpMap={fur.bumpMap}
            bumpScale={0.01}
            color="#99f6e4"
            roughness={0.68}
            sheen={0.88}
            sheenColor="#ecfdf5"
          />
        </mesh>
      ))}

      {/* Silky Ivory-Silver Fluffy Chest Ruff */}
      <mesh position={[0, 0.3, 0.11]} scale={[0.78, 1.05, 0.52]}>
        <sphereGeometry args={[0.12, 22, 18]} />
        <meshPhysicalMaterial
          color="#f0fdf4"
          roughness={0.78}
          sheen={0.95}
          sheenColor="#ffffff"
        />
      </mesh>

      {/* Sacred Glowing Jade Collar + Gold Bell */}
      <mesh position={[0, 0.43, 0.01]} rotation={[Math.PI / 2 + 0.14, 0, 0]}>
        <torusGeometry args={[0.105, 0.014, 12, 28]} />
        <meshBasicMaterial color="#34d399" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.395, 0.118]}>
        <sphereGeometry args={[0.024, 14, 12]} />
        <meshPhysicalMaterial color="#fbbf24" metalness={0.95} roughness={0.14} clearcoat={0.8} />
      </mesh>

      {/* Sculpted Agile Front Legs & Paws */}
      {[-0.068, 0.068].map((lx, i) => (
        <mesh key={`fox-leg-${i}`} geometry={geoms.leg} position={[lx, 0.01, 0.095]} castShadow>
          <meshPhysicalMaterial
            map={fur.map}
            color="#d1fae5"
            roughness={0.66}
            sheen={0.85}
            sheenColor="#ffffff"
          />
        </mesh>
      ))}

      {/* 5 Lush Mythical Kitsune Spirit Tails fanning gracefully behind */}
      {[0, 1, 2, 3, 4].map((idx) => (
        <group
          key={`spirit-tail-${idx}`}
          ref={(el) => {
            tailRefs.current[idx] = el;
          }}
          position={[(idx - 2) * 0.032, 0.09, -0.14]}
          scale={[1, idx === 2 ? 1.12 : idx === 1 || idx === 3 ? 0.98 : 0.85, 1]}
        >
          <mesh geometry={geoms.spiritTail} castShadow>
            <meshPhysicalMaterial
              map={fur.map}
              bumpMap={fur.bumpMap}
              bumpScale={0.012}
              color={idx === 2 ? '#d1fae5' : '#99f6e4'}
              emissive="#10b981"
              emissiveIntensity={0.32}
              roughness={0.62}
              sheen={0.95}
              sheenColor="#ecfdf5"
            />
          </mesh>
          {/* Luminous Jade-White Spirit Tip */}
          <mesh position={[0, 0.52, -0.25]}>
            <sphereGeometry args={[0.026, 12, 10]} />
            <meshBasicMaterial color="#d1fae5" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Sculpted Anatomical Spirit Fox Head */}
      <group ref={headRef} position={[0, 0.54, 0.035]}>
        {/* Cranium & Sculpted Cheeks */}
        <mesh scale={[1.08, 0.9, 1.02]} castShadow>
          <sphereGeometry args={[0.125, 28, 22]} />
          <meshPhysicalMaterial
            map={fur.map}
            bumpMap={fur.bumpMap}
            bumpScale={0.01}
            color="#a7f3d0"
            emissive="#047857"
            emissiveIntensity={0.18}
            roughness={0.66}
            sheen={0.9}
            sheenColor="#ecfdf5"
          />
        </mesh>
        {/* Fluffy Ivory Cheek Whisker Tufts */}
        {[-0.092, 0.092].map((cx, i) => (
          <mesh key={`cheek-${i}`} position={[cx, -0.024, 0.04]} scale={[0.92, 0.62, 0.78]}>
            <sphereGeometry args={[0.064, 16, 14]} />
            <meshPhysicalMaterial color="#f0fdf4" roughness={0.78} sheen={0.9} />
          </mesh>
        ))}

        {/* Tapered Organic Fox Muzzle + Glossy Nose Tip */}
        <mesh geometry={geoms.snout} position={[0, -0.02, 0.082]}>
          <meshPhysicalMaterial color="#ecfdf5" roughness={0.72} sheen={0.85} />
        </mesh>
        <mesh position={[0, -0.034, 0.242]}>
          <sphereGeometry args={[0.02, 14, 12]} />
          <meshPhysicalMaterial color="#0b101a" roughness={0.15} metalness={0.2} clearcoat={1} />
        </mesh>

        {/* Expressive Almond-Shaped Mythical Spirit Eyes + Golden Forehead Crest */}
        {[-0.056, 0.056].map((ex, i) => (
          <group key={`fox-eye-${i}`} position={[ex, 0.024, 0.105]} rotation={[0, ex * 2.4, ex * -1.4]}>
            <mesh scale={[1.25, 0.72, 0.65]}>
              <sphereGeometry args={[0.022, 14, 12]} />
              <meshBasicMaterial color="#6ee7b7" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.013]} scale={[0.35, 0.85, 0.4]}>
              <sphereGeometry args={[0.016, 10, 8]} />
              <meshBasicMaterial color="#041210" />
            </mesh>
          </group>
        ))}
        {/* Sacred Forehead Spirit Mark */}
        <mesh position={[0, 0.06, 0.115]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.024, 0.024, 0.008]} />
          <meshBasicMaterial color="#fde047" toneMapped={false} />
        </mesh>

        {/* Sculpted Concave Articulated Fox Ears (Outer Emerald Shell + Recessed Cream Pinna) */}
        <group ref={leftEarRef} position={[-0.082, 0.092, -0.01]} rotation={[0.14, -0.18, 0.24]}>
          <mesh geometry={geoms.ear}>
            <meshPhysicalMaterial map={fur.map} color="#6ee7b7" roughness={0.62} sheen={0.85} />
          </mesh>
          <mesh geometry={geoms.ear} position={[0, 0.015, 0.014]} scale={[0.65, 0.76, 0.4]}>
            <meshStandardMaterial color="#f0fdf4" roughness={0.8} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.082, 0.092, -0.01]} rotation={[0.14, 0.18, -0.24]}>
          <mesh geometry={geoms.ear}>
            <meshPhysicalMaterial map={fur.map} color="#6ee7b7" roughness={0.62} sheen={0.85} />
          </mesh>
          <mesh geometry={geoms.ear} position={[0, 0.015, 0.014]} scale={[0.65, 0.76, 0.4]}>
            <meshStandardMaterial color="#f0fdf4" roughness={0.8} />
          </mesh>
        </group>
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
      <RoundedBox args={[0.26, 0.24, 0.42]} radius={0.028} smoothness={4}>
        <meshStandardMaterial color="#101b33" metalness={0.86} roughness={0.2} />
      </RoundedBox>
      {[-0.135, 0.135].map((sx, i) => (
        <mesh key={`cam-stripe-${i}`} position={[sx, 0, 0]}>
          <boxGeometry args={[0.01, 0.032, 0.34]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} />
        </mesh>
      ))}
      <group position={[0, -0.01, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.095, 0.088, 0.18, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <torusGeometry args={[0.096, 0.01, 10, 32]} />
          <meshBasicMaterial color="#00F5FF" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.078, 32]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#00F5FF"
            emissiveIntensity={0.65}
            metalness={0.9}
            roughness={0.08}
          />
        </mesh>
      </group>
      <mesh ref={reel1Ref} position={[0, 0.22, -0.1]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.095, 0.022, 12, 32]} />
        <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.25} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh ref={reel2Ref} position={[0, 0.22, 0.1]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.085, 0.022, 12, 32]} />
        <meshStandardMaterial color="#334155" emissive="#00F5FF" emissiveIntensity={0.25} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0.09, 0.17, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.24} />
      </mesh>
      <mesh position={[-0.22, 0.01, -0.04]} rotation={[0, -0.35, 0]}>
        <boxGeometry args={[0.16, 0.11, 0.016]} />
        <meshStandardMaterial color="#091529" emissive="#38bdf8" emissiveIntensity={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[0.09, 0.1, 0.215]}>
        <sphereGeometry args={[0.018, 12, 10]} />
        <meshBasicMaterial ref={recLightRef} color="#ff2a55" transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0.2, 0]}>
        <torusGeometry args={[0.36, 0.009, 10, 48]} />
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
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.026, 16, 40]} />
        <meshPhysicalMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.38}
          metalness={0.96}
          roughness={0.14}
          clearcoat={0.8}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.185, 0.165, 0.1, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#f59e0b"
          emissive="#fbbf24"
          emissiveIntensity={0.32}
          metalness={0.96}
          roughness={0.16}
          clearcoat={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 8 }).map((_, idx) => {
        const angle = (idx / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 0.175;
        const rz = Math.sin(angle) * 0.175;
        const isMain = idx % 2 === 0;
        const h = isMain ? 0.16 : 0.11;
        return (
          <group key={`spire-${idx}`} position={[rx, 0.06, rz]}>
            <mesh position={[0, h / 2, 0]}>
              <coneGeometry args={[0.028, h, 6]} />
              <meshPhysicalMaterial
                color="#fde047"
                emissive="#f59e0b"
                emissiveIntensity={0.42}
                metalness={0.96}
                roughness={0.14}
                clearcoat={0.85}
              />
            </mesh>
            <mesh position={[0, h + 0.018, 0]}>
              <octahedronGeometry args={[isMain ? 0.024 : 0.016, 0]} />
              <meshBasicMaterial color={isMain ? '#00F5FF' : '#fde047'} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.06, 0]}>
        <octahedronGeometry args={[0.065, 0]} />
        <meshBasicMaterial color="#00F5FF" toneMapped={false} />
      </mesh>
      <mesh ref={outerRingRef}>
        <torusGeometry args={[0.34, 0.011, 12, 48]} />
        <meshBasicMaterial color="#fbbf24" toneMapped={false} />
      </mesh>
      <mesh ref={innerRingRef}>
        <torusGeometry args={[0.28, 0.008, 12, 44]} />
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

        <mesh position={[0, -0.492, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.36, 0.42, 36]} />
          <meshBasicMaterial
            color={cfg.accent}
            transparent
            opacity={hovered ? 0.9 : 0.48}
            toneMapped={false}
          />
        </mesh>

        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.35, 0.38, 0.08, 32]} />
          <meshStandardMaterial
            color="#0a1222"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.9}
            roughness={0.22}
          />
        </mesh>

        <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.27, 0.3, 0.88, 32]} />
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

        <mesh position={[0, 0.47, 0]}>
          <cylinderGeometry args={[0.32, 0.3, 0.055, 32]} />
          <meshStandardMaterial color="#13213a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.498, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.28, 36]} />
          <meshBasicMaterial color={cfg.accent} toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Anti-Glare Front Nameplate Plaque */}
      <group position={[0, 0.54, 0.32]} rotation={[-0.22, 0, 0]}>
        <RoundedBox args={[0.56, 0.2, 0.022]} radius={0.01} smoothness={3}>
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

      {/* Custom Mythical Sculpted 3D Living Mascot OR Rotating 3D Artifact */}
      {cfg.kind === 'owl' && <MythicalOwlMascot hovered={hovered} />}
      {cfg.kind === 'phoenix' && <MythicalPhoenixMascot hovered={hovered} />}
      {cfg.kind === 'fox' && <MythicalSpiritFoxMascot hovered={hovered} />}
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
