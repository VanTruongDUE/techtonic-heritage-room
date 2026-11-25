import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps } from '../utils/proceduralMaterials';
import type { ExecutiveMember, HoverPreview } from '../../../types/heritage';

interface WallSlot {
  position: [number, number, number];
  rotationY: number;
}

const DEPT_ACCENTS: Record<string, string> = {
  'Ban Chủ Nhiệm': '#fbbf24',
  'Ban Chuyên Môn': '#38bdf8',
  'Ban Sự Kiện': '#a855f7',
  'Ban Nhân Sự': '#34d399',
  'Ban Truyền Thông': '#f59e0b',
};

// Clear, non-overlapping museum portrait bays spread harmoniously across Left, Right & Front Hall walls
const PORTRAIT_SLOTS: WallSlot[] = [
  // 1. Left Back Bay (10 portraits: x = -16.52, facing +X, z = -17.4 .. -12.8 — clear of Timeline & pilasters)
  ...[-17.4, -16.25, -15.1, -13.95, -12.8].flatMap((z) => [
    { position: [-16.52, 4.05, z] as [number, number, number], rotationY: Math.PI / 2 },
    { position: [-16.52, 2.52, z] as [number, number, number], rotationY: Math.PI / 2 },
  ]),

  // 2. Right Back Bay (8 portraits: x = 16.52, facing -X, z = -17.3 .. -13.85 — clear of Shirt Alcove)
  ...[-17.3, -16.15, -15.0, -13.85].flatMap((z) => [
    { position: [16.52, 4.05, z] as [number, number, number], rotationY: -Math.PI / 2 },
    { position: [16.52, 2.52, z] as [number, number, number], rotationY: -Math.PI / 2 },
  ]),

  // 3. Front-Left Flanking Bays (8 portraits: z = 8.05, facing -Z, clear on either side of Partners board)
  ...[-15.5, -14.35, -4.95, -3.8].flatMap((x) => [
    { position: [x, 4.05, 8.05] as [number, number, number], rotationY: Math.PI },
    { position: [x, 2.52, 8.05] as [number, number, number], rotationY: Math.PI },
  ]),

  // 4. Front-Right Flanking Bays (8 portraits: z = 8.05, facing -Z, clear on either side of Testimonials board)
  ...[3.8, 4.95, 14.35, 15.5].flatMap((x) => [
    { position: [x, 4.05, 8.05] as [number, number, number], rotationY: Math.PI },
    { position: [x, 2.52, 8.05] as [number, number, number], rotationY: Math.PI },
  ]),
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function createPortraitFallbackTexture(member: ExecutiveMember, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 480, 540);
    grad.addColorStop(0, '#0f1b31');
    grad.addColorStop(1, '#162744');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 540);

    ctx.beginPath();
    ctx.arc(240, 240, 118, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1426';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = 'bold 84px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(getInitials(member.name), 240, 268);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.fillText('TECHTONIC CLUB', 240, 430);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function createPortraitLabelTexture(member: ExecutiveMember, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 148;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c1526';
    ctx.fillRect(0, 0, 512, 148);

    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 512, 6);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 31px Inter, sans-serif';
    ctx.fillText(member.name, 256, 62, 470);

    ctx.fillStyle = accent;
    ctx.font = '600 21px "JetBrains Mono", monospace';
    ctx.fillText(`${member.role} • ${member.department}`, 256, 108, 470);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

const PortraitFrame: React.FC<{
  member: ExecutiveMember;
  slot: WallSlot;
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ member, slot, metalMaps }) => {
  const { setHoveringInteractive, openExecutiveBoard } = useHeritageStore();
  const [hovered, setHovered] = useState(false);
  const [photoTex, setPhotoTex] = useState<THREE.CanvasTexture | null>(null);

  const accent = DEPT_ACCENTS[member.department] ?? '#38bdf8';
  const fallbackTex = useMemo(() => createPortraitFallbackTexture(member, accent), [member, accent]);
  const labelTex = useMemo(() => createPortraitLabelTexture(member, accent), [member, accent]);

  // Load real portrait URL onto cropped square-aspect canvas texture so faces always frame cleanly
  useEffect(() => {
    if (!member.avatar) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 540;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0d172a';
        ctx.fillRect(0, 0, 480, 540);

        const targetRatio = 480 / 540;
        const imgRatio = img.width / img.height;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          // Bias crop cleanly toward upper portrait head/shoulders
          sy = Math.max(0, (img.height - sh) * 0.16);
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 480, 540);
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

  const handleOpen = () =>
    openExecutiveBoard(
      member.department,
      member.term.includes('2026 - 2027') ? 'Nhiệm kỳ 2026 - 2027' : 'all'
    );

  return (
    <group
      position={slot.position}
      rotation={[0, slot.rotationY, 0]}
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
      {/* Museum Brushed Titanium Portrait Frame */}
      <RoundedBox position={[0, 0, -0.025]} args={[0.92, 1.24, 0.05]} radius={0.025} smoothness={4} castShadow>
        <meshStandardMaterial
          color="#24324a"
          roughnessMap={metalMaps.roughnessMap}
          bumpMap={metalMaps.bumpMap}
          bumpScale={0.004}
          emissive={accent}
          emissiveIntensity={hovered ? 0.45 : 0.08}
          metalness={0.86}
          roughness={0.24}
        />
      </RoundedBox>

      {/* Portrait Photo Plane */}
      <mesh position={[0, 0.1, 0.006]}>
        <planeGeometry args={[0.8, 0.9]} />
        <meshBasicMaterial map={photoTex ?? fallbackTex} />
      </mesh>

      {/* Nameplate Strip underneath Portrait */}
      <mesh position={[0, -0.47, 0.006]}>
        <planeGeometry args={[0.8, 0.22]} />
        <meshBasicMaterial map={labelTex} />
      </mesh>
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

  // Prioritize all 29 current-term 2026-2027 members first, then unique Co-Founders up to 34 wall frames
  const displayMembers = useMemo(() => {
    const current = executiveMembers.filter((m) => m.term === 'Nhiệm kỳ 2026 - 2027');
    const seenNames = new Set(current.map((m) => m.name));
    const founders = executiveMembers.filter(
      (m) => m.isFounder && !seenNames.has(m.name)
    );
    return [...current, ...founders].slice(0, PORTRAIT_SLOTS.length);
  }, [executiveMembers]);

  return (
    <group>
      {displayMembers.map((member, idx) => (
        <PortraitFrame
          key={`wall-portrait-${member.id}`}
          member={member}
          slot={PORTRAIT_SLOTS[idx]}
          metalMaps={metalMaps}
        />
      ))}
    </group>
  );
};
