import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps } from '../utils/proceduralMaterials';
import type { Department, ExecutiveMember, HoverPreview } from '../../../types/heritage';

const CURRENT_TERM = 'Nhiệm kỳ 2026 - 2027';

// True natural aspect ratio of pre-styled TechTonic portrait cards (~0.70 - 0.72)
const PORTRAIT_CANVAS_W = 568;
const PORTRAIT_CANVAS_H = 800; // aspect = 0.71 exactly

interface DeptWallTreeConfig {
  dept: Department;
  title: string;
  accent: string;
  position: [number, number, number];
  rotationY: number;
  bannerWidth: number;
  rowSteps: [number, number, number];
  cardWidth: [number, number]; // [row1&2 card width, row3 card width]
}

// Each Department has its own dedicated wall tree positioned comfortably at museum eye height
const DEPT_WALL_TREES: DeptWallTreeConfig[] = [
  {
    dept: 'Ban Sự Kiện',
    title: 'BAN SỰ KIỆN • NHIỆM KỲ 2026–2027',
    accent: '#a855f7',
    position: [16.52, 0, -15.1],
    rotationY: -Math.PI / 2,
    bannerWidth: 4.3,
    rowSteps: [0, 1.08, 1.12],
    cardWidth: [0.68, 0.68],
  },
  {
    dept: 'Ban Chuyên Môn',
    title: 'BAN CHUYÊN MÔN • NHIỆM KỲ 2026–2027',
    accent: '#38bdf8',
    position: [-16.52, 0, -15.1],
    rotationY: Math.PI / 2,
    bannerWidth: 4.3,
    rowSteps: [0, 1.18, 1.18],
    cardWidth: [0.68, 0.68],
  },
  {
    dept: 'Ban Truyền Thông',
    title: 'BAN TRUYỀN THÔNG • NHIỆM KỲ 2026–2027',
    accent: '#f59e0b',
    position: [-5.8, 0, 8.05],
    rotationY: Math.PI,
    bannerWidth: 4.6,
    rowSteps: [0, 0, 0.76],
    cardWidth: [0.68, 0.6],
  },
  {
    dept: 'Ban Nhân Sự',
    title: 'BAN NHÂN SỰ (2026–2027)',
    accent: '#34d399',
    position: [4.4, 0, 8.05],
    rotationY: Math.PI,
    bannerWidth: 2.4,
    rowSteps: [0, 0, 0],
    cardWidth: [0.68, 0.68],
  },
  {
    dept: 'Ban Chủ Nhiệm',
    title: 'BAN CHỦ NHIỆM (2026–2027)',
    accent: '#fbbf24',
    position: [14.8, 0, 8.05],
    rotationY: Math.PI,
    bannerWidth: 2.5,
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

function createBannerTexture(title: string, accent: string, memberCount: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c1526';
    ctx.fillRect(0, 0, 1024, 128);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 1016, 120);

    ctx.fillStyle = accent;
    ctx.fillRect(4, 4, 12, 120);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px Inter, sans-serif';
    ctx.fillText(title, 512, 58, 960);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.fillText(`SƠ ĐỒ CÂY NHÂN SỰ (${memberCount} THÀNH VIÊN)`, 512, 100, 960);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

function createPortraitFallbackTexture(member: ExecutiveMember, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = PORTRAIT_CANVAS_W;
  canvas.height = PORTRAIT_CANVAS_H;
  const ctx = canvas.getContext('2d');
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
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createPortraitLabelTexture(member: ExecutiveMember, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 568;
  canvas.height = 148;
  const ctx = canvas.getContext('2d');
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
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
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
      const canvas = document.createElement('canvas');
      canvas.width = PORTRAIT_CANVAS_W;
      canvas.height = PORTRAIT_CANVAS_H;
      const ctx = canvas.getContext('2d');
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
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      setPhotoTex(tex);
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
        <meshBasicMaterial map={photoTex ?? fallbackTex} />
      </mesh>

      <mesh position={[0, labelY, 0.006]}>
        <planeGeometry args={[innerW, labelH]} />
        <meshBasicMaterial map={labelTex} />
      </mesh>
    </group>
  );
};

const DepartmentPortraitTree: React.FC<{
  config: DeptWallTreeConfig;
  members: ExecutiveMember[];
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ config, members, metalMaps }) => {
  const row1 = members.filter((m) => classifyTier(m.role) === 1);
  const row2 = members.filter((m) => classifyTier(m.role) === 2);
  const row3 = members.filter((m) => classifyTier(m.role) === 3);

  const bannerTex = useMemo(
    () => createBannerTexture(config.title, config.accent, members.length),
    [config.title, config.accent, members.length]
  );

  useEffect(() => {
    return () => {
      bannerTex.dispose();
    };
  }, [bannerTex]);

  // Lowered natural eye-height layout (y = 1.02 .. 3.70, banner at y = 4.46 instead of 5.52)
  const row1Y = 3.7;
  const row2Y = 2.36;
  const row3Y = 1.04;
  const [normW, row3W] = config.cardWidth;
  const cardH = computeCardMetrics(normW).height;
  const row3H = computeCardMetrics(row3W).height;

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
      {/* Wall Section Title Banner comfortably at eye-visible upper height */}
      <group position={[0, 4.5, 0]}>
        <RoundedBox position={[0, 0, -0.025]} args={[config.bannerWidth, 0.42, 0.045]} radius={0.02} smoothness={4}>
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[config.bannerWidth - 0.1, 0.34]} />
          <meshBasicMaterial map={bannerTex} />
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
      {DEPT_WALL_TREES.map((config) => (
        <DepartmentPortraitTree
          key={`wall-tree-${config.dept}`}
          config={config}
          members={currentMembers.filter((m) => m.department === config.dept)}
          metalMaps={metalMaps}
        />
      ))}
    </group>
  );
};
