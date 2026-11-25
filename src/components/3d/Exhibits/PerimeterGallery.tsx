import React, { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import { createBrushedMetalMaps } from '../utils/proceduralMaterials';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import { ClubShirtExhibit } from './ClubShirtExhibit';
import type { ExhibitItem, HoverPreview } from '../../../types/heritage';

interface MuseumWallBoardProps {
  position: [number, number, number];
  rotation: [number, number, number];
  frameArgs: [number, number, number];
  planeArgs: [number, number];
  texture: THREE.CanvasTexture;
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  tooltip: string;
  preview: HoverPreview;
  onInteract: () => void;
  onHover: (
    hovering: boolean,
    tooltip?: string,
    action?: (() => void) | null,
    preview?: HoverPreview | null
  ) => void;
}

const MuseumWallBoard: React.FC<MuseumWallBoardProps> = ({
  position,
  rotation,
  frameArgs,
  planeArgs,
  texture,
  metalMaps,
  tooltip,
  preview,
  onInteract,
  onHover,
}) => {
  const [fw, fh] = frameArgs;
  const boltX = fw / 2 - 0.14;
  const boltY = fh / 2 - 0.14;

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox position={[0, 0, -0.05]} args={frameArgs} radius={0.04} smoothness={4} castShadow>
        <meshStandardMaterial
          color="#121c2e"
          roughnessMap={metalMaps.roughnessMap}
          bumpMap={metalMaps.bumpMap}
          bumpScale={0.004}
          metalness={0.88}
          roughness={0.2}
        />
      </RoundedBox>
      {/* 4 Brushed Titanium Corner Standoff Bolts */}
      {[
        [-boltX, boltY],
        [boltX, boltY],
        [-boltX, -boltY],
        [boltX, -boltY],
      ].map(([bx, by], i) => (
        <mesh key={`bolt-${i}`} position={[bx, by, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.03, 14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}
      {/* Museum Picture Light Bar mounted on top bezel */}
      <group position={[0, fh / 2 + 0.06, 0.24]}>
        <mesh position={[0, 0, -0.14]}>
          <boxGeometry args={[0.06, 0.03, 0.28]} />
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.22} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.026, 0.026, Math.min(fw * 0.45, 2.8), 16]} />
          <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.024, 0]}>
          <boxGeometry args={[Math.min(fw * 0.42, 2.65), 0.01, 0.028]} />
          <meshBasicMaterial color="#00F5FF" toneMapped={false} />
        </mesh>
      </group>
      <mesh
        position={[0, 0, 0.01]}
        onClick={(e) => {
          e.stopPropagation();
          onInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true, tooltip, onInteract, preview);
        }}
        onPointerOut={() => onHover(false)}
      >
        <planeGeometry args={planeArgs} />
        <meshStandardMaterial
          map={texture}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.48}
          roughness={0.42}
          metalness={0.04}
        />
      </mesh>
    </group>
  );
};

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  let lineCount = 0;

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (lineCount + 1 >= maxLines) {
        const truncated = `${line.replace(/[.,;:\s]+$/, '')}…`;
        ctx.fillText(truncated, x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      lineCount += 1;
    } else {
      line = test;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y);
    return y + lineHeight;
  }
  return y;
}

export const PerimeterGallery: React.FC = () => {
  const {
    setHoveringInteractive,
    openModal,
    timelineMilestones,
    activityHighlights,
  } = useHeritageStore();

  // Left Wall Bay 1: 5 Milestones alternating above/below timeline axis so zero labels overlap
  const timelineTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(2048, 1024, 1.5);
    if (ctx) {
      ctx.fillStyle = '#070d1b';
      ctx.fillRect(0, 0, 2048, 1024);

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 2000, 976);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 46px Inter, sans-serif';
      ctx.fillText('HÀNH TRÌNH PHÁT TRIỂN • TECHTONIC TIMELINE (2024 - 2025)', 80, 100);

      // Axis line
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(110, 512);
      ctx.lineTo(1938, 512);
      ctx.stroke();

      const milestones = timelineMilestones.slice(0, 5);
      const xStart = 230;
      const xStep = 395;

      milestones.forEach((m, idx) => {
        const x = xStart + idx * xStep;
        const isAbove = idx % 2 === 0;

        // Vertical connector stem
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, 512);
        ctx.lineTo(x, isAbove ? 410 : 614);
        ctx.stroke();

        // Node circle
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, 512, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, 512, 24, 0, Math.PI * 2);
        ctx.stroke();

        const cardW = 360;
        const cardH = 228;
        const cardX = Math.max(54, Math.min(2048 - 54 - cardW, x - cardW / 2));
        const cardY = isAbove ? 166 : 624;

        ctx.fillStyle = '#121b2e';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 28px "JetBrains Mono", monospace';
        ctx.fillText(m.year, cardX + 22, cardY + 44);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 25px Inter, sans-serif';
        ctx.fillText(m.title, cardX + 22, cardY + 84);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 19px Inter, sans-serif';
        drawWrappedText(ctx, m.description, cardX + 22, cardY + 120, cardW - 44, 27, 4);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết từng cột mốc lịch sử', 80, 956);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, [timelineMilestones]);

  // Left Wall Bay 2: 7 Core Values, Club Metrics & Benefits
  const coreValuesTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1680, 1024, 1.75);
    if (ctx) {
      ctx.fillStyle = '#070d1b';
      ctx.fillRect(0, 0, 1680, 1024);

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 1632, 976);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('BẢN SẮC • GIÁ TRỊ CỐT LÕI • THÀNH TỰU', 64, 78);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('7 GIÁ TRỊ CỐT LÕI & DẤU ẤN TECHTONIC CLUB', 64, 132);

      // Top 4 Metrics strip
      CLUB_PROFILE.metrics.forEach((m, idx) => {
        const x = 64 + idx * 394;
        const y = 166;
        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, 368, 118);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 368, 118);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 44px Inter, sans-serif';
        ctx.fillText(m.value, x + 24, y + 60);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 21px Inter, sans-serif';
        ctx.fillText(m.label, x + 24, y + 98);
      });

      // 7 Core Values cleanly in 2 columns + Benefits card in slot (col 1, row 3)
      CLUB_PROFILE.coreValues.forEach((val, idx) => {
        const col = idx < 4 ? 0 : 1;
        const row = idx < 4 ? idx : idx - 4;
        const x = 64 + col * 790;
        const y = 314 + row * 150;

        ctx.fillStyle = '#111a2d';
        ctx.fillRect(x, y, 760, 128);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, 760, 128);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px "JetBrains Mono", monospace';
        ctx.fillText(`0${idx + 1}`, x + 22, y + 46);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(val.name, x + 78, y + 46);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 20px Inter, sans-serif';
        drawWrappedText(ctx, val.note, x + 78, y + 84, 658, 28, 2);
      });

      ctx.fillStyle = '#13223b';
      ctx.fillRect(854, 764, 760, 128);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(854, 764, 760, 128);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 23px Inter, sans-serif';
      ctx.fillText('CLB MANG LẠI GÌ CHO BẠN?', 880, 810);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 21px Inter, sans-serif';
      ctx.fillText('• Anh chị tốt  • Cơ sở học thuật tốt  • Bạn bè cùng chí hướng', 880, 856);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 21px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem đầy đủ 7 Giá trị cốt lõi & Lợi ích', 64, 962);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Right Wall Bay 1: 3-Term BCN Leadership & 4 Functional Departments
  const shirtPlaqueTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1440, 760, 2);
    if (ctx) {
      ctx.fillStyle = '#070d1b';
      ctx.fillRect(0, 0, 1440, 760);

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 720);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('CƠ CẤU TỔ CHỨC & BAN CHỦ NHIỆM (2024 - 2027)', 68, 76);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('ÁO CÂU LẠC BỘ & 4 BAN CHỨC NĂNG', 68, 134);

      // 3-Term BCN Leadership strip
      ctx.fillStyle = '#101a2d';
      ctx.fillRect(68, 158, 1300, 74);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(68, 158, 1300, 74);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 18px "JetBrains Mono", monospace';
      ctx.fillText('CHỦ NHIỆM QUA CÁC NHIỆM KỲ:', 92, 188);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 20px Inter, sans-serif';
      ctx.fillText(
        'NK 2024–2025: Nguyễn Văn Quang  •  NK 2025–2026: Phan Nhật Minh Anh  •  NK 2026–2027: Đặng Nguyên Quốc Bảo',
        92,
        218
      );

      CLUB_PROFILE.departmentStructure.slice(0, 4).forEach((d, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 68 + col * 665;
        const y = 258 + row * 196;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, 635, 174);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 635, 174);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 25px Inter, sans-serif';
        ctx.fillText(d.name, x + 24, y + 46);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 19px Inter, sans-serif';
        drawWrappedText(ctx, d.summary, x + 24, y + 88, 587, 27, 3);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('→ Nhấp vào Áo CLB hoặc bảng này / nhấn [E] để tra cứu 26 hồ sơ BCN & Co-Founders', 68, 696);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Right Wall Bay 2: All 5 Weekly Academic Tracks (3 top + 2 bottom balanced cards)
  const academicTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1440, 800, 2);
    if (ctx) {
      ctx.fillStyle = '#070d1b';
      ctx.fillRect(0, 0, 1440, 800);

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 760);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('SINH HOẠT HỌC THUẬT HẰNG TUẦN • 5 ĐỘI CHUYÊN MÔN', 68, 84);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('CHUYÊN MÔN & ĐỘI DỰ ÁN PRODUCT TEAM', 68, 142);

      const tracks = CLUB_PROFILE.weeklyTracks.slice(0, 5);
      tracks.forEach((track, idx) => {
        const isTopRow = idx < 3;
        const w = isTopRow ? 418 : 635;
        const h = 232;
        const x = isTopRow ? 68 + idx * 441 : 68 + (idx - 3) * 665;
        const y = isTopRow ? 182 : 440;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 17px "JetBrains Mono", monospace';
        ctx.fillText(`[ ${track.schedule.toUpperCase()} ]`, x + 22, y + 40);

        ctx.fillStyle = '#f8fafc';
        ctx.font = isTopRow ? 'bold 23px Inter, sans-serif' : 'bold 25px Inter, sans-serif';
        const afterTitleY = drawWrappedText(ctx, track.title, x + 22, y + 78, w - 44, 30, 2);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 18px Inter, sans-serif';
        drawWrappedText(ctx, track.desc, x + 22, afterTitleY + 6, w - 44, 25, 4);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp / [E] để xem chi tiết lộ trình FE, BE, AI & Data, CSLT & CSDL', 68, 732);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Front-Left Wall: Partners, TechXplore Recruitment 3 Steps & Contact Info
  const partnersContactTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1440, 760, 2);
    if (ctx) {
      ctx.fillStyle = '#070d1b';
      ctx.fillRect(0, 0, 1440, 760);

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 720);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('ĐỐI TÁC DOANH NGHIỆP • TUYỂN THÀNH VIÊN TECHXPLORE', 68, 78);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('HỢP TÁC, TUYỂN DỤNG & LIÊN HỆ', 68, 136);

      // Partners boxes
      CLUB_PROFILE.partners.slice(0, 2).forEach((partner, idx) => {
        const x = 68 + idx * 665;
        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, 168, 635, 118);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 168, 635, 118);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 18px "JetBrains Mono", monospace';
        ctx.fillText('ĐỐI TÁC ĐỒNG HÀNH CHÍNH THỨC', x + 26, 208);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 34px Inter, sans-serif';
        ctx.fillText(partner.name, x + 26, 258);
      });

      // Left lower card: Contact info
      ctx.fillStyle = '#111a2d';
      ctx.fillRect(68, 312, 635, 344);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 2;
      ctx.strokeRect(68, 312, 635, 344);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText('Văn Phòng & Kênh Chính Thức', 94, 356);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 19px Inter, sans-serif';
      let cy = drawWrappedText(ctx, `• Địa chỉ: ${CLUB_PROFILE.contact.address}`, 94, 400, 583, 27, 2);
      cy = drawWrappedText(ctx, `• Email: ${CLUB_PROFILE.contact.email}`, 94, cy + 8, 583, 27, 1);
      cy = drawWrappedText(ctx, `• Hotline: ${CLUB_PROFILE.contact.hotline}`, 94, cy + 8, 583, 27, 1);
      cy = drawWrappedText(
        ctx,
        '• Website: techtonic-club.id.vn • Facebook • YouTube • Instagram • Threads',
        94,
        cy + 8,
        583,
        27,
        2
      );

      // Right lower card: Recruitment 3 Steps & FAQ
      ctx.fillStyle = '#111a2d';
      ctx.fillRect(733, 312, 635, 344);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 2;
      ctx.strokeRect(733, 312, 635, 344);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText('Quy Trình TechXplore & FAQ', 759, 356);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 18px Inter, sans-serif';
      let ry = 398;
      CLUB_PROFILE.recruitmentSummary.steps.forEach((step) => {
        ry = drawWrappedText(ctx, `→ ${step}`, 759, ry, 583, 25, 2);
      });

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 18px Inter, sans-serif';
      ry += 6;
      CLUB_PROFILE.recruitmentSummary.faqHighlights.forEach((faq) => {
        ry = drawWrappedText(ctx, `• ${faq}`, 759, ry, 583, 25, 2);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để mở liên kết chính thức & thông tin tuyển thành viên', 68, 706);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Front-Right Wall: Member Testimonials
  const testimonialsTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1440, 760, 2);
    if (ctx) {
      ctx.fillStyle = '#070d1b';
      ctx.fillRect(0, 0, 1440, 760);

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 720);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('TIẾNG NÓI THÀNH VIÊN & MENTOR', 68, 80);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('THÀNH VIÊN NÓI GÌ VỀ TECHTONIC', 68, 138);

      CLUB_PROFILE.testimonials.slice(0, 4).forEach((t, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 68 + col * 665;
        const y = 178 + row * 242;
        const w = 635;
        const h = 218;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(t.name, x + 26, y + 48);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 20px Inter, sans-serif';
        drawWrappedText(ctx, t.role, x + 26, y + 92, w - 52, 28, 4);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp / [E] để xem danh sách Ban Chủ Nhiệm & Mentor các nhiệm kỳ', 68, 706);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  useEffect(() => {
    return () => {
      timelineTexture.dispose();
      coreValuesTexture.dispose();
      shirtPlaqueTexture.dispose();
      academicTexture.dispose();
      partnersContactTexture.dispose();
      testimonialsTexture.dispose();
    };
  }, [
    timelineTexture,
    coreValuesTexture,
    shirtPlaqueTexture,
    academicTexture,
    partnersContactTexture,
    testimonialsTexture,
  ]);

  const timelineExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'history-timeline',
      title: 'Hành Trình Phát Triển CLB TechTonic (07/2024 – 05/2025)',
      category: 'history',
      year: '2024 - 2025',
      highlight: 'Từ Ý Tưởng Đến CLB Học Thuật Tại DUE',
      description:
        'Những dấu mốc hình thành và phát triển chính thức của TechTonic Club tại Trường Đại học Kinh tế - Đại học Đà Nẵng.',
      bullets: timelineMilestones.map((m) => `${m.year} — ${m.title}: ${m.description}`),
    }),
    [timelineMilestones]
  );

  const coreValuesExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'core-values-left',
      title: '7 Giá Trị Cốt Lõi & Dấu Ấn TechTonic Club',
      category: 'history',
      year: '2024 - 2026',
      highlight: 'Học Thuật • Kết Nối • Phát Triển • Trải Nghiệm • Chân Thành',
      description:
        'Hệ giá trị dẫn dắt văn hóa học thuật cạnh tranh lành mạnh, chia sẻ chân thành và đổi mới liên tục tại TechTonic Club.',
      metrics: CLUB_PROFILE.metrics,
      bullets: CLUB_PROFILE.coreValues.map((v) => `${v.name}: ${v.note}`),
    }),
    []
  );

  const academicExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'academic-tracks',
      title: 'Sinh Hoạt Chuyên Môn Hằng Tuần & Product Team',
      category: 'activity',
      year: 'Hằng tuần & Tháng',
      highlight: '5 Đội Chuyên Môn: FE • BE • AI & Data • CSLT & CSDL • Product Team',
      description:
        'Hoạt động học thuật cốt lõi giúp thành viên thực hành dự án thực tế, rèn kỹ năng thuyết trình và chuẩn bị thi đấu ICPC-OLP, NCKH.',
      bullets: CLUB_PROFILE.weeklyTracks.map((w) => `${w.title} (${w.schedule}): ${w.desc}`),
    }),
    []
  );

  const partnersContactExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'partners-contact',
      title: 'Đối Tác Doanh Nghiệp, Tuyển Thành Viên & Kênh Kết Nối',
      category: 'history',
      year: 'Đà Nẵng • DUE',
      highlight: CLUB_PROFILE.partners.map((p) => p.name).join(' • '),
      description: `Địa chỉ: ${CLUB_PROFILE.contact.address}. Email: ${CLUB_PROFILE.contact.email}. Hotline: ${CLUB_PROFILE.contact.hotline}.`,
      bullets: [
        `Đối tác đồng hành: ${CLUB_PROFILE.partners.map((p) => p.name).join(', ')}`,
        ...CLUB_PROFILE.recruitmentSummary.steps.map((s) => `Quy trình TechXplore — ${s}`),
        ...CLUB_PROFILE.recruitmentSummary.faqHighlights,
      ],
      links: [
        { label: 'Website chính thức', url: CLUB_PROFILE.contact.website },
        { label: 'Facebook TechTonic Club', url: CLUB_PROFILE.contact.facebook },
        { label: 'YouTube TechTonic Club', url: CLUB_PROFILE.contact.youtube },
        { label: 'Instagram @techtonic.club', url: CLUB_PROFILE.contact.instagram },
        { label: 'Threads @techtonic.club', url: CLUB_PROFILE.contact.threads },
      ],
    }),
    []
  );

  const timelinePreview: HoverPreview = useMemo(
    () => ({
      title: 'Hành Trình Phát Triển (2024 – 2025)',
      badge: 'LỊCH SỬ CLB',
      summary: '5 cột mốc chính thức từ ấp ủ ý tưởng tại DUE đến giải thưởng sinh viên và các nhiệm kỳ tiếp nối.',
      bullets: timelineMilestones.slice(0, 3).map((m) => `${m.year}: ${m.title}`),
      actionLabel: 'Xem full Timeline lịch sử',
    }),
    [timelineMilestones]
  );

  const coreValuesPreview: HoverPreview = useMemo(
    () => ({
      title: '7 Giá Trị Cốt Lõi & Dấu Ấn CLB',
      badge: '10+ GIẢI THƯỞNG • 100+ THÀNH VIÊN',
      summary: 'Hệ 7 giá trị nền tảng từ Chia sẻ, Tương trợ, Chân thành đến Đổi mới (phản chứng).',
      bullets: CLUB_PROFILE.coreValues.slice(0, 3).map((v) => `${v.name}: ${v.note}`),
      actionLabel: 'Xem chi tiết 7 giá trị cốt lõi',
    }),
    []
  );

  const shirtPreview: HoverPreview = useMemo(
    () => ({
      title: 'Áo Câu Lạc Bộ & Ban Chủ Nhiệm',
      badge: 'ĐỒNG PHỤC • 3 NHIỆM KỲ',
      summary: 'Biểu tượng đồng phục TechTonic gắn liền với 8 Co-Founders, Cố vấn và 26+ thành viên BCN qua 3 nhiệm kỳ.',
      metrics: [
        { label: 'Co-Founders', value: '8' },
        { label: 'Ban chuyên trách', value: '4 ban' },
      ],
      bullets: [
        'NK 2024–2025: CN Nguyễn Văn Quang',
        'NK 2025–2026: CN Phan Nhật Minh Anh',
        'NK 2026–2027: CN Đặng Nguyên Quốc Bảo',
      ],
      actionLabel: 'Mở danh sách 26+ hồ sơ BCN',
    }),
    []
  );

  const academicPreview: HoverPreview = useMemo(
    () => ({
      title: 'Sinh Hoạt Học Thuật Hằng Tuần',
      badge: '5 ĐỘI CHUYÊN MÔN',
      summary: 'Đào tạo thực chiến từ CSLT/CSDL đến Front-End, Back-End, AI & Data và đội Product Team phát triển sản phẩm.',
      bullets: CLUB_PROFILE.weeklyTracks.slice(0, 4).map((t) => `${t.title} (${t.schedule})`),
      actionLabel: 'Xem chi tiết 5 lộ trình học thuật',
    }),
    []
  );

  const partnersPreview: HoverPreview = useMemo(
    () => ({
      title: 'Đối Tác, Tuyển Dụng & Kênh Liên Hệ',
      badge: 'VTC ACADEMY • MGM',
      summary: 'Đồng hành cùng doanh nghiệp công nghệ tại Đà Nẵng; tuyển thành viên TechXplore không thu phí cho SV DUE.',
      bullets: [
        ...CLUB_PROFILE.recruitmentSummary.steps,
        `Email: ${CLUB_PROFILE.contact.email}`,
      ],
      actionLabel: 'Mở liên kết kênh & thông tin tuyển sinh',
    }),
    []
  );

  const testimonialsPreview: HoverPreview = useMemo(
    () => ({
      title: 'Tiếng Nói Thành Viên & Mentor',
      badge: 'CỘNG ĐỒNG TECHTONIC',
      summary: 'Chia sẻ thực tế từ cố vấn học thuật, ban chủ nhiệm và thành viên đang phát triển sản phẩm tại TechTonic.',
      bullets: CLUB_PROFILE.testimonials.slice(0, 3).map((t) => t.name),
      actionLabel: 'Xem hồ sơ BCN & Mentor',
    }),
    []
  );

  const openShirtModal = () => openModal('shirt');
  const openTimelineModal = () => openModal('exhibit', timelineExhibit);
  const openCoreValuesModal = () => openModal('exhibit', coreValuesExhibit);
  const openAcademicModal = () => openModal('exhibit', academicExhibit);
  const openPartnersModal = () => openModal('exhibit', partnersContactExhibit);

  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);
  useEffect(() => {
    return () => {
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
    };
  }, [metalMaps]);

  return (
    <group>
      {/* ================= LEFT WALL: TIMELINE + 6 TERM ACTIVITIES ================= */}
      <MuseumWallBoard
        position={[-16.52, 3.2, -5.9]}
        rotation={[0, Math.PI / 2, 0]}
        frameArgs={[11.32, 4.52, 0.1]}
        planeArgs={[11, 4.2]}
        texture={timelineTexture}
        metalMaps={metalMaps}
        tooltip="Xem Hành trình phát triển CLB"
        preview={timelinePreview}
        onInteract={openTimelineModal}
        onHover={setHoveringInteractive}
      />

      <MuseumWallBoard
        position={[-16.52, 3.2, 4.1]}
        rotation={[0, Math.PI / 2, 0]}
        frameArgs={[7.42, 4.52, 0.1]}
        planeArgs={[7.1, 4.2]}
        texture={coreValuesTexture}
        metalMaps={metalMaps}
        tooltip="Xem 7 Giá trị cốt lõi & Dấu ấn"
        preview={coreValuesPreview}
        onInteract={openCoreValuesModal}
        onHover={setHoveringInteractive}
      />

      {/* ================= RIGHT WALL: CLUB SHIRT + BCN + WEEKLY ACADEMICS ================= */}
      <ClubShirtExhibit
        onInteract={openShirtModal}
        onHoverChange={(hovering) =>
          setHoveringInteractive(hovering, 'Xem Danh Sách Ban Chủ Nhiệm', openShirtModal, shirtPreview)
        }
      />

      <MuseumWallBoard
        position={[16.52, 3.2, -4.0]}
        rotation={[0, -Math.PI / 2, 0]}
        frameArgs={[7.52, 4.12, 0.1]}
        planeArgs={[7.2, 3.8]}
        texture={shirtPlaqueTexture}
        metalMaps={metalMaps}
        tooltip="Xem Cơ cấu & Ban Chủ Nhiệm"
        preview={shirtPreview}
        onInteract={openShirtModal}
        onHover={setHoveringInteractive}
      />

      <MuseumWallBoard
        position={[16.52, 3.2, 4.0]}
        rotation={[0, -Math.PI / 2, 0]}
        frameArgs={[7.42, 4.12, 0.1]}
        planeArgs={[7.1, 3.8]}
        texture={academicTexture}
        metalMaps={metalMaps}
        tooltip="Xem Chuyên môn hằng tuần"
        preview={academicPreview}
        onInteract={openAcademicModal}
        onHover={setHoveringInteractive}
      />

      {/* ================= FRONT INNER WALLS: PARTNERS/CONTACT & TESTIMONIALS ================= */}
      <MuseumWallBoard
        position={[-12.6, 3.1, 8.05]}
        rotation={[0, Math.PI, 0]}
        frameArgs={[7.12, 3.82, 0.1]}
        planeArgs={[6.8, 3.5]}
        texture={partnersContactTexture}
        metalMaps={metalMaps}
        tooltip="Xem Đối tác & Kênh kết nối"
        preview={partnersPreview}
        onInteract={openPartnersModal}
        onHover={setHoveringInteractive}
      />

      <MuseumWallBoard
        position={[9.6, 3.1, 8.05]}
        rotation={[0, Math.PI, 0]}
        frameArgs={[7.12, 3.82, 0.1]}
        planeArgs={[6.8, 3.5]}
        texture={testimonialsTexture}
        metalMaps={metalMaps}
        tooltip="Xem Ban Chủ Nhiệm & Mentor"
        preview={testimonialsPreview}
        onInteract={openShirtModal}
        onHover={setHoveringInteractive}
      />
    </group>
  );
};
