import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import type { ExhibitItem } from '../../../types/heritage';

const MISSION_EXHIBIT: ExhibitItem = {
  id: 'mission-statement',
  title: 'Tuyên Ngôn Sứ Mệnh & Biểu Tượng TechTonic Club',
  category: 'history',
  year: '2022 - 2026',
  highlight: 'Igniting Passion • Pioneering Technology',
  description:
    'TechTonic Club là cái nôi nuôi dưỡng niềm say mê nghiên cứu khoa học, đổi mới sáng tạo và phát triển giải pháp công nghệ tiên phong cho cộng đồng sinh viên. Kết nối tài năng công nghệ — Lan tỏa tri thức số — Vươn tầm quốc tế.',
};

const SLAT_POSITIONS = [
  -9.4, -9.0, -8.6, -8.2, -7.8,
  7.8, 8.2, 8.6, 9.0, 9.4,
];

export const CenterWall: React.FC = () => {
  const { setHoveringInteractive, openModal } = useHeritageStore();
  const emblemRef = useRef<THREE.Group>(null);
  const [isEmblemHovered, setIsEmblemHovered] = useState(false);

  // Precision beveled hexagonal ring geometry
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
      outerHexGeom: makeHexRing(1.04, 0.88, 0.07),
      innerHexGeom: makeHexRing(0.8, 0.68, 0.05),
    };
  }, []);

  const textTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 2048, 1024);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 52px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText('IGNITING PASSION • PIONEERING TECHNOLOGY', 1024, 210);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '600 34px Inter, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('THẮP LỬA ĐAM MÊ • TIÊN PHONG CÔNG NGHỆ', 1024, 270);

      const gradient = ctx.createLinearGradient(420, 320, 1628, 320);
      gradient.addColorStop(0, 'rgba(56,189,248,0)');
      gradient.addColorStop(0.5, 'rgba(56,189,248,0.75)');
      gradient.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(420, 320);
      ctx.lineTo(1628, 320);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.letterSpacing = '6px';
      ctx.fillText('TUYÊN NGÔN SỨ MỆNH & TẦM NHÌN', 1024, 390);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '400 32px Inter, sans-serif';
      ctx.fillText(
        'TechTonic Club là cái nôi nuôi dưỡng niềm say mê nghiên cứu khoa học, đổi mới sáng tạo',
        1024,
        460
      );
      ctx.fillText(
        'và phát triển giải pháp công nghệ tiên phong cho cộng đồng sinh viên.',
        1024,
        515
      );
      ctx.fillText(
        'Kết nối tài năng công nghệ - Lan tỏa tri thức số - Vươn tầm quốc tế.',
        1024,
        570
      );
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      outerHexGeom.dispose();
      innerHexGeom.dispose();
      textTexture.dispose();
    };
  }, [outerHexGeom, innerHexGeom, textTexture]);

  useFrame((state) => {
    if (emblemRef.current) {
      emblemRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
      emblemRef.current.position.y = 4.25 + Math.sin(state.clock.elapsedTime * 1.1) * 0.035;
      const targetScale = isEmblemHovered ? 1.07 : 1;
      emblemRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    }
  });

  const handleOpenMission = () => openModal('exhibit', MISSION_EXHIBIT);

  return (
    <group position={[0, 0, -18.42]}>
      {/* Main architectural dark-slate feature wall panel */}
      <RoundedBox position={[0, 3.35, -0.05]} args={[20.4, 5.5, 0.14]} radius={0.04} smoothness={4} receiveShadow>
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
        position={[0, 4.25, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          handleOpenMission();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsEmblemHovered(true);
          setHoveringInteractive(true, 'Xem Tuyên Ngôn Sứ Mệnh TechTonic', handleOpenMission);
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
          <sphereGeometry args={[0.28, 48, 32]} />
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
    </group>
  );
};
