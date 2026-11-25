import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps, createMarbleMaps } from '../utils/proceduralMaterials';
import type { Department, ExecutiveMember, HoverPreview } from '../../../types/heritage';

const TREE_POSITION: [number, number, number] = [-9.6, 0, -12.2];
const TREE_ROTATION: [number, number, number] = [0, Math.PI / 4.2, 0];

type TreeTermFilter = 'ALL' | 'Nhiệm kỳ 2026 - 2027' | 'Nhiệm kỳ 2025 - 2026' | 'Nhiệm kỳ 2024 - 2025';

const TERM_OPTIONS: Array<{ value: TreeTermFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả 3 NK' },
  { value: 'Nhiệm kỳ 2026 - 2027', label: 'NK 2026–2027' },
  { value: 'Nhiệm kỳ 2025 - 2026', label: 'NK 2025–2026' },
  { value: 'Nhiệm kỳ 2024 - 2025', label: '2024–2025 ★' },
];

const DEPT_COLUMNS: Array<{
  dept: Department;
  shortTitle: string;
  accent: string;
  x: number;
}> = [
  { dept: 'Ban Chuyên Môn', shortTitle: 'BAN CHUYÊN MÔN', accent: '#38bdf8', x: -2.18 },
  { dept: 'Ban Sự Kiện', shortTitle: 'BAN SỰ KIỆN', accent: '#a855f7', x: -0.73 },
  { dept: 'Ban Nhân Sự', shortTitle: 'BAN NHÂN SỰ', accent: '#34d399', x: 0.73 },
  { dept: 'Ban Truyền Thông', shortTitle: 'BAN TRUYỀN THÔNG', accent: '#f59e0b', x: 2.18 },
];

function shortTerm(term: string): string {
  return term.replace('Nhiệm kỳ ', 'NK ').replace(' - ', '–');
}

function compactRole(role: string): string {
  if (role.includes('Chủ nhiệm') && !role.includes('Phó Chủ nhiệm')) return 'Chủ nhiệm CLB';
  if (role.includes('Phó Chủ nhiệm') && role.includes('&')) {
    const second = role
      .split('&')[1]
      ?.replace('(Co-Founder)', '')
      .replace('Trưởng Ban ', 'TB ')
      .trim();
    return `PCN & ${second}`;
  }
  if (role.includes('Phó Chủ nhiệm')) return 'Phó Chủ nhiệm';
  if (role.includes('Trưởng Ban')) return 'Trưởng ban';
  if (role.includes('Phó Ban')) return 'Phó ban';
  return role;
}

function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function buildMemberNodeTexture(
  member: ExecutiveMember,
  accent: string,
  highlightGold = false
): THREE.CanvasTexture {
  return makeCanvasTexture(560, 144, (ctx) => {
    const primaryColor = highlightGold ? '#fbbf24' : accent;

    // Subtle dark gradient backdrop
    const grad = ctx.createLinearGradient(0, 0, 560, 144);
    grad.addColorStop(0, '#0f1a2e');
    grad.addColorStop(1, '#0b1322');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 560, 144);

    // Glowing framed card border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 552, 136);

    // Left accent status bar
    ctx.fillStyle = primaryColor;
    ctx.fillRect(4, 4, 10, 136);

    // Circular monogram / avatar ring badge on left
    const cx = 64;
    const cy = 72;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#16243d';
    ctx.fill();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(getInitials(member.name), cx, cy + 9);

    // Member Full Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 27px Inter, sans-serif';
    ctx.fillText(member.name, 114, 58, 424);

    // Role Pill + Term + Co-Founder star
    const roleStr = compactRole(member.role);
    const termStr = shortTerm(member.term);
    ctx.fillStyle = highlightGold ? '#fde68a' : '#7dd3fc';
    ctx.font = '600 19px "JetBrains Mono", monospace';
    ctx.fillText(`${roleStr} • ${termStr}${member.isFounder ? ' ★' : ''}`, 114, 102, 424);
  });
}

function buildDeptParentTexture(title: string, count: number, accent: string): THREE.CanvasTexture {
  return makeCanvasTexture(512, 128, (ctx) => {
    ctx.fillStyle = '#132038';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.fillStyle = accent;
    ctx.font = '700 26px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 56);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 19px "JetBrains Mono", monospace';
    ctx.fillText(`${count} VỊ TRÍ ĐIỀU HÀNH`, 256, 94);
  });
}

function buildHeaderTexture(termFilter: TreeTermFilter, totalCount: number): THREE.CanvasTexture {
  return makeCanvasTexture(1536, 136, (ctx) => {
    ctx.fillStyle = '#0c1526';
    ctx.fillRect(0, 0, 1536, 136);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 1524, 124);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText('SƠ ĐỒ CÂY TỔ CHỨC BAN CHỦ NHIỆM TECHTONIC CLUB', 42, 54);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 31px Inter, sans-serif';
    const sub =
      termFilter === 'ALL'
        ? `CẤU TRÚC 3 CẤP: CHỦ NHIỆM → PHÓ CHỦ NHIỆM → 4 BAN (${totalCount} HỒ SƠ • 2024–2027)`
        : `${termFilter.toUpperCase()} • CHỦ NHIỆM → PHÓ CHỦ NHIỆM → 4 BAN (${totalCount} HỒ SƠ)`;
    ctx.fillText(sub, 42, 102, 1452);
  });
}

function buildTabButtonTexture(label: string, active: boolean): THREE.CanvasTexture {
  return makeCanvasTexture(320, 96, (ctx) => {
    ctx.fillStyle = active ? '#0284c7' : '#131d32';
    ctx.fillRect(0, 0, 320, 96);

    ctx.strokeStyle = active ? '#7dd3fc' : 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 312, 88);

    ctx.fillStyle = active ? '#ffffff' : '#cbd5e1';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 160, 58);
  });
}

interface TreeConnectorProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}

/** Orthogonal architectural glowing metallic-cyan connector bar */
const TreeConnector: React.FC<TreeConnectorProps> = ({ x1, y1, x2, y2, color = '#38bdf8' }) => {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const thickness = 0.02;

  if (dx < 0.001 && dy < 0.001) return null;

  return (
    <group>
      <mesh position={[cx, cy, 0.025]}>
        <boxGeometry args={[Math.max(dx, thickness), Math.max(dy, thickness), 0.015]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          metalness={0.72}
          roughness={0.28}
        />
      </mesh>
      {/* Brushed junction joint dot at branch split ends */}
      <mesh position={[x1, y1, 0.028]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
};

interface MemberNodeCardProps {
  member: ExecutiveMember;
  x: number;
  y: number;
  w: number;
  h: number;
  accent: string;
  highlightGold?: boolean;
  isHovered: boolean;
  onHover: (hovering: boolean) => void;
  onClick: () => void;
}

const MemberNodeCard: React.FC<MemberNodeCardProps> = ({
  member,
  x,
  y,
  w,
  h,
  accent,
  highlightGold = false,
  isHovered,
  onHover,
  onClick,
}) => {
  const tex = useMemo(
    () => buildMemberNodeTexture(member, accent, highlightGold),
    [member, accent, highlightGold]
  );

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  return (
    <group position={[x, y, isHovered ? 0.068 : 0.052]}>
      <RoundedBox args={[w, h, 0.036]} radius={0.012} smoothness={4} castShadow>
        <meshStandardMaterial
          color="#1b2840"
          emissive={highlightGold ? '#fbbf24' : accent}
          emissiveIntensity={isHovered ? 0.55 : 0.14}
          metalness={0.78}
          roughness={0.24}
        />
      </RoundedBox>
      <mesh
        position={[0, 0, 0.02]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => onHover(false)}
      >
        <planeGeometry args={[w - 0.024, h - 0.022]} />
        <meshBasicMaterial map={tex} />
      </mesh>
    </group>
  );
};

export const ExecutiveOrgTree: React.FC = () => {
  const { executiveMembers, setHoveringInteractive, openExecutiveBoard } = useHeritageStore();
  const [termFilter, setTermFilter] = useState<TreeTermFilter>('ALL');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const marbleMaps = useMemo(() => createMarbleMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);

  const scopedMembers = useMemo(
    () =>
      termFilter === 'ALL'
        ? executiveMembers
        : executiveMembers.filter((m) => m.term === termFilter),
    [executiveMembers, termFilter]
  );

  // Partition into 3 hierarchical Org-Chart layers: Chủ Nhiệm -> Phó Chủ Nhiệm -> 4 Ban
  const { chairs, viceChairs, deptLeaves } = useMemo(() => {
    const ch = scopedMembers.filter((m) => m.role.startsWith('Chủ nhiệm'));
    const vc = scopedMembers.filter((m) => m.role.includes('Phó Chủ nhiệm'));
    const leaves = new Map<Department, ExecutiveMember[]>();
    DEPT_COLUMNS.forEach((col) => {
      const members = scopedMembers
        .filter((m) => m.department === col.dept)
        .sort((a, b) => {
          const aHead = a.role.includes('Trưởng Ban') ? 0 : 1;
          const bHead = b.role.includes('Trưởng Ban') ? 0 : 1;
          return aHead - bHead;
        });
      leaves.set(col.dept, members);
    });
    return { chairs: ch, viceChairs: vc, deptLeaves: leaves };
  }, [scopedMembers]);

  const headerTex = useMemo(
    () => buildHeaderTexture(termFilter, scopedMembers.length),
    [termFilter, scopedMembers.length]
  );

  const deptHeaderTextures = useMemo(
    () =>
      DEPT_COLUMNS.map((col) =>
        buildDeptParentTexture(col.shortTitle, (deptLeaves.get(col.dept) ?? []).length, col.accent)
      ),
    [deptLeaves]
  );

  const tabButtonTextures = useMemo(
    () => TERM_OPTIONS.map((opt) => buildTabButtonTexture(opt.label, termFilter === opt.value)),
    [termFilter]
  );

  useEffect(() => {
    return () => {
      marbleMaps.map.dispose();
      marbleMaps.roughnessMap.dispose();
      marbleMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
    };
  }, [marbleMaps, metalMaps]);

  useEffect(() => {
    return () => {
      headerTex.dispose();
      deptHeaderTextures.forEach((t) => t.dispose());
      tabButtonTextures.forEach((t) => t.dispose());
    };
  }, [headerTex, deptHeaderTextures, tabButtonTextures]);

  // Layout positions for Level 1 (Chủ Nhiệm) & Level 2 (Phó Chủ Nhiệm)
  const chairNodes = useMemo(() => {
    const count = chairs.length;
    const w = count <= 1 ? 1.95 : 1.56;
    const h = 0.36;
    const step = count <= 1 ? 0 : 1.78;
    const startX = -((count - 1) * step) / 2;
    return chairs.map((m, idx) => ({
      member: m,
      x: startX + idx * step,
      y: 4.38,
      w,
      h,
    }));
  }, [chairs]);

  const viceNodes = useMemo(() => {
    const count = viceChairs.length;
    if (count <= 4) {
      const w = 1.34;
      const h = 0.34;
      const step = count <= 1 ? 0 : 1.48;
      const startX = -((count - 1) * step) / 2;
      return viceChairs.map((m, idx) => ({
        member: m,
        x: startX + idx * step,
        y: 3.74,
        w,
        h,
      }));
    }
    // Clean 2 rows × 4 columns for all 8 PCNs across 3 terms
    const xs = [-2.18, -0.73, 0.73, 2.18];
    return viceChairs.slice(0, 8).map((m, idx) => ({
      member: m,
      x: xs[idx % 4],
      y: idx < 4 ? 3.82 : 3.4,
      w: 1.28,
      h: 0.3,
    }));
  }, [viceChairs]);

  const memberPreview = (m: ExecutiveMember): HoverPreview => ({
    title: m.name,
    badge: `${m.department.toUpperCase()} • ${shortTerm(m.term)}`,
    summary: m.bio ?? `${m.role} — ${m.department}`,
    bullets: [
      `Chức vụ: ${m.role}`,
      `Nhiệm kỳ: ${m.term}`,
      m.isFounder ? 'Nhà sáng lập (Co-Founder) CLB TechTonic' : `Thuộc ${m.department}`,
    ],
    actionLabel: `Mở hồ sơ ${m.department}`,
  });

  const viceLowestY = viceNodes.length > 4 ? 3.25 : 3.57;
  const deptHeaderY = viceNodes.length > 4 ? 2.86 : 3.06;
  const deptBusY = (viceLowestY + deptHeaderY + 0.14) / 2;
  const leafPitch = termFilter === 'ALL' ? 0.215 : 0.31;
  const leafH = termFilter === 'ALL' ? 0.185 : 0.255;

  return (
    <group position={TREE_POSITION} rotation={TREE_ROTATION}>
      {/* ================= VEINED MARBLE MUSEUM PLINTH WITH PHYSICS ================= */}
      <RigidBody type="fixed" position={[0, 0.31, 0.15]}>
        <RoundedBox position={[0, -0.18, 0]} args={[6.7, 0.26, 1.45]} radius={0.04} smoothness={6} receiveShadow castShadow>
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#d8e3f4"
            roughness={0.34}
            metalness={0.3}
          />
        </RoundedBox>
        <RoundedBox position={[0, 0.1, 0]} args={[6.42, 0.34, 1.15]} radius={0.03} smoothness={6} receiveShadow castShadow>
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#dce8f8"
            roughness={0.32}
            metalness={0.32}
          />
        </RoundedBox>
        {/* Brushed titanium top plinth cap */}
        <RoundedBox position={[0, 0.285, 0]} args={[6.48, 0.04, 1.2]} radius={0.01} smoothness={4}>
          <meshStandardMaterial
            color="#64748b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.88}
            roughness={0.22}
          />
        </RoundedBox>
      </RigidBody>

      {/* ================= INTERACTIVE 3D TERM SWITCHER CONSOLE BAR ================= */}
      <group position={[0, 0.65, 0.62]} rotation={[-0.45, 0, 0]}>
        <RoundedBox args={[3.9, 0.36, 0.06]} radius={0.02} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#1e293b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.82}
            roughness={0.24}
          />
        </RoundedBox>
        {TERM_OPTIONS.map((opt, idx) => {
          const bx = -1.38 + idx * 0.92;
          const active = termFilter === opt.value;
          return (
            <group key={opt.value} position={[bx, 0, 0.036]}>
              <RoundedBox args={[0.84, 0.24, 0.024]} radius={0.01} smoothness={4}>
                <meshStandardMaterial
                  color={active ? '#0284c7' : '#334155'}
                  metalness={0.6}
                  roughness={0.3}
                />
              </RoundedBox>
              <mesh
                position={[0, 0, 0.014]}
                onClick={(e) => {
                  e.stopPropagation();
                  setTermFilter(opt.value);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveringInteractive(
                    true,
                    `Lọc sơ đồ cây: ${opt.label}`,
                    () => setTermFilter(opt.value),
                    {
                      title: `Sơ đồ cây — ${opt.label}`,
                      badge: 'BỘ LỌC NHIỆM KỲ TRỰC TIẾP',
                      summary:
                        'Chuyển đổi sơ đồ cây giữa tổng hợp cả 3 nhiệm kỳ (26 hồ sơ) và từng nhiệm kỳ riêng biệt.',
                      actionLabel: `Hiển thị ${opt.label}`,
                    }
                  );
                }}
                onPointerOut={() => setHoveringInteractive(false)}
              >
                <planeGeometry args={[0.8, 0.21]} />
                <meshBasicMaterial map={tabButtonTextures[idx]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ================= ARCHITECTURAL GLASS MONUMENT BACKDROP ================= */}
      <group position={[0, 0, 0]}>
        {/* Brushed Titanium Perimeter Frame */}
        <RoundedBox position={[0, 2.95, -0.06]} args={[6.36, 4.46, 0.14]} radius={0.04} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial
            color="#1e293b"
            roughnessMap={metalMaps.roughnessMap}
            bumpMap={metalMaps.bumpMap}
            bumpScale={0.004}
            metalness={0.82}
            roughness={0.25}
          />
        </RoundedBox>
        {/* Matte Anti-Glare Museum Backdrop Plate (zero spotlight glare hotspot) */}
        <mesh position={[0, 2.95, 0.015]}>
          <planeGeometry args={[6.14, 4.24]} />
          <meshStandardMaterial
            color="#0a1220"
            roughness={0.86}
            metalness={0.12}
            envMapIntensity={0.25}
          />
        </mesh>
        {/* Top Glowing Cyan Accent Trim */}
        <mesh position={[0, 5.1, 0.02]}>
          <boxGeometry args={[6.14, 0.03, 0.02]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* 4 Brushed Brass Corner Standoff Fasteners */}
        {[
          [-3.04, 5.04],
          [3.04, 5.04],
          [-3.04, 0.86],
          [3.04, 0.86],
        ].map(([cx, cy], idx) => (
          <mesh key={`standoff-${idx}`} position={[cx, cy, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.045, 20]} />
            <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.18} />
          </mesh>
        ))}

        {/* Header Banner */}
        <mesh position={[0, 4.86, 0.025]}>
          <planeGeometry args={[5.8, 0.42]} />
          <meshBasicMaterial map={headerTex} />
        </mesh>

        {/* ================= HIERARCHICAL TREE CONNECTORS (CHỦ NHIỆM → PCN → 4 BAN → THÀNH VIÊN) ================= */}
        {/* Tier 1 Root Crown Rail & Stems */}
        {chairNodes.length > 1 && (
          <>
            <TreeConnector
              x1={chairNodes[0].x}
              y1={4.61}
              x2={chairNodes[chairNodes.length - 1].x}
              y2={4.61}
              color="#fbbf24"
            />
            {chairNodes.map((cn) => (
              <TreeConnector
                key={`cn-top-${cn.member.id}`}
                x1={cn.x}
                y1={4.61}
                x2={cn.x}
                y2={cn.y + cn.h / 2}
                color="#fbbf24"
              />
            ))}
            {chairNodes.map((cn) => (
              <TreeConnector
                key={`cn-bot-${cn.member.id}`}
                x1={cn.x}
                y1={cn.y - cn.h / 2}
                x2={cn.x}
                y2={4.1}
                color="#fbbf24"
              />
            ))}
            <TreeConnector
              x1={chairNodes[0].x}
              y1={4.1}
              x2={chairNodes[chairNodes.length - 1].x}
              y2={4.1}
              color="#7dd3fc"
            />
          </>
        )}

        {/* Central Spine: Chủ Nhiệm -> PCN Bus */}
        <TreeConnector
          x1={0}
          y1={chairNodes.length > 1 ? 4.1 : 4.2}
          x2={0}
          y2={viceNodes.length > 4 ? 4.02 : 3.98}
          color="#7dd3fc"
        />

        {/* Tier 2 PCN Distribution Bus & Vertical Feeders */}
        {viceNodes.length > 0 && (
          <>
            <TreeConnector
              x1={Math.min(...viceNodes.map((v) => v.x))}
              y1={viceNodes.length > 4 ? 4.02 : 3.98}
              x2={Math.max(...viceNodes.map((v) => v.x))}
              y2={viceNodes.length > 4 ? 4.02 : 3.98}
              color="#7dd3fc"
            />
            {/* Vertical feeder line for each column of PCNs */}
            {Array.from(new Set(viceNodes.map((v) => v.x))).map((vx) => {
              const colTop = viceNodes.length > 4 ? 4.02 : 3.98;
              const colMinY = Math.min(
                ...viceNodes.filter((v) => v.x === vx).map((v) => v.y)
              );
              return (
                <TreeConnector
                  key={`vc-col-${vx}`}
                  x1={vx}
                  y1={colTop}
                  x2={vx}
                  y2={colMinY}
                  color="#7dd3fc"
                />
              );
            })}
            {/* Collector rail below PCNs leading down to 4 Ban Bus */}
            <TreeConnector
              x1={Math.min(...viceNodes.map((v) => v.x))}
              y1={viceLowestY - 0.04}
              x2={Math.max(...viceNodes.map((v) => v.x))}
              y2={viceLowestY - 0.04}
              color="#38bdf8"
            />
            {Array.from(new Set(viceNodes.map((v) => v.x))).map((vx) => {
              const colMinY = Math.min(
                ...viceNodes.filter((v) => v.x === vx).map((v) => v.y - v.h / 2)
              );
              return (
                <TreeConnector
                  key={`vc-bot-${vx}`}
                  x1={vx}
                  y1={colMinY}
                  x2={vx}
                  y2={viceLowestY - 0.04}
                  color="#38bdf8"
                />
              );
            })}
            <TreeConnector x1={0} y1={viceLowestY - 0.04} x2={0} y2={deptBusY} color="#38bdf8" />
          </>
        )}

        {/* Tier 3: Horizontal Distribution Bus to 4 Departments */}
        <TreeConnector
          x1={DEPT_COLUMNS[0].x}
          y1={deptBusY}
          x2={DEPT_COLUMNS[DEPT_COLUMNS.length - 1].x}
          y2={deptBusY}
          color="#38bdf8"
        />
        {DEPT_COLUMNS.map((col) => (
          <TreeConnector
            key={`dept-stem-${col.dept}`}
            x1={col.x}
            y1={deptBusY}
            x2={col.x}
            y2={deptHeaderY + 0.14}
            color={col.accent}
          />
        ))}

        {/* ================= RENDER INDIVIDUAL NODE BOXES: TIER 1 (CHỦ NHIỆM) ================= */}
        {chairNodes.map((cn) => (
          <MemberNodeCard
            key={`node-cn-${cn.member.id}`}
            member={cn.member}
            x={cn.x}
            y={cn.y}
            w={cn.w}
            h={cn.h}
            accent="#fbbf24"
            highlightGold
            isHovered={hoveredId === cn.member.id}
            onHover={(h) => {
              setHoveredId(h ? cn.member.id : null);
              setHoveringInteractive(
                h,
                `${cn.member.name} (${cn.member.role})`,
                () => openExecutiveBoard('Ban Chủ Nhiệm'),
                memberPreview(cn.member)
              );
            }}
            onClick={() => openExecutiveBoard('Ban Chủ Nhiệm')}
          />
        ))}

        {/* ================= RENDER INDIVIDUAL NODE BOXES: TIER 2 (PHÓ CHỦ NHIỆM) ================= */}
        {viceNodes.map((vn) => (
          <MemberNodeCard
            key={`node-vc-${vn.member.id}`}
            member={vn.member}
            x={vn.x}
            y={vn.y}
            w={vn.w}
            h={vn.h}
            accent="#7dd3fc"
            isHovered={hoveredId === vn.member.id}
            onHover={(h) => {
              setHoveredId(h ? vn.member.id : null);
              setHoveringInteractive(
                h,
                `${vn.member.name} (${compactRole(vn.member.role)})`,
                () => openExecutiveBoard(vn.member.department),
                memberPreview(vn.member)
              );
            }}
            onClick={() => openExecutiveBoard(vn.member.department)}
          />
        ))}

        {/* ================= RENDER TIER 3: 4 BAN PARENT NODES & SIDE-SPINE MEMBER LEAVES ================= */}
        {DEPT_COLUMNS.map((col, colIdx) => {
          const members = deptLeaves.get(col.dept) ?? [];
          const spineX = col.x - 0.62;
          const cardX = col.x + 0.04;
          const cardW = 1.18;
          const firstLeafY = deptHeaderY - 0.28;
          const lastLeafY =
            members.length > 0 ? firstLeafY - (members.length - 1) * leafPitch : deptHeaderY - 0.14;

          return (
            <group key={`dept-col-${col.dept}`}>
              {/* Department Header Node Box */}
              <group position={[col.x, deptHeaderY, hoveredId === col.dept ? 0.068 : 0.052]}>
                <RoundedBox args={[1.32, 0.28, 0.036]} radius={0.012} smoothness={4} castShadow>
                  <meshStandardMaterial
                    color="#1b2840"
                    emissive={col.accent}
                    emissiveIntensity={hoveredId === col.dept ? 0.55 : 0.2}
                    metalness={0.8}
                    roughness={0.22}
                  />
                </RoundedBox>
                <mesh
                  position={[0, 0, 0.02]}
                  onClick={(e) => {
                    e.stopPropagation();
                    openExecutiveBoard(col.dept);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredId(col.dept);
                    setHoveringInteractive(
                      true,
                      `Nhánh ${col.dept} (${members.length} vị trí)`,
                      () => openExecutiveBoard(col.dept),
                      {
                        title: col.dept,
                        badge: `${members.length} VỊ TRÍ • ${shortTerm(termFilter === 'ALL' ? '2024–2027' : termFilter)}`,
                        summary: `Nhánh tổ chức ${col.dept} hiển thị từng vị trí Trưởng ban & Phó ban.`,
                        bullets: members.slice(0, 4).map((m) => `${m.name} (${compactRole(m.role)})`),
                        actionLabel: `Lọc danh sách ${col.dept}`,
                      }
                    );
                  }}
                  onPointerOut={() => {
                    setHoveredId(null);
                    setHoveringInteractive(false);
                  }}
                >
                  <planeGeometry args={[1.29, 0.255]} />
                  <meshBasicMaterial map={deptHeaderTextures[colIdx]} />
                </mesh>
              </group>

              {/* Vertical Tree Spine + Branch Ticks + Individual Leaf Member Nodes */}
              {members.length > 0 && (
                <>
                  {/* Drop connector from Department Parent Box left edge down vertical spine */}
                  <TreeConnector
                    x1={col.x - 0.48}
                    y1={deptHeaderY - 0.14}
                    x2={spineX}
                    y2={deptHeaderY - 0.14}
                    color={col.accent}
                  />
                  <TreeConnector
                    x1={spineX}
                    y1={deptHeaderY - 0.14}
                    x2={spineX}
                    y2={lastLeafY}
                    color={col.accent}
                  />

                  {members.map((member, mIdx) => {
                    const ly = firstLeafY - mIdx * leafPitch;
                    return (
                      <React.Fragment key={`leaf-${member.id}`}>
                        {/* Horizontal branch line connecting spine into leaf box */}
                        <TreeConnector
                          x1={spineX}
                          y1={ly}
                          x2={cardX - cardW / 2}
                          y2={ly}
                          color={col.accent}
                        />
                        <MemberNodeCard
                          member={member}
                          x={cardX}
                          y={ly}
                          w={cardW}
                          h={leafH}
                          accent={col.accent}
                          isHovered={hoveredId === member.id}
                          onHover={(h) => {
                            setHoveredId(h ? member.id : null);
                            setHoveringInteractive(
                              h,
                              `${member.name} (${compactRole(member.role)})`,
                              () => openExecutiveBoard(member.department),
                              memberPreview(member)
                            );
                          }}
                          onClick={() => openExecutiveBoard(member.department)}
                        />
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
};
