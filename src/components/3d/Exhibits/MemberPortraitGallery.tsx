import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps } from '../utils/proceduralMaterials';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { Department, ExecutiveMember, HoverPreview } from '../../../types/heritage';

const CURRENT_TERM = 'Nhiệm kỳ 2026 - 2027';

// True natural aspect ratio of pre-styled TechTonic portrait cards (~0.70 - 0.72)
const PORTRAIT_CANVAS_W = 568;
const PORTRAIT_CANVAS_H = 800; // aspect = 0.71 exactly

interface DeptWallTreeConfig {
  dept: Department;
  title: string;
  description: string;
  accent: string;
  stageGlow: string;
  position: [number, number, number];
  rotationY: number;
  bannerWidth: number;
  rowSteps: [number, number, number];
  cardWidth: [number, number]; // [row1&2 card width, row3 card width]
}

// Each Department has its own dedicated wall tree & color-matched stage spotlight rig
const DEPT_WALL_TREES: DeptWallTreeConfig[] = [
  {
    dept: 'Ban Sự Kiện',
    title: 'BAN SỰ KIỆN • NHIỆM KỲ 2026–2027',
    description: 'Tổ chức & điều phối các chương trình kết nối — tạo dấu ấn hình ảnh CLB',
    accent: '#c084fc',
    stageGlow: '#a855f7',
    position: [16.52, 0, -15.1],
    rotationY: -Math.PI / 2,
    bannerWidth: 4.5,
    rowSteps: [0, 1.08, 1.12],
    cardWidth: [0.68, 0.68],
  },
  {
    dept: 'Ban Chuyên Môn',
    title: 'BAN CHUYÊN MÔN • NHIỆM KỲ 2026–2027',
    description: 'Tổ chức hoạt động học thuật chuyên sâu, dự án FE/BE/AI & định hướng thi đấu',
    accent: '#00E5FF',
    stageGlow: '#00F0FF',
    position: [-16.52, 0, -15.1],
    rotationY: Math.PI / 2,
    bannerWidth: 4.5,
    rowSteps: [0, 1.18, 1.18],
    cardWidth: [0.68, 0.68],
  },
  {
    dept: 'Ban Truyền Thông',
    title: 'BAN TRUYỀN THÔNG • NHIỆM KỲ 2026–2027',
    description: 'Sáng tạo nội dung, thiết kế ấn phẩm & lan tỏa hình ảnh CLB đến cộng đồng',
    accent: '#fb923c',
    stageGlow: '#f97316',
    position: [-5.8, 0, 8.05],
    rotationY: Math.PI,
    bannerWidth: 4.8,
    rowSteps: [0, 0, 0.76],
    cardWidth: [0.68, 0.6],
  },
  {
    dept: 'Ban Nhân Sự',
    title: 'BAN NHÂN SỰ (2026–2027)',
    description: 'Phụ trách gây quỹ, đối ngoại, hồ sơ nhân sự & hậu cần vận hành CLB',
    accent: '#34d399',
    stageGlow: '#10b981',
    position: [4.4, 0, 8.05],
    rotationY: Math.PI,
    bannerWidth: 3.0,
    rowSteps: [0, 0, 0],
    cardWidth: [0.68, 0.68],
  },
  {
    dept: 'Ban Chủ Nhiệm',
    title: 'BAN CHỦ NHIỆM (2026–2027)',
    description: 'Điều hành chiến lược, giám sát vận hành & phối hợp toàn diện các ban',
    accent: '#fbbf24',
    stageGlow: '#f59e0b',
    position: [14.8, 0, 8.05],
    rotationY: Math.PI,
    bannerWidth: 3.0,
    rowSteps: [0, 1.04, 0],
    cardWidth: [0.68, 0.68],
  },
];

function classifyTier(role: string): 1 | 2 | 3 {
  const lower = role.toLowerCase();
  if (lower.includes('chủ nhiệm') && !lower.includes('phó')) return 1;
  if (lower.includes('trưởng ban')) return 1;
  if (lower.includes('phó chủ nhiệm') || lower.includes('phó ban')) return 2;
  return 3;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function createBannerTexture(title: string, description: string, accent: string): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(1152, 136, 2);
  if (ctx) {
    ctx.fillStyle = '#0c1526';
    ctx.fillRect(0, 0, 1152, 136);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 1144, 128);

    ctx.fillStyle = accent;
    ctx.fillRect(4, 4, 12, 128);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px Inter, sans-serif';
    ctx.fillText(title, 576, 56, 1080);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText(description, 576, 104, 1080);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

function createPortraitFallbackTexture(member: ExecutiveMember, accent: string): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(PORTRAIT_CANVAS_W, PORTRAIT_CANVAS_H, 2);
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, PORTRAIT_CANVAS_W, PORTRAIT_CANVAS_H);
    grad.addColorStop(0, '#0f1b31');
    grad.addColorStop(1, '#162744');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PORTRAIT_CANVAS_W, PORTRAIT_CANVAS_H);

    ctx.beginPath();
    ctx.arc(PORTRAIT_CANVAS_W / 2, 340, 132, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1426';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = 'bold 96px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(getInitials(member.name), PORTRAIT_CANVAS_W / 2, 372);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillText('TECHTONIC CLUB', PORTRAIT_CANVAS_W / 2, 570);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

function createPortraitLabelTexture(member: ExecutiveMember, accent: string): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(568, 148, 2);
  if (ctx) {
    ctx.fillStyle = '#0c1526';
    ctx.fillRect(0, 0, 568, 148);

    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 568, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 31px Inter, sans-serif';
    ctx.fillText(member.name, 284, 60, 530);

    ctx.fillStyle = accent;
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.fillText(`${member.role} • ${member.department}`, 284, 108, 530);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

function createStageGlowTexture(hexColor: string, intensityAlpha = 0.88): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const col = new THREE.Color(hexColor);
    const r = Math.round(col.r * 255);
    const g = Math.round(col.g * 255);
    const b = Math.round(col.b * 255);
    const grad = ctx.createRadialGradient(128, 128, 6, 128, 128, 126);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensityAlpha})`);
    grad.addColorStop(0.32, `rgba(${r}, ${g}, ${b}, ${(intensityAlpha * 0.52).toFixed(3)})`);
    grad.addColorStop(0.68, `rgba(${r}, ${g}, ${b}, ${(intensityAlpha * 0.16).toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 8, srgb: true });
}

const ConnectorLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  accent: string;
}> = ({ x1, y1, x2, y2, accent }) => {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  if (dx < 0.001 && dy < 0.001) return null;
  const thickness = 0.022;
  return (
    <group>
      <mesh position={[(x1 + x2) / 2, (y1 + y2) / 2, -0.015]}>
        <boxGeometry args={[Math.max(dx, thickness), Math.max(dy, thickness), 0.016]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.55}
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[x1, y1, -0.012]}>
        <sphereGeometry args={[0.02, 10, 8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.75} />
      </mesh>
    </group>
  );
};

function computeCardMetrics(width: number) {
  const innerW = width - 0.07;
  // Exact 0.71 portrait photo aspect ratio (matches 568x800 CanvasTexture 1:1 with zero stretch)
  const photoH = innerW / (PORTRAIT_CANVAS_W / PORTRAIT_CANVAS_H);
  const labelH = innerW * 0.255;
  const height = photoH + labelH + 0.11;
  return { innerW, photoH, labelH, height };
}

const PortraitCard: React.FC<{
  member: ExecutiveMember;
  x: number;
  y: number;
  width: number;
  accent: string;
  isTopTier: boolean;
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ member, x, y, width, accent, isTopTier, metalMaps }) => {
  const { setHoveringInteractive, openExecutiveBoard } = useHeritageStore();
  const [hovered, setHovered] = useState(false);
  const [photoTex, setPhotoTex] = useState<THREE.CanvasTexture | null>(null);

  const { innerW, photoH, labelH, height } = computeCardMetrics(width);
  const fallbackTex = useMemo(() => createPortraitFallbackTexture(member, accent), [member, accent]);
  const labelTex = useMemo(() => createPortraitLabelTexture(member, accent), [member, accent]);

  // Draw pre-styled member portrait cards with true aspect-preserving fit (no stretching, no clipping!)
  useEffect(() => {
    if (!member.avatar) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const { canvas, ctx } = createHiResCanvas(PORTRAIT_CANVAS_W, PORTRAIT_CANVAS_H, 2);
      if (ctx) {
        ctx.fillStyle = '#0d172a';
        ctx.fillRect(0, 0, PORTRAIT_CANVAS_W, PORTRAIT_CANVAS_H);

        const targetRatio = PORTRAIT_CANVAS_W / PORTRAIT_CANVAS_H;
        const imgRatio = img.width / img.height;
        let dw = PORTRAIT_CANVAS_W;
        let dh = PORTRAIT_CANVAS_H;
        let dx = 0;
        let dy = 0;

        // Object-fit: contain inside exact 0.71 portrait canvas -> preserves entire card graphics without distortion
        if (imgRatio > targetRatio) {
          dh = PORTRAIT_CANVAS_W / imgRatio;
          dy = (PORTRAIT_CANVAS_H - dh) / 2;
        } else {
          dw = PORTRAIT_CANVAS_H * imgRatio;
          dx = (PORTRAIT_CANVAS_W - dw) / 2;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
      }
      setPhotoTex(finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true }));
    };
    img.src = member.avatar;

    return () => {
      cancelled = true;
    };
  }, [member.avatar]);

  useEffect(() => {
    return () => {
      fallbackTex.dispose();
      labelTex.dispose();
      photoTex?.dispose();
    };
  }, [fallbackTex, labelTex, photoTex]);

  const preview: HoverPreview = useMemo(
    () => ({
      title: member.name,
      badge: `${member.department.toUpperCase()} • ${member.term}`,
      summary: member.bio ?? `${member.role} — ${member.department}`,
      bullets: [`Chức vụ: ${member.role}`, `Nhiệm kỳ: ${member.term}`],
      actionLabel: `Mở hồ sơ ${member.department}`,
    }),
    [member]
  );

  const handleOpen = () => openExecutiveBoard(member.department, CURRENT_TERM);
  const photoY = height / 2 - 0.045 - photoH / 2;
  const labelY = -height / 2 + 0.04 + labelH / 2;

  return (
    <group
      position={[x, y, hovered ? 0.025 : 0.01]}
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveringInteractive(true, `${member.name} (${member.role})`, handleOpen, preview);
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveringInteractive(false);
      }}
    >
      <RoundedBox position={[0, 0, -0.025]} args={[width, height, 0.05]} radius={0.02} smoothness={4} castShadow>
        <meshStandardMaterial
          color={isTopTier ? '#2b3954' : '#223048'}
          roughnessMap={metalMaps.roughnessMap}
          bumpMap={metalMaps.bumpMap}
          bumpScale={0.004}
          emissive={accent}
          emissiveIntensity={hovered ? 0.48 : isTopTier ? 0.2 : 0.08}
          metalness={0.86}
          roughness={0.24}
        />
      </RoundedBox>

      <mesh position={[0, photoY, 0.006]}>
        <planeGeometry args={[innerW, photoH]} />
        <meshStandardMaterial
          map={photoTex ?? fallbackTex}
          emissive="#ffffff"
          emissiveMap={photoTex ?? fallbackTex}
          emissiveIntensity={hovered ? 0.44 : 0.3}
          roughness={0.88}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, labelY, 0.006]}>
        <planeGeometry args={[innerW, labelH]} />
        <meshStandardMaterial
          map={labelTex}
          emissive="#ffffff"
          emissiveMap={labelTex}
          emissiveIntensity={hovered ? 0.46 : 0.34}
          roughness={0.88}
          metalness={0}
        />
      </mesh>
    </group>
  );
};

const DepartmentPortraitTree: React.FC<{
  config: DeptWallTreeConfig;
  members: ExecutiveMember[];
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  phaseOffset: number;
}> = ({ config, members, metalMaps, phaseOffset }) => {
  const row1 = members.filter((m) => classifyTier(m.role) === 1);
  const row2 = members.filter((m) => classifyTier(m.role) === 2);
  const row3 = members.filter((m) => classifyTier(m.role) === 3);

  const stageTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const colorSpotRef = useRef<THREE.SpotLight>(null);
  const outerBeamMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const wallAuraMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const bannerTex = useMemo(
    () => createBannerTexture(config.title, config.description, config.accent),
    [config.title, config.description, config.accent]
  );
  const stageGlowTex = useMemo(
    () => createStageGlowTexture(config.stageGlow, 0.9),
    [config.stageGlow]
  );

  useEffect(() => {
    return () => {
      bannerTex.dispose();
      stageGlowTex.dispose();
    };
  }, [bannerTex, stageGlowTex]);

  useFrame((state) => {
    const pulse = Math.sin(state.clock.elapsedTime * 1.45 + phaseOffset) * 0.5 + 0.5;
    if (colorSpotRef.current) {
      colorSpotRef.current.intensity = 38 + pulse * 8;
    }
    if (outerBeamMatRef.current) {
      outerBeamMatRef.current.opacity = 0.07 + pulse * 0.025;
    }
    if (wallAuraMatRef.current) {
      wallAuraMatRef.current.opacity = 0.32 + pulse * 0.09;
    }
  });

  // Lowered natural eye-height layout (y = 1.02 .. 3.70, banner at y = 4.46 instead of 5.52)
  const row1Y = 3.7;
  const row2Y = 2.36;
  const row3Y = 1.04;
  const [normW, row3W] = config.cardWidth;
  const cardH = computeCardMetrics(normW).height;
  const row3H = computeCardMetrics(row3W).height;
  const isWideTree = config.bannerWidth > 3.8;
  const beamRadiusBottom = isWideTree ? 2.45 : 1.72;

  const layoutRow = (list: ExecutiveMember[], step: number, y: number, w: number) =>
    list.map((m, idx) => ({
      member: m,
      x: (idx - (list.length - 1) / 2) * step,
      y,
      w,
    }));

  const r1Nodes = layoutRow(row1, config.rowSteps[0], row1Y, normW);
  const r2Nodes = layoutRow(row2, config.rowSteps[1], row2Y, normW);
  const r3Nodes = layoutRow(row3, config.rowSteps[2], row3Y, row3W);

  const bus1Y = (row1Y - cardH / 2 + (row2Y + cardH / 2)) / 2;
  const bus2Y = (row2Y - cardH / 2 + (row3Y + row3H / 2)) / 2;

  return (
    <group position={config.position} rotation={[0, config.rotationY, 0]}>
      {/* Aimed target right at center of this department portrait tree */}
      <primitive object={stageTargetRef.current} position={[0, 2.48, 0.04]} />

      {/* Theatrical Stage Spotlight Fixture + Dual Light Cones aimed squarely at tree */}
      <group position={[0, 5.95, 2.9]} rotation={[0.68, 0, 0]}>
        {/* Ceiling stem & mounting yoke */}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.42, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.24} />
        </mesh>
        {/* Stage PAR/Spot Barrel */}
        <mesh>
          <cylinderGeometry args={[0.16, 0.19, 0.4, 28]} />
          <meshStandardMaterial
            color="#1e293b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.86}
            roughness={0.26}
          />
        </mesh>
        {/* Colored Neon Bezel Collar */}
        <mesh position={[0, -0.19, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.016, 12, 32]} />
          <meshBasicMaterial color={config.stageGlow} toneMapped={false} />
        </mesh>
        {/* Glowing Stage Spotlight Lens */}
        <mesh position={[0, -0.205, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.155, 28]} />
          <meshBasicMaterial color={config.accent} toneMapped={false} />
        </mesh>

        {/* Outer Colored Stage Beam Cone */}
        <mesh position={[0, -2.48, 0]}>
          <cylinderGeometry args={[0.15, beamRadiusBottom, 4.55, 36, 1, true]} />
          <meshBasicMaterial
            ref={outerBeamMatRef}
            color={config.stageGlow}
            transparent
            opacity={0.075}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner Crisp Core Stage Beam */}
        <mesh position={[0, -2.42, 0]}>
          <cylinderGeometry args={[0.08, beamRadiusBottom * 0.56, 4.4, 28, 1, true]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.042}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Real Colored Stage Wash SpotLight + Soft White Key SpotLight (anti-glare balance) */}
      <spotLight
        ref={colorSpotRef}
        position={[0, 5.72, 2.72]}
        target={stageTargetRef.current}
        intensity={42}
        distance={14}
        decay={1.7}
        angle={isWideTree ? 0.64 : 0.5}
        penumbra={0.78}
        color={config.stageGlow}
      />
      <spotLight
        position={[0, 5.72, 2.72]}
        target={stageTargetRef.current}
        intensity={22}
        distance={12}
        decay={1.8}
        angle={isWideTree ? 0.52 : 0.4}
        penumbra={0.76}
        color="#f8fafc"
      />
      {/* Gentle Overhead Stage Wash Fill without frontal glare hotspot */}
      <pointLight
        position={[0, 3.8, 2.25]}
        intensity={3.5}
        distance={8.0}
        decay={2}
        color={config.accent}
      />

      {/* Wall Radial Colored Stage Halo behind Tree */}
      <mesh position={[0, 2.65, -0.02]}>
        <planeGeometry args={[config.bannerWidth + 2.1, 5.1]} />
        <meshBasicMaterial
          ref={wallAuraMatRef}
          map={stageGlowTex}
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Floor Stage Light Puddle & Edge Marker Strip in Front of Tree */}
      <mesh position={[0, 0.013, 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[config.bannerWidth + 1.1, 3.2]} />
        <meshBasicMaterial
          map={stageGlowTex}
          transparent
          opacity={0.52}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.016, 0.05]}>
        <boxGeometry args={[config.bannerWidth - 0.1, 0.02, 0.04]} />
        <meshBasicMaterial color={config.stageGlow} toneMapped={false} />
      </mesh>
      {/* Wall Section Title Banner comfortably at eye-visible upper height */}
      <group position={[0, 4.5, 0]}>
        <RoundedBox position={[0, 0, -0.025]} args={[config.bannerWidth, 0.42, 0.045]} radius={0.02} smoothness={4}>
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[config.bannerWidth - 0.1, 0.34]} />
          <meshStandardMaterial
            map={bannerTex}
            emissive="#ffffff"
            emissiveMap={bannerTex}
            emissiveIntensity={0.4}
            roughness={0.86}
            metalness={0}
          />
        </mesh>
      </group>

      {/* Connector from Row 1 (Trưởng ban) -> Row 2 (Phó ban) */}
      {r1Nodes.length > 0 && r2Nodes.length > 0 && (
        <>
          <ConnectorLine
            x1={r1Nodes[0].x}
            y1={row1Y - cardH / 2}
            x2={r1Nodes[0].x}
            y2={bus1Y}
            accent={config.accent}
          />
          {r2Nodes.length > 1 && (
            <ConnectorLine
              x1={r2Nodes[0].x}
              y1={bus1Y}
              x2={r2Nodes[r2Nodes.length - 1].x}
              y2={bus1Y}
              accent={config.accent}
            />
          )}
          {r2Nodes.map((n) => (
            <ConnectorLine
              key={`c12-${n.member.id}`}
              x1={n.x}
              y1={bus1Y}
              x2={n.x}
              y2={row2Y + cardH / 2}
              accent={config.accent}
            />
          ))}
        </>
      )}

      {/* Connector from Row 2 (Phó ban) -> Row 3 (Thành viên) */}
      {r2Nodes.length > 0 && r3Nodes.length > 0 && (
        <>
          {r2Nodes.length > 1 && (
            <ConnectorLine
              x1={r2Nodes[0].x}
              y1={bus2Y + 0.06}
              x2={r2Nodes[r2Nodes.length - 1].x}
              y2={bus2Y + 0.06}
              accent={config.accent}
            />
          )}
          {r2Nodes.map((n) => (
            <ConnectorLine
              key={`c2d-${n.member.id}`}
              x1={n.x}
              y1={row2Y - cardH / 2}
              x2={n.x}
              y2={r2Nodes.length > 1 ? bus2Y + 0.06 : bus2Y}
              accent={config.accent}
            />
          ))}
          {r2Nodes.length > 1 && (
            <ConnectorLine x1={0} y1={bus2Y + 0.06} x2={0} y2={bus2Y} accent={config.accent} />
          )}
          {r3Nodes.length > 1 && (
            <ConnectorLine
              x1={r3Nodes[0].x}
              y1={bus2Y}
              x2={r3Nodes[r3Nodes.length - 1].x}
              y2={bus2Y}
              accent={config.accent}
            />
          )}
          {r3Nodes.map((n) => (
            <ConnectorLine
              key={`c23-${n.member.id}`}
              x1={n.x}
              y1={bus2Y}
              x2={n.x}
              y2={row3Y + row3H / 2}
              accent={config.accent}
            />
          ))}
        </>
      )}

      {r1Nodes.map((n) => (
        <PortraitCard
          key={n.member.id}
          member={n.member}
          x={n.x}
          y={n.y}
          width={n.w}
          accent={config.accent}
          isTopTier
          metalMaps={metalMaps}
        />
      ))}
      {r2Nodes.map((n) => (
        <PortraitCard
          key={n.member.id}
          member={n.member}
          x={n.x}
          y={n.y}
          width={n.w}
          accent={config.accent}
          isTopTier={false}
          metalMaps={metalMaps}
        />
      ))}
      {r3Nodes.map((n) => (
        <PortraitCard
          key={n.member.id}
          member={n.member}
          x={n.x}
          y={n.y}
          width={n.w}
          accent={config.accent}
          isTopTier={false}
          metalMaps={metalMaps}
        />
      ))}
    </group>
  );
};

export const MemberPortraitGallery: React.FC = () => {
  const { executiveMembers } = useHeritageStore();
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);

  useEffect(() => {
    return () => {
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
    };
  }, [metalMaps]);

  const currentMembers = useMemo(
    () => executiveMembers.filter((m) => m.term === CURRENT_TERM),
    [executiveMembers]
  );

  return (
    <group>
      {DEPT_WALL_TREES.map((config, idx) => (
        <DepartmentPortraitTree
          key={`wall-tree-${config.dept}`}
          config={config}
          members={currentMembers.filter((m) => m.department === config.dept)}
          metalMaps={metalMaps}
          phaseOffset={idx * 1.15}
        />
      ))}
    </group>
  );
};
