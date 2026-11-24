import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createMarbleTexture } from '../utils/proceduralMaterials';
import type { Department, ExecutiveMember, HoverPreview } from '../../../types/heritage';

const TREE_POSITION: [number, number, number] = [-9.6, 0, -12.2];
const TREE_ROTATION: [number, number, number] = [0, Math.PI / 4.2, 0];

interface DeptBranchMeta {
  dept: Department;
  shortTitle: string;
  accent: string;
  position: [number, number, number];
  rotY: number;
  memberCountLabel: string;
}

const DEPT_BRANCHES: DeptBranchMeta[] = [
  {
    dept: 'Ban Chuyên Môn',
    shortTitle: 'BAN CHUYÊN MÔN',
    accent: '#38bdf8',
    position: [-2.18, 1.38, 0.36],
    rotY: 0.2,
    memberCountLabel: '8 thành viên • FE / BE / AI & Data',
  },
  {
    dept: 'Ban Sự Kiện',
    shortTitle: 'BAN SỰ KIỆN',
    accent: '#a855f7',
    position: [-0.74, 1.38, 0.08],
    rotY: 0.07,
    memberCountLabel: '7 thành viên • TechXplore / TechWare',
  },
  {
    dept: 'Ban Nhân Sự',
    shortTitle: 'BAN NHÂN SỰ',
    accent: '#34d399',
    position: [0.74, 1.38, 0.08],
    rotY: -0.07,
    memberCountLabel: '3 thành viên • Tài chính & Đối ngoại',
  },
  {
    dept: 'Ban Truyền Thông',
    shortTitle: 'BAN TRUYỀN THÔNG',
    accent: '#f59e0b',
    position: [2.18, 1.38, 0.36],
    rotY: -0.2,
    memberCountLabel: '9 thành viên • Media & Design',
  },
];

function shortTerm(term: string): string {
  return term.replace('Nhiệm kỳ ', 'NK ').replace(' - ', '–');
}

function shortDeptRole(role: string): string {
  if (role.includes('Trưởng Ban')) return 'Trưởng ban';
  if (role.includes('Phó Ban')) return 'Phó ban';
  return role;
}

function createPlaqueCanvas(width: number, height: number, accent = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, width - 44, height - 44);
  }
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

function buildChairTexture(chairs: ExecutiveMember[]): THREE.CanvasTexture {
  const { canvas, ctx } = createPlaqueCanvas(1152, 430, '#38bdf8');
  if (ctx) {
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText('TẦNG 1 • CẤP CAO NHẤT', 44, 58);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 40px Inter, sans-serif';
    ctx.fillText('CHỦ NHIỆM CÂU LẠC BỘ (3 NHIỆM KỲ)', 44, 106);

    const colW = 344;
    chairs.slice(0, 3).forEach((m, idx) => {
      const x = 44 + idx * (colW + 16);
      const y = 136;
      const h = 246;

      ctx.fillStyle = '#131d32';
      ctx.fillRect(x, y, colW, h);
      ctx.strokeStyle = idx === 0 ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = idx === 0 ? 3 : 2;
      ctx.strokeRect(x, y, colW, h);

      ctx.fillStyle = idx === 0 ? '#38bdf8' : '#7dd3fc';
      ctx.font = '700 21px "JetBrains Mono", monospace';
      ctx.fillText(shortTerm(m.term), x + 20, y + 42);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText(m.name, x + 20, y + 92);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 19px Inter, sans-serif';
      ctx.fillText(m.isFounder ? 'Chủ nhiệm sáng lập' : 'Chủ nhiệm CLB', x + 20, y + 132);
      if (m.isFounder) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '600 17px "JetBrains Mono", monospace';
        ctx.fillText('★ CO-FOUNDER', x + 20, y + 174);
      } else if (idx === 0) {
        ctx.fillStyle = '#34d399';
        ctx.font = '600 17px "JetBrains Mono", monospace';
        ctx.fillText('● ĐƯƠNG NHIỆM', x + 20, y + 174);
      }
    });
  }
  return toTexture(canvas);
}

function buildViceChairTexture(vices: ExecutiveMember[]): THREE.CanvasTexture {
  const { canvas, ctx } = createPlaqueCanvas(1536, 450, '#7dd3fc');
  if (ctx) {
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText('TẦNG 2 • ĐIỀU HÀNH TRỰC TIẾP', 44, 56);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 38px Inter, sans-serif';
    ctx.fillText('PHÓ CHỦ NHIỆM QUA CÁC NHIỆM KỲ', 44, 102);

    const terms = ['Nhiệm kỳ 2026 - 2027', 'Nhiệm kỳ 2025 - 2026', 'Nhiệm kỳ 2024 - 2025'];
    const colW = 468;

    terms.forEach((term, idx) => {
      const x = 44 + idx * (colW + 22);
      const y = 128;
      const h = 282;

      ctx.fillStyle = '#131d32';
      ctx.fillRect(x, y, colW, h);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, colW, h);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 21px "JetBrains Mono", monospace';
      ctx.fillText(shortTerm(term), x + 20, y + 40);

      const list = vices.filter((v) => v.term === term);
      let rowY = y + 84;
      list.forEach((v) => {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(`• ${v.name}`, x + 20, rowY);

        if (v.role.includes('&')) {
          const deptHint = v.role.split('&')[1]?.replace('(Co-Founder)', '').trim();
          ctx.fillStyle = '#94a3b8';
          ctx.font = '400 16px Inter, sans-serif';
          ctx.fillText(`  ${deptHint}`, x + 32, rowY + 23);
          rowY += 54;
        } else {
          if (v.isFounder) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '500 16px "JetBrains Mono", monospace';
            ctx.fillText('  Co-Founder CLB', x + 32, rowY + 23);
            rowY += 54;
          } else {
            rowY += 44;
          }
        }
      });
    });
  }
  return toTexture(canvas);
}

function buildDeptTexture(meta: DeptBranchMeta, members: ExecutiveMember[]): THREE.CanvasTexture {
  const { canvas, ctx } = createPlaqueCanvas(896, 812, meta.accent);
  if (ctx) {
    ctx.fillStyle = meta.accent;
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText('TẦNG 3 • NHÁNH BAN CHỨC NĂNG', 38, 56);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillText(meta.shortTitle, 38, 108);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 21px Inter, sans-serif';
    ctx.fillText(meta.memberCountLabel, 38, 144);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 168);
    ctx.lineTo(858, 168);
    ctx.stroke();

    const terms = ['Nhiệm kỳ 2026 - 2027', 'Nhiệm kỳ 2025 - 2026', 'Nhiệm kỳ 2024 - 2025'];
    let curY = 208;

    terms.forEach((term) => {
      const list = members.filter((m) => m.term === term);
      if (list.length === 0) return;

      ctx.fillStyle = meta.accent;
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText(shortTerm(term), 38, curY);
      curY += 36;

      list.forEach((m) => {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 25px Inter, sans-serif';
        const roleLabel = shortDeptRole(m.role);
        ctx.fillText(`• ${m.name}`, 44, curY);

        ctx.fillStyle = roleLabel === 'Trưởng ban' ? '#fde68a' : '#cbd5e1';
        ctx.font = '600 21px Inter, sans-serif';
        ctx.fillText(`${roleLabel}${m.isFounder ? ' ★' : ''}`, 560, curY);
        curY += 38;
      });

      curY += 18;
    });

    ctx.fillStyle = '#7dd3fc';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText('→ Click vào bảng nhánh để lọc hồ sơ ban này', 38, 772);
  }
  return toTexture(canvas);
}

export const ExecutiveOrgTree: React.FC = () => {
  const { executiveMembers, setHoveringInteractive, openExecutiveBoard } = useHeritageStore();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const marbleMap = useMemo(() => createMarbleTexture(), []);

  // Partition all BCN members into the 3 structural tiers
  const { chairs, viceChairs, deptGroups } = useMemo(() => {
    const ch = executiveMembers.filter((m) => m.role.startsWith('Chủ nhiệm'));
    const vc = executiveMembers.filter((m) => m.role.includes('Phó Chủ nhiệm'));
    const depts = new Map<Department, ExecutiveMember[]>();
    DEPT_BRANCHES.forEach((b) => {
      depts.set(
        b.dept,
        executiveMembers.filter((m) => m.department === b.dept)
      );
    });
    return { chairs: ch, viceChairs: vc, deptGroups: depts };
  }, [executiveMembers]);

  const chairTexture = useMemo(() => buildChairTexture(chairs), [chairs]);
  const viceTexture = useMemo(() => buildViceChairTexture(viceChairs), [viceChairs]);
  const deptTextures = useMemo(
    () => DEPT_BRANCHES.map((b) => buildDeptTexture(b, deptGroups.get(b.dept) ?? [])),
    [deptGroups]
  );

  // Build curved 3D TubeGeometry branches connecting Trunk -> 4 Department Nodes + Pedestal Plaque
  const { branchGeometries, trunkRingGeometry, pedestalPlaqueTex } = useMemo(() => {
    const branches = DEPT_BRANCHES.map((b) => {
      const start = new THREE.Vector3(0, 2.34, 0.02);
      const mid = new THREE.Vector3(b.position[0] * 0.55, 2.18, b.position[2] * 0.5 + 0.04);
      const end = new THREE.Vector3(b.position[0], b.position[1] + 0.56, b.position[2]);
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      return new THREE.TubeGeometry(curve, 24, 0.036, 12, false);
    });

    const ringCurve = new THREE.TorusGeometry(0.42, 0.022, 12, 48);

    const { canvas, ctx } = createPlaqueCanvas(1024, 300, '#38bdf8');
    if (ctx) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText('SƠ ĐỒ CÂY BAN CHỦ NHIỆM TECHTONIC CLUB', 44, 62);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 34px Inter, sans-serif';
      ctx.fillText('CHỦ NHIỆM  →  PHÓ CHỦ NHIỆM  →  4 BAN CHỨC NĂNG', 44, 122);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 22px Inter, sans-serif';
      ctx.fillText(
        `Hiển thị đầy đủ ${executiveMembers.length} hồ sơ BCN qua 3 nhiệm kỳ (2024–2027) • Click từng tầng hoặc ban để tra cứu`,
        44,
        180
      );

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText('★ Co-Founder   •   TB: Trưởng ban   •   PB: Phó ban', 44, 244);
    }

    return {
      branchGeometries: branches,
      trunkRingGeometry: ringCurve,
      pedestalPlaqueTex: toTexture(canvas),
    };
  }, [executiveMembers.length]);

  useEffect(() => {
    return () => {
      marbleMap.dispose();
      chairTexture.dispose();
      viceTexture.dispose();
      deptTextures.forEach((t) => t.dispose());
      branchGeometries.forEach((g) => g.dispose());
      trunkRingGeometry.dispose();
      pedestalPlaqueTex.dispose();
    };
  }, [
    marbleMap,
    chairTexture,
    viceTexture,
    deptTextures,
    branchGeometries,
    trunkRingGeometry,
    pedestalPlaqueTex,
  ]);

  const chairPreview: HoverPreview = useMemo(
    () => ({
      title: 'Tầng 1: Chủ Nhiệm CLB (3 Nhiệm Kỳ)',
      badge: 'SƠ ĐỒ CÂY BCN • CẤP CAO NHẤT',
      summary: 'Định hướng chiến lược và đại diện cao nhất của CLB TechTonic qua 3 nhiệm kỳ liên tiếp.',
      bullets: chairs.map((c) => `${shortTerm(c.term)}: ${c.name}`),
      actionLabel: 'Mở hồ sơ Ban Chủ Nhiệm',
    }),
    [chairs]
  );

  const vicePreview: HoverPreview = useMemo(
    () => ({
      title: 'Tầng 2: Phó Chủ Nhiệm CLB',
      badge: 'SƠ ĐỒ CÂY BCN • ĐIỀU HÀNH',
      summary: 'Phối hợp điều hành toàn diện học thuật, sự kiện, nhân sự và truyền thông qua các nhiệm kỳ.',
      bullets: viceChairs.slice(0, 4).map((v) => `${shortTerm(v.term)}: ${v.name}`),
      actionLabel: 'Xem toàn bộ Phó Chủ Nhiệm',
    }),
    [viceChairs]
  );

  const deptPreviews: HoverPreview[] = useMemo(
    () =>
      DEPT_BRANCHES.map((b) => {
        const list = deptGroups.get(b.dept) ?? [];
        return {
          title: `Tầng 3: ${b.dept}`,
          badge: 'NHÁNH BAN CHỨC NĂNG',
          summary: `${b.memberCountLabel}. Bao gồm đầy đủ Trưởng/Phó ban qua 3 nhiệm kỳ 2024–2027.`,
          bullets: list.slice(0, 4).map((m) => `${shortTerm(m.term)}: ${m.name} (${shortDeptRole(m.role)})`),
          actionLabel: `Lọc danh sách ${b.dept}`,
        };
      }),
    [deptGroups]
  );

  return (
    <group position={TREE_POSITION} rotation={TREE_ROTATION}>
      {/* Dedicated soft museum uplight so every branch card reads crisply */}
      <pointLight position={[0, 4.9, 2.2]} intensity={3.2} distance={10} decay={2} color="#dbeafe" />

      {/* ================= STEPPED MARBLE & TITANIUM PEDESTAL ================= */}
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.15, 2.3, 0.24, 8]} />
          <meshStandardMaterial map={marbleMap} color="#162033" roughness={0.35} metalness={0.28} />
        </mesh>
        <mesh position={[0, 0.38, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.82, 1.94, 0.28, 8]} />
          <meshStandardMaterial map={marbleMap} color="#1a263c" roughness={0.34} metalness={0.3} />
        </mesh>
      </RigidBody>

      {/* Brushed titanium top collar & glowing cyan ring */}
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[1.86, 1.84, 0.04, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.84} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.57, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.74, 1.79, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Angled Pedestal Front Summary Plaque */}
      <group position={[0, 0.54, 1.84]} rotation={[-0.55, 0, 0]}>
        <RoundedBox args={[1.86, 0.56, 0.05]} radius={0.02} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.28} />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.028]}
          onClick={(e) => {
            e.stopPropagation();
            openExecutiveBoard('ALL');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveringInteractive(
              true,
              'Mở toàn bộ danh sách Ban Chủ Nhiệm',
              () => openExecutiveBoard('ALL'),
              chairPreview
            );
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[1.78, 0.5]} />
          <meshBasicMaterial map={pedestalPlaqueTex} />
        </mesh>
      </group>

      {/* ================= CENTRAL STRUCTURAL TRUNK (CHỦ NHIỆM → PCN → BRANCH HUB) ================= */}
      <mesh position={[0, 2.28, -0.08]} castShadow>
        <cylinderGeometry args={[0.09, 0.16, 3.44, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.24} />
      </mesh>
      {/* Glowing spine conduit on front of trunk */}
      <mesh position={[0, 2.28, 0.04]}>
        <cylinderGeometry args={[0.026, 0.032, 3.36, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Decorative branch hub collar & apex ring */}
      <mesh position={[0, 2.34, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={trunkRingGeometry}>
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0, 4.55, 0]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.85}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* ================= 4 GLOWING CURVED BRANCH CONDUITS ================= */}
      {DEPT_BRANCHES.map((b, idx) => (
        <mesh key={`branch-tube-${b.dept}`} geometry={branchGeometries[idx]}>
          <meshStandardMaterial
            color={b.accent}
            emissive={b.accent}
            emissiveIntensity={hoveredNode === b.dept ? 0.9 : 0.4}
            metalness={0.65}
            roughness={0.28}
          />
        </mesh>
      ))}

      {/* ================= TIER 1: CHỦ NHIỆM CLB ================= */}
      <group position={[0, 3.92, 0.04]}>
        <RoundedBox args={[2.38, 0.94, 0.08]} radius={0.03} smoothness={4}>
          <meshStandardMaterial
            color="#1e293b"
            emissive="#38bdf8"
            emissiveIntensity={hoveredNode === 'chair' ? 0.35 : 0.08}
            metalness={0.8}
            roughness={0.26}
          />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.045]}
          onClick={(e) => {
            e.stopPropagation();
            openExecutiveBoard('Ban Chủ Nhiệm');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredNode('chair');
            setHoveringInteractive(
              true,
              'Tầng 1: Chủ Nhiệm CLB (3 nhiệm kỳ)',
              () => openExecutiveBoard('Ban Chủ Nhiệm'),
              chairPreview
            );
          }}
          onPointerOut={() => {
            setHoveredNode(null);
            setHoveringInteractive(false);
          }}
        >
          <planeGeometry args={[2.28, 0.85]} />
          <meshBasicMaterial map={chairTexture} />
        </mesh>
      </group>

      {/* ================= TIER 2: PHÓ CHỦ NHIỆM CLB ================= */}
      <group position={[0, 2.86, 0.06]}>
        <RoundedBox args={[3.14, 0.96, 0.08]} radius={0.03} smoothness={4}>
          <meshStandardMaterial
            color="#1e293b"
            emissive="#7dd3fc"
            emissiveIntensity={hoveredNode === 'vice' ? 0.35 : 0.08}
            metalness={0.8}
            roughness={0.26}
          />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.045]}
          onClick={(e) => {
            e.stopPropagation();
            openExecutiveBoard('Ban Chủ Nhiệm');
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredNode('vice');
            setHoveringInteractive(
              true,
              'Tầng 2: Phó Chủ Nhiệm CLB',
              () => openExecutiveBoard('Ban Chủ Nhiệm'),
              vicePreview
            );
          }}
          onPointerOut={() => {
            setHoveredNode(null);
            setHoveringInteractive(false);
          }}
        >
          <planeGeometry args={[3.04, 0.88]} />
          <meshBasicMaterial map={viceTexture} />
        </mesh>
      </group>

      {/* ================= TIER 3: 4 FUNCTIONAL DEPARTMENT BRANCHES ================= */}
      {DEPT_BRANCHES.map((b, idx) => (
        <group
          key={b.dept}
          position={b.position}
          rotation={[0, b.rotY, 0]}
        >
          <RoundedBox args={[1.34, 1.22, 0.08]} radius={0.03} smoothness={4}>
            <meshStandardMaterial
              color="#1e293b"
              emissive={b.accent}
              emissiveIntensity={hoveredNode === b.dept ? 0.38 : 0.08}
              metalness={0.8}
              roughness={0.26}
            />
          </RoundedBox>
          <mesh
            position={[0, 0, 0.045]}
            onClick={(e) => {
              e.stopPropagation();
              openExecutiveBoard(b.dept);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredNode(b.dept);
              setHoveringInteractive(
                true,
                `${b.dept} • Click để lọc hồ sơ`,
                () => openExecutiveBoard(b.dept),
                deptPreviews[idx]
              );
            }}
            onPointerOut={() => {
              setHoveredNode(null);
              setHoveringInteractive(false);
            }}
          >
            <planeGeometry args={[1.26, 1.14]} />
            <meshBasicMaterial map={deptTextures[idx]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
