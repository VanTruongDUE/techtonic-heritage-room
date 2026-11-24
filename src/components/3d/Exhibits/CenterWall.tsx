import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import type { ExhibitItem } from '../../../types/heritage';

const MISSION_EXHIBIT: ExhibitItem = {
  id: 'mission-statement',
  title: 'Tầm Nhìn, Sứ Mệnh & Bản Sắc TechTonic Club',
  category: 'history',
  year: 'Thành lập 01/07/2024',
  highlight: `${CLUB_PROFILE.slogan} • ${CLUB_PROFILE.spirit}`,
  description: `${CLUB_PROFILE.affiliation}. Tầm nhìn: ${CLUB_PROFILE.vision} Sứ mệnh: ${CLUB_PROFILE.mission}`,
  metrics: CLUB_PROFILE.metrics,
  bullets: [
    'Tôn chỉ hành động: Dream it - Code it',
    'Tinh thần sinh hoạt: Study Hard - Play Harder',
    'Lợi ích thành viên: Anh chị tốt • Cơ sở học thuật tốt • Bạn bè cùng chí hướng',
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
  bullets: CLUB_PROFILE.coreValues.map((v) => `${v.name} — ${v.note}`),
};

const SLAT_POSITIONS = [-9.4, -9.0, -8.6, -8.2, -7.8, 7.8, 8.2, 8.6, 9.0, 9.4];

export const CenterWall: React.FC = () => {
  const { setHoveringInteractive, openModal } = useHeritageStore();
  const emblemRef = useRef<THREE.Group>(null);
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

  const textTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 2048, 1024);

      // Positioned cleanly below the 3D emblem (worldY <= 3.95 vs emblem bottom ~4.37)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 52px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText('DREAM IT - CODE IT', 1024, 305);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '600 32px Inter, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('KHƠI NGUỒN ĐAM MÊ • KIẾN TẠO TƯƠNG LAI CÔNG NGHỆ', 1024, 362);

      ctx.fillStyle = '#93c5fd';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText(
        'HỘI SINH VIÊN TRƯỜNG ĐẠI HỌC KINH TẾ - ĐẠI HỌC ĐÀ NẴNG',
        1024,
        408
      );

      const gradient = ctx.createLinearGradient(420, 442, 1628, 442);
      gradient.addColorStop(0, 'rgba(56,189,248,0)');
      gradient.addColorStop(0.5, 'rgba(56,189,248,0.8)');
      gradient.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(420, 442);
      ctx.lineTo(1628, 442);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.letterSpacing = '6px';
      ctx.fillText('TẦM NHÌN & SỨ MỆNH', 1024, 496);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '400 29px Inter, sans-serif';
      ctx.fillText(
        'Môi trường học thuật cạnh tranh, lành mạnh về Công nghệ thông tin tại DUE Đà Nẵng,',
        1024,
        556
      );
      ctx.fillText(
        'nơi rèn luyện kiến thức, kỹ năng, thái độ và dự án thực tế qua sự dẫn dắt chân thành.',
        1024,
        604
      );

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText(
        'STUDY HARD - PLAY HARDER  •  HỌC THUẬT  •  KẾT NỐI  •  PHÁT TRIỂN',
        1024,
        672
      );
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, []);

  // Back-left wing panel: 7 Core Values + Club Metrics
  const valuesBoardTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 1040;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1440, 1040);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.34)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 1392, 992);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('BẢN SẮC & THÀNH TỰU', 70, 92);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 46px Inter, sans-serif';
      ctx.fillText('7 GIÁ TRỊ CỐT LÕI & DẤU ẤN', 70, 152);

      // Top 4 Metrics strip
      CLUB_PROFILE.metrics.forEach((m, idx) => {
        const x = 70 + idx * 332;
        const y = 196;
        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, 304, 146);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 304, 146);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 50px Inter, sans-serif';
        ctx.fillText(m.value, x + 28, y + 74);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 24px Inter, sans-serif';
        ctx.fillText(m.label, x + 28, y + 118);
      });

      // 7 Core Values cleanly in 2 columns (no overlap)
      CLUB_PROFILE.coreValues.forEach((val, idx) => {
        const col = idx < 4 ? 0 : 1;
        const row = idx < 4 ? idx : idx - 4;
        const x = 70 + col * 670;
        const y = 398 + row * 124;

        ctx.fillStyle = '#111a2d';
        ctx.fillRect(x, y, 630, 98);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, 630, 98);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillText(`0${idx + 1}`, x + 24, y + 58);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillText(val.name, x + 84, y + 44);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 21px Inter, sans-serif';
        ctx.fillText(val.note, x + 84, y + 78);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết Tầm nhìn & Giá trị cốt lõi', 70, 968);
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

  useFrame((state) => {
    if (emblemRef.current) {
      emblemRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
      emblemRef.current.position.y = 5.05 + Math.sin(state.clock.elapsedTime * 1.1) * 0.03;
      const targetScale = isEmblemHovered ? 1.07 : 1;
      emblemRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    }
  });

  const handleOpenMission = () => openModal('exhibit', MISSION_EXHIBIT);
  const handleOpenValues = () => openModal('exhibit', VALUES_EXHIBIT);

  return (
    <group position={[0, 0, -18.42]}>
      {/* Main architectural dark-slate feature wall panel */}
      <RoundedBox
        position={[0, 3.35, -0.05]}
        args={[20.4, 5.5, 0.14]}
        radius={0.04}
        smoothness={4}
        receiveShadow
      >
        <meshStandardMaterial color="#0e1524" roughness={0.42} metalness={0.38} />
      </RoundedBox>

      {/* Flanking Vertical Acoustic Slats */}
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

      {/* Upper & Lower Brushed Titanium Architectural Molding */}
      <mesh position={[0, 6.08, 0.04]}>
        <boxGeometry args={[20.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.62, 0.04]}>
        <boxGeometry args={[20.2, 0.06, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
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
          setHoveringInteractive(true, 'Xem Tầm nhìn & Sứ mệnh TechTonic', handleOpenMission);
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

      {/* Slogan & Mission Graphic Plane */}
      <mesh position={[0, 2.45, 0.06]}>
        <planeGeometry args={[14, 7]} />
        <meshBasicMaterial map={textTexture} transparent />
      </mesh>

      {/* Back-Left Wing: Framed 7 Core Values & Metrics Board */}
      <group position={[-13.4, 3.25, 0.02]}>
        <RoundedBox position={[0, 0, -0.05]} args={[5.72, 4.22, 0.1]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenValues();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveringInteractive(true, 'Xem 7 Giá trị cốt lõi & Dấu ấn', handleOpenValues);
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
