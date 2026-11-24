import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import type { ExhibitItem } from '../../../types/heritage';

export const PerimeterGallery: React.FC = () => {
  const {
    setHoveringInteractive,
    openModal,
    timelineMilestones,
    activityHighlights,
  } = useHeritageStore();

  const shirtGroupRef = useRef<THREE.Group>(null);
  const hologramRingRef = useRef<THREE.Mesh>(null);
  const [isShirtHovered, setIsShirtHovered] = useState(false);

  useFrame((state) => {
    if (shirtGroupRef.current) {
      shirtGroupRef.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
      shirtGroupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.15;
      const targetScale = isShirtHovered ? 1.06 : 1;
      shirtGroupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.12
      );
    }
    if (hologramRingRef.current) {
      hologramRingRef.current.rotation.z += isShirtHovered ? 0.035 : 0.015;
    }
  });

  // Timeline canvas texture for Left Wall driven by store milestones
  const timelineTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 2008, 984);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 50px Outfit, sans-serif';
      ctx.fillText('DÒNG THỜI GIAN PHÁT TRIỂN • CLUB HISTORY TIMELINE', 80, 100);

      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(100, 520);
      ctx.lineTo(1948, 520);
      ctx.stroke();

      const xPositions = [250, 950, 1650];
      timelineMilestones.slice(0, 3).forEach((m, idx) => {
        const x = xPositions[idx] ?? 250 + idx * 650;

        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(x, 520, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, 520, 26, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00F0FF';
        ctx.font = '900 60px Outfit, sans-serif';
        ctx.fillText(m.year, x - 70, 440);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.fillText(m.title, x - 120, 600);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '300 24px Inter, sans-serif';
        const words = m.description.split(' ');
        let line = '';
        let y = 650;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (testLine.length > 32) {
            ctx.fillText(line, x - 120, y);
            line = words[n] + ' ';
            y += 35;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x - 120, y);
      });

      ctx.fillStyle = '#00F0FF';
      ctx.font = '500 22px JetBrains Mono, monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết cột mốc lịch sử', 80, 955);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, [timelineMilestones]);

  // Activity Gallery Canvas Texture driven by store activity highlights
  const activityTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, 1536, 1024);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1496, 984);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 44px Outfit, sans-serif';
      ctx.fillText('KHOẢNH KHẮC HOẠT ĐỘNG TIÊU BIỂU', 60, 90);

      activityHighlights.slice(0, 4).forEach((c, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 60 + col * 710;
        const y = 140 + row * 410;

        ctx.fillStyle = '#121826';
        ctx.fillRect(x, y, 660, 360);

        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 660, 360);

        ctx.fillStyle = c.color;
        ctx.font = '600 20px JetBrains Mono, monospace';
        ctx.fillText(`[ ${c.tag} ]`, x + 30, y + 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px Outfit, sans-serif';
        ctx.fillText(c.title, x + 30, y + 120);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '300 22px Inter, sans-serif';
        const words = c.summary.split(' ');
        let line = '';
        let lineY = y + 175;
        for (const word of words) {
          const test = line + word + ' ';
          if (test.length > 44) {
            ctx.fillText(line, x + 30, lineY);
            line = word + ' ';
            lineY += 32;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, x + 30, lineY);

        ctx.fillStyle = '#00F0FF';
        ctx.font = '500 20px Inter, sans-serif';
        ctx.fillText('• Nhấp / [E] để xem chi tiết kỷ yếu câu lạc bộ', x + 30, y + 310);
      });
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, [activityHighlights]);

  // Right Wall Plaque behind Club Shirt
  const shirtPlaqueTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 1400, 700);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1360, 660);

      ctx.fillStyle = '#00F0FF';
      ctx.font = '600 26px JetBrains Mono, monospace';
      ctx.fillText('BIỂU TƯỢNG TINH THẦN TECHTONIC', 70, 100);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px Outfit, sans-serif';
      ctx.fillText('ÁO CÂU LẠC BỘ & BAN CHỦ NHIỆM', 70, 170);

      ctx.fillStyle = '#CBD5E1';
      ctx.font = '300 28px Inter, sans-serif';
      ctx.fillText(
        'Màu áo đen công nghệ kết hợp đường viền xanh cyan đại diện cho kỷ luật kỹ thuật,',
        70,
        265
      );
      ctx.fillText(
        'tư duy tiên phong và tinh thần đồng đội của các thế hệ thành viên TechTonic Club.',
        70,
        310
      );

      ctx.fillStyle = '#94A3B8';
      ctx.font = '400 24px Inter, sans-serif';
      ctx.fillText('• Cơ cấu: Ban Chủ Nhiệm • Ban Chuyên Môn • Ban Truyền Thông • Ban Đối Ngoại • Ban Sự Kiện', 70, 410);

      ctx.fillStyle = '#00F0FF';
      ctx.font = '600 26px JetBrains Mono, monospace';
      ctx.fillText('→ Nhấp vào Áo CLB 3D hoặc nhấn [E] để xem danh sách Ban Chủ Nhiệm', 70, 560);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, []);

  useEffect(() => {
    return () => {
      timelineTexture.dispose();
    };
  }, [timelineTexture]);

  useEffect(() => {
    return () => {
      activityTexture.dispose();
    };
  }, [activityTexture]);

  useEffect(() => {
    return () => {
      shirtPlaqueTexture.dispose();
    };
  }, [shirtPlaqueTexture]);

  const timelineExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'history-timeline',
      title: 'Dòng Thời Gian Phát Triển TechTonic Club (2022–2024)',
      category: 'history',
      year: '2022 - 2024',
      highlight: 'Hành Trình 3 Năm Đổi Mới',
      description: timelineMilestones
        .map((m) => `• ${m.year} — ${m.title}: ${m.description}`)
        .join(' '),
    }),
    [timelineMilestones]
  );

  const activityExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'activity-highlights',
      title: 'Kỷ Yếu Khoảnh Khắc Hoạt Động Tiêu Biểu',
      category: 'activity',
      year: '2023 - 2024',
      highlight: '4 Sự Kiện & Dấu Ấn Lớn',
      description: activityHighlights
        .map((a) => `• ${a.title} (${a.year}): ${a.summary}`)
        .join(' '),
    }),
    [activityHighlights]
  );

  const openShirtModal = () => openModal('shirt');
  const openTimelineModal = () => openModal('exhibit', timelineExhibit);
  const openActivityModal = () => openModal('exhibit', activityExhibit);

  return (
    <group>
      {/* ================= LEFT WALL: HISTORY TIMELINE & ACTIVITIES ================= */}
      <mesh
        position={[-16.5, 3.2, -6]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          openTimelineModal();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveringInteractive(true, 'Xem chi tiết Dòng Thời Gian CLB', openTimelineModal);
        }}
        onPointerOut={() => setHoveringInteractive(false)}
      >
        <planeGeometry args={[11, 4.2]} />
        <meshBasicMaterial map={timelineTexture} />
      </mesh>

      <mesh
        position={[-16.5, 3.2, 4]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          openActivityModal();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveringInteractive(true, 'Xem chi tiết Kỷ yếu hoạt động', openActivityModal);
        }}
        onPointerOut={() => setHoveringInteractive(false)}
      >
        <planeGeometry args={[6.5, 4.2]} />
        <meshBasicMaterial map={activityTexture} />
      </mesh>

      {/* ================= RIGHT WALL: THE CLUB SHIRT DISPLAY & BCN ================= */}
      <RigidBody type="fixed" position={[14.5, 0.45, -4]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.7, 0.9, 32]} />
          <meshStandardMaterial color="#182338" roughness={0.4} metalness={0.45} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[1.52, 1.52, 0.05, 32]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </RigidBody>

      <mesh ref={hologramRingRef} position={[14.5, 1.1, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.7, 32]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      <group
        ref={shirtGroupRef}
        position={[14.5, 1.6, -4]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          openShirtModal();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsShirtHovered(true);
          setHoveringInteractive(true, 'Xem Danh Sách Ban Chủ Nhiệm', openShirtModal);
        }}
        onPointerOut={() => {
          setIsShirtHovered(false);
          setHoveringInteractive(false);
        }}
      >
        <mesh position={[0, 1.25, 0]}>
          <planeGeometry args={[1.8, 0.45]} />
          <meshBasicMaterial color="#0c1220" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.25, 0.01]}>
          <planeGeometry args={[1.8, 0.02]} />
          <meshBasicMaterial color="#00F0FF" side={THREE.DoubleSide} />
        </mesh>

        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 1.4, 0.35]} />
          <meshStandardMaterial
            color="#152542"
            roughness={0.45}
            metalness={0.35}
            emissive="#0c2852"
            emissiveIntensity={isShirtHovered ? 0.9 : 0.45}
          />
        </mesh>

        <mesh position={[-0.8, 0.35, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.34]} />
          <meshStandardMaterial
            color="#152542"
            roughness={0.45}
            metalness={0.35}
            emissive="#0c2852"
            emissiveIntensity={0.35}
          />
        </mesh>

        <mesh position={[0.8, 0.35, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.34]} />
          <meshStandardMaterial
            color="#152542"
            roughness={0.45}
            metalness={0.35}
            emissive="#0c2852"
            emissiveIntensity={0.35}
          />
        </mesh>

        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.1, 16]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>

        <mesh position={[0, -0.05, 0.18]}>
          <planeGeometry args={[0.06, 1.2]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>

        <mesh position={[0.3, 0.3, 0.19]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>

        <mesh position={[0, 0.35, -0.19]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </group>

      {/* Info Plaque on Wall behind Club Shirt */}
      <mesh
        position={[16.5, 3.2, -4]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          openShirtModal();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveringInteractive(true, 'Xem Danh Sách Ban Chủ Nhiệm', openShirtModal);
        }}
        onPointerOut={() => setHoveringInteractive(false)}
      >
        <planeGeometry args={[7, 3.5]} />
        <meshBasicMaterial map={shirtPlaqueTexture} />
      </mesh>
    </group>
  );
};
