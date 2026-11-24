import React, { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { ClubShirtExhibit } from './ClubShirtExhibit';
import type { ExhibitItem } from '../../../types/heritage';

export const PerimeterGallery: React.FC = () => {
  const {
    setHoveringInteractive,
    openModal,
    timelineMilestones,
    activityHighlights,
  } = useHeritageStore();

  const timelineTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 2000, 976);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.fillText('DÒNG THỜI GIAN PHÁT TRIỂN • CLUB HISTORY TIMELINE', 80, 104);

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(100, 520);
      ctx.lineTo(1948, 520);
      ctx.stroke();

      const xPositions = [250, 950, 1650];
      timelineMilestones.slice(0, 3).forEach((m, idx) => {
        const x = xPositions[idx] ?? 250 + idx * 650;

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, 520, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, 520, 26, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 60px Inter, sans-serif';
        ctx.fillText(m.year, x - 70, 440);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 34px Inter, sans-serif';
        ctx.fillText(m.title, x - 120, 600);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 24px Inter, sans-serif';
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

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết cột mốc lịch sử', 80, 952);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, [timelineMilestones]);

  const activityTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1536, 1024);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 1488, 976);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('KHOẢNH KHẮC HOẠT ĐỘNG TIÊU BIỂU', 60, 92);

      activityHighlights.slice(0, 4).forEach((c, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 60 + col * 710;
        const y = 140 + row * 410;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, 660, 360);

        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, 660, 360);

        ctx.fillStyle = c.color;
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.fillText(`[ ${c.tag} ]`, x + 30, y + 60);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 34px Inter, sans-serif';
        ctx.fillText(c.title, x + 30, y + 120);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 22px Inter, sans-serif';
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

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '500 20px Inter, sans-serif';
        ctx.fillText('• Nhấp / [E] để xem chi tiết kỷ yếu câu lạc bộ', x + 30, y + 310);
      });
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, [activityHighlights]);

  const shirtPlaqueTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1400, 700);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1360, 660);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 26px "JetBrains Mono", monospace';
      ctx.fillText('BIỂU TƯỢNG TINH THẦN TECHTONIC', 70, 105);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 50px Inter, sans-serif';
      ctx.fillText('ÁO CÂU LẠC BỘ & BAN CHỦ NHIỆM', 70, 175);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 28px Inter, sans-serif';
      ctx.fillText(
        'Màu áo xanh navy kết hợp đường viền cyan đại diện cho kỷ luật kỹ thuật,',
        70,
        265
      );
      ctx.fillText(
        'tư duy tiên phong và tinh thần đồng đội của các thế hệ thành viên TechTonic Club.',
        70,
        312
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 24px Inter, sans-serif';
      ctx.fillText(
        '• Cơ cấu: Ban Chủ Nhiệm • Ban Chuyên Môn • Ban Truyền Thông • Ban Đối Ngoại • Ban Sự Kiện',
        70,
        412
      );

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 26px "JetBrains Mono", monospace';
      ctx.fillText('→ Nhấp vào Áo CLB 3D hoặc nhấn [E] để xem danh sách Ban Chủ Nhiệm', 70, 560);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, []);

  useEffect(() => {
    return () => timelineTexture.dispose();
  }, [timelineTexture]);

  useEffect(() => {
    return () => activityTexture.dispose();
  }, [activityTexture]);

  useEffect(() => {
    return () => shirtPlaqueTexture.dispose();
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
      {/* ================= LEFT WALL: FRAMED TIMELINE & ACTIVITIES ================= */}
      {/* 1. Framed History Timeline Board */}
      <group position={[-16.52, 3.2, -6]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[11.32, 4.52, 0.1]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.01]}
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
      </group>

      {/* 2. Framed Activity Highlights Board */}
      <group position={[-16.52, 3.2, 4]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[6.82, 4.52, 0.1]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.01]}
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
      </group>

      {/* ================= RIGHT WALL: TAILORED CLUB SHIRT & FRAMED BCN PLAQUE ================= */}
      <ClubShirtExhibit
        onInteract={openShirtModal}
        onHoverChange={(hovering) =>
          setHoveringInteractive(hovering, 'Xem Danh Sách Ban Chủ Nhiệm', openShirtModal)
        }
      />

      <group position={[16.52, 3.2, -4]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.32, 3.82, 0.1]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.01]}
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
    </group>
  );
};
