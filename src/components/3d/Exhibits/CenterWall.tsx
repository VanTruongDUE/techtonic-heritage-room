import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import { useReducedMotionPreference } from '../Effects/AmbientMotion';
import type { ExhibitItem, HoverPreview } from '../../../types/heritage';

const MISSION_EXHIBIT: ExhibitItem = {
  id: 'mission-statement',
  title: 'Tầm Nhìn, Sứ Mệnh & Bản Sắc TechTonic Club',
  category: 'history',
  year: 'Thành lập 01/07/2024',
  highlight: `${CLUB_PROFILE.slogan} • ${CLUB_PROFILE.spirit}`,
  description: `${CLUB_PROFILE.affiliation}. Tầm nhìn: ${CLUB_PROFILE.vision} Sứ mệnh: ${CLUB_PROFILE.mission}`,
  metrics: CLUB_PROFILE.metrics,
  bullets: [
    'Lợi ích 1 — Anh chị tốt: Kết nối thế hệ trước & sau định hướng nghề nghiệp',
    'Lợi ích 2 — Cơ sở học thuật tốt: Tài liệu, phương pháp & khóa chia sẻ thực chiến',
    'Lợi ích 3 — Bạn bè cùng chí hướng: Đồng hành & sẻ chia trong học tập lẫn cuộc sống',
  ],
};

const VALUES_EXHIBIT: ExhibitItem = {
  id: 'core-values',
  title: '7 Giá Trị Cốt Lõi & Dấu Ấn TechTonic Club',
  category: 'history',
  year: '2024 - 2026',
  highlight: 'Học Thuật • Kết Nối • Phát Triển • Trải Nghiệm • Chân Thành',
  description:
    'Hệ giá trị dẫn dắt văn hóa học thuật cạnh tranh lành mạnh, chia sẻ chân thành và đổi mới liên tục tại TechTonic Club.',
  metrics: CLUB_PROFILE.metrics,
  bullets: CLUB_PROFILE.coreValues.map((v) => `${v.name}: ${v.note}`),
};

const MISSION_PREVIEW: HoverPreview = {
  title: 'Tầm Nhìn & Sứ Mệnh TechTonic Club',
  badge: 'DUE ĐÀ NẴNG • DREAM IT - CODE IT',
  summary: CLUB_PROFILE.vision,
  bullets: [
    '5 trụ cột sứ mệnh: Học thuật • Kết nối • Phát triển • Trải nghiệm • Chân thành',
    'Tinh thần sinh hoạt: Study Hard - Play Harder',
    'Ra mắt chính thức: 09/04/2025 (khởi xướng từ 01/07/2024)',
  ],
  actionLabel: 'Xem tuyên ngôn & 3 lợi ích cốt lõi',
};

const VALUES_PREVIEW: HoverPreview = {
  title: '7 Giá Trị Cốt Lõi & Thành Tựu CLB',
  badge: '10+ Giải Thưởng • 100+ Thành Viên • 20+ Dự Án',
  summary:
    'Văn hóa TechTonic được xây dựng trên 7 giá trị nền tảng từ tinh thần chia sẻ đến cơ chế đổi mới phản chứng.',
  metrics: CLUB_PROFILE.metrics,
  bullets: [
    'Chia sẻ (hiểu) • Tương trợ (hiểu rồi mới giúp) • Chân thành',
    'Tôn trọng • Trách nhiệm • Đổi mới (phản chứng) • Vui vẻ',
  ],
  actionLabel: 'Xem chi tiết 7 giá trị cốt lõi',
};

const SLAT_POSITIONS = [-9.4, -9.0, -8.6, -8.2, -7.8, 7.8, 8.2, 8.6, 9.0, 9.4];

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxW: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

export const CenterWall: React.FC = () => {
  const { setHoveringInteractive, openModal } = useHeritageStore();
  const reducedMotion = useReducedMotionPreference();
  const emblemRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [isEmblemHovered, setIsEmblemHovered] = useState(false);

  const { outerHexGeom, innerHexGeom } = useMemo(() => {
    const makeHexRing = (outerR: number, innerR: number, depth: number) => {
      const outer = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = outerR * Math.cos(a);
        const y = outerR * Math.sin(a);
        if (i === 0) outer.moveTo(x, y);
        else outer.lineTo(x, y);
      }
      outer.closePath();

      const hole = new THREE.Path();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = innerR * Math.cos(a);
        const y = innerR * Math.sin(a);
        if (i === 0) hole.moveTo(x, y);
        else hole.lineTo(x, y);
      }
      hole.closePath();
      outer.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(outer, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.015,
        bevelSegments: 6,
      });
      geom.center();
      geom.computeVertexNormals();
      return geom;
    };

    return {
      outerHexGeom: makeHexRing(0.68, 0.56, 0.06),
      innerHexGeom: makeHexRing(0.5, 0.42, 0.04),
    };
  }, []);

  // Detailed side-by-side Vision & Mission texture directly readable before clicking
  const textTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 2048, 1024);

      // Headline cleanly below 3D emblem (y >= 295)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 52px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText('DREAM IT - CODE IT', 1024, 298);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '600 30px Inter, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('KHƠI NGUỒN ĐAM MÊ • KIẾN TẠO TƯƠNG LAI CÔNG NGHỆ', 1024, 348);

      ctx.fillStyle = '#93c5fd';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText(
        'HỘI SINH VIÊN TRƯỜNG ĐẠI HỌC KINH TẾ - ĐẠI HỌC ĐÀ NẴNG  •  RA MẮT 09/04/2025',
        1024,
        390
      );

      // Two balanced detail boxes: Vision (Left) & Mission (Right)
      ctx.textAlign = 'left';

      // Left box: TẦM NHÌN
      ctx.fillStyle = 'rgba(19, 29, 50, 0.85)';
      ctx.fillRect(140, 424, 840, 250);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(140, 424, 840, 250);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText('TẦM NHÌN (VISION)', 174, 466);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 23px Inter, sans-serif';
      drawWrappedText(ctx, CLUB_PROFILE.vision, 174, 512, 772, 34);

      // Right box: SỨ MỆNH
      ctx.fillStyle = 'rgba(19, 29, 50, 0.85)';
      ctx.fillRect(1068, 424, 840, 250);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1068, 424, 840, 250);

      ctx.fillStyle = '#60a5fa';
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.fillText('SỨ MỆNH (OUR MISSION)', 1102, 466);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 21px Inter, sans-serif';
      drawWrappedText(ctx, CLUB_PROFILE.mission, 1102, 508, 772, 31);

      // Bottom keywords bar
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText(
        'STUDY HARD - PLAY HARDER   •   HỌC THUẬT  •  KẾT NỐI  •  PHÁT TRIỂN  •  TRẢI NGHIỆM  •  CHÂN THÀNH',
        1024,
        724
      );
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, []);

  // Back-left wing panel: Full detailed 7 Core Values + Club Metrics + Benefits
  const valuesBoardTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1520;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1520, 1100);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.34)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 1472, 1052);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('BẢN SẮC • GIÁ TRỊ CỐT LÕI • THÀNH TỰU', 68, 86);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('7 GIÁ TRỊ CỐT LÕI & DẤU ẤN CLB', 68, 142);

      // Top 4 Metrics strip
      CLUB_PROFILE.metrics.forEach((m, idx) => {
        const x = 68 + idx * 352;
        const y = 180;
        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, 328, 126);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 328, 126);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 46px Inter, sans-serif';
        ctx.fillText(m.value, x + 24, y + 66);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 22px Inter, sans-serif';
        ctx.fillText(m.label, x + 24, y + 104);
      });

      // 7 Core Values cleanly in 2 columns with richer explanation
      CLUB_PROFILE.coreValues.forEach((val, idx) => {
        const col = idx < 4 ? 0 : 1;
        const row = idx < 4 ? idx : idx - 4;
        const x = 68 + col * 704;
        const y = 340 + row * 144;

        ctx.fillStyle = '#111a2d';
        ctx.fillRect(x, y, 676, 122);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, 676, 122);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText(`0${idx + 1}`, x + 22, y + 44);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(val.name, x + 76, y + 44);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 20px Inter, sans-serif';
        drawWrappedText(ctx, val.note, x + 76, y + 80, 578, 28);
      });

      // Bottom Benefits strip in slot (col 1, row 3)
      ctx.fillStyle = '#13223b';
      ctx.fillRect(772, 772, 676, 122);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(772, 772, 676, 122);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('CLB MANG LẠI GÌ CHO BẠN?', 796, 814);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 20px Inter, sans-serif';
      ctx.fillText('• Anh chị tốt  • Cơ sở học thuật tốt  • Bạn bè cùng chí hướng', 796, 856);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 21px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem đầy đủ Giá trị cốt lõi & Lợi ích', 68, 1020);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      outerHexGeom.dispose();
      innerHexGeom.dispose();
      textTexture.dispose();
      valuesBoardTexture.dispose();
    };
  }, [outerHexGeom, innerHexGeom, textTexture, valuesBoardTexture]);

  useFrame((state, delta) => {
    if (!reducedMotion && emblemRef.current) {
      emblemRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
      emblemRef.current.position.y = 5.05 + Math.sin(state.clock.elapsedTime * 1.1) * 0.03;
      const targetScale = isEmblemHovered ? 1.08 : 1;
      emblemRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    }
    if (!reducedMotion && haloRef.current) {
      haloRef.current.rotation.x += delta * 0.18;
      haloRef.current.rotation.y += delta * 0.24;
    }
  });

  const handleOpenMission = () => openModal('exhibit', MISSION_EXHIBIT);
  const handleOpenValues = () => openModal('exhibit', VALUES_EXHIBIT);

  return (
    <group position={[0, 0, -18.42]}>
      <RoundedBox
        position={[0, 3.35, -0.05]}
        args={[20.4, 5.5, 0.14]}
        radius={0.04}
        smoothness={4}
        receiveShadow
      >
        <meshStandardMaterial color="#0e1524" roughness={0.42} metalness={0.38} />
      </RoundedBox>

      {SLAT_POSITIONS.map((sx) => (
        <RoundedBox
          key={`slat-${sx}`}
          position={[sx, 3.35, 0.05]}
          args={[0.16, 5.1, 0.1]}
          radius={0.02}
          smoothness={4}
          castShadow
        >
          <meshStandardMaterial color="#1c273d" roughness={0.5} metalness={0.3} />
        </RoundedBox>
      ))}

      <mesh position={[0, 6.08, 0.04]}>
        <boxGeometry args={[20.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.62, 0.04]}>
        <boxGeometry args={[20.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Wireframe Geometric Halo around Emblem (inspired by events-hero-scene) */}
      <mesh ref={haloRef} position={[0, 5.05, 0.12]}>
        <icosahedronGeometry args={[0.88, 0]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={isEmblemHovered ? 0.26 : 0.11}
        />
      </mesh>

      {/* Sculpted Beveled 3D Hexagonal TechTonic Emblem */}
      <group
        ref={emblemRef}
        position={[0, 5.05, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenMission();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsEmblemHovered(true);
          setHoveringInteractive(
            true,
            'Xem Tầm nhìn & Sứ mệnh',
            handleOpenMission,
            MISSION_PREVIEW
          );
        }}
        onPointerOut={() => {
          setIsEmblemHovered(false);
          setHoveringInteractive(false);
        }}
      >
        <mesh geometry={outerHexGeom} castShadow>
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={isEmblemHovered ? 0.95 : 0.45}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>

        <mesh geometry={innerHexGeom} position={[0, 0, 0.03]}>
          <meshStandardMaterial
            color="#cbd5e1"
            emissive="#3b82f6"
            emissiveIntensity={isEmblemHovered ? 0.9 : 0.4}
            metalness={0.9}
            roughness={0.16}
          />
        </mesh>

        <mesh position={[0, 0, 0.06]}>
          <sphereGeometry args={[0.19, 48, 32]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            emissive="#38bdf8"
            emissiveIntensity={isEmblemHovered ? 0.85 : 0.45}
            metalness={0.2}
            roughness={0.08}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* Vision & Mission Graphic Plane */}
      <mesh
        position={[0, 2.45, 0.06]}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenMission();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveringInteractive(
            true,
            'Xem Tầm nhìn & Sứ mệnh',
            handleOpenMission,
            MISSION_PREVIEW
          );
        }}
        onPointerOut={() => setHoveringInteractive(false)}
      >
        <planeGeometry args={[14.8, 7.4]} />
        <meshBasicMaterial map={textTexture} transparent />
      </mesh>

      {/* Back-Left Wing: Framed 7 Core Values & Metrics Board with Corner Bolts */}
      <group position={[-13.4, 3.25, 0.02]}>
        <RoundedBox position={[0, 0, -0.05]} args={[5.72, 4.22, 0.1]} radius={0.04} smoothness={4} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.22} />
        </RoundedBox>
        {[
          [-2.74, 1.98],
          [2.74, 1.98],
          [-2.74, -1.98],
          [2.74, -1.98],
        ].map(([bx, by], i) => (
          <mesh key={`val-bolt-${i}`} position={[bx, by, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.035, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
          </mesh>
        ))}
        <mesh
          position={[0, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenValues();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveringInteractive(
              true,
              'Xem 7 Giá trị cốt lõi & Dấu ấn',
              handleOpenValues,
              VALUES_PREVIEW
            );
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[5.4, 3.9]} />
          <meshBasicMaterial map={valuesBoardTexture} />
        </mesh>
      </group>
    </group>
  );
};
