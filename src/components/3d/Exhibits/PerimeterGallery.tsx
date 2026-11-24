import React, { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import { ClubShirtExhibit } from './ClubShirtExhibit';
import type { ExhibitItem } from '../../../types/heritage';

export const PerimeterGallery: React.FC = () => {
  const {
    setHoveringInteractive,
    openModal,
    timelineMilestones,
    activityHighlights,
  } = useHeritageStore();

  // Left Wall Bay 1: 5 Milestones alternating above/below timeline axis so zero labels overlap
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

        // Card container (width 360px, centered around x, cleanly separated from neighbors)
        const cardW = 360;
        const cardH = 220;
        const cardX = Math.max(54, Math.min(2048 - 54 - cardW, x - cardW / 2));
        const cardY = isAbove ? 170 : 624;

        ctx.fillStyle = '#121b2e';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 30px "JetBrains Mono", monospace';
        ctx.fillText(m.year, cardX + 22, cardY + 46);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(m.title, cardX + 22, cardY + 86);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 20px Inter, sans-serif';
        const words = m.description.split(' ');
        let line = '';
        let ly = cardY + 124;
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (ctx.measureText(test).width > cardW - 44) {
            ctx.fillText(line, cardX + 22, ly);
            line = w;
            ly += 28;
            if (ly > cardY + cardH - 18) break;
          } else {
            line = test;
          }
        }
        if (line && ly <= cardY + cardH - 14) {
          ctx.fillText(line, cardX + 22, ly);
        }
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết từng cột mốc lịch sử', 80, 956);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, [timelineMilestones]);

  // Left Wall Bay 2: 6 Fixed Term Events (clean 3x2 grid)
  const activityTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1680;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1680, 1024);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 1632, 976);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('CHUỖI HOẠT ĐỘNG TRỌNG TÂM MỖI NHIỆM KỲ', 60, 94);

      activityHighlights.slice(0, 6).forEach((c, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = 60 + col * 530;
        const y = 140 + row * 395;
        const cardW = 496;
        const cardH = 355;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, cardW, cardH);

        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, cardW, cardH);

        ctx.fillStyle = c.color;
        ctx.font = '600 18px "JetBrains Mono", monospace';
        ctx.fillText(`[ ${c.tag} ]`, x + 26, y + 48);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 28px Inter, sans-serif';
        const titleWords = c.title.split(' ');
        let tLine = '';
        let tY = y + 96;
        for (const w of titleWords) {
          const test = tLine ? `${tLine} ${w}` : w;
          if (ctx.measureText(test).width > cardW - 52) {
            ctx.fillText(tLine, x + 26, tY);
            tLine = w;
            tY += 36;
          } else {
            tLine = test;
          }
        }
        ctx.fillText(tLine, x + 26, tY);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 21px Inter, sans-serif';
        const words = c.summary.split(' ');
        let line = '';
        let lineY = tY + 46;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > cardW - 52) {
            ctx.fillText(line, x + 26, lineY);
            line = word;
            lineY += 30;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, x + 26, lineY);

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '500 18px "JetBrains Mono", monospace';
        ctx.fillText(c.year, x + 26, y + cardH - 28);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 20px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết chuỗi sự kiện & tuyển thành viên', 60, 962);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, [activityHighlights]);

  // Right Wall Bay 1: Org Structure & Executive Board
  const shirtPlaqueTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1440, 760);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 720);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('CƠ CẤU TỔ CHỨC & BAN CHỦ NHIỆM (2024 - 2027)', 68, 92);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 46px Inter, sans-serif';
      ctx.fillText('ÁO CÂU LẠC BỘ & 4 BAN CHỨC NĂNG', 68, 156);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 24px Inter, sans-serif';
      ctx.fillText(
        '8 Co-Founders • 3 Quản lý BCN + 27 Thành viên các ban • Cố vấn học thuật • 45+ Thành viên tự do',
        68,
        218
      );

      const depts = [
        { name: 'Ban Chuyên Môn (8 TV)', desc: 'Lập lộ trình học thuật, dự án FE / BE / AI & Data, ICPC-OLP.' },
        { name: 'Ban Sự Kiện (7 TV)', desc: 'Ý tưởng, kịch bản, điều phối Mentor-Mentee, TechXplore, TechWare.' },
        { name: 'Ban Truyền Thông (9 TV)', desc: 'Chiến dịch nội dung, thiết kế ấn phẩm, media & lan tỏa hình ảnh.' },
        { name: 'Ban Nhân Sự (3 TV)', desc: 'Gây quỹ, đối ngoại tài trợ, hồ sơ thành viên, tài chính & hậu cần.' },
      ];

      depts.forEach((d, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 68 + col * 665;
        const y = 264 + row * 170;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, 635, 144);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 635, 144);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(d.name, x + 24, y + 48);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 20px Inter, sans-serif';
        ctx.fillText(d.desc, x + 24, y + 96);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('→ Nhấp vào Áo CLB hoặc bảng này / nhấn [E] để tra cứu 3 nhiệm kỳ BCN', 68, 678);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  }, []);

  // Right Wall Bay 2: Weekly Academic Tracks
  const academicTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1440, 800);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 760);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('SINH HOẠT HỌC THUẬT HẰNG TUẦN', 68, 92);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 44px Inter, sans-serif';
      ctx.fillText('CHUYÊN MÔN & ĐỘI DỰ ÁN PRODUCT TEAM', 68, 154);

      CLUB_PROFILE.weeklyTracks.forEach((track, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 68 + col * 665;
        const y = 204 + row * 238;
        const w = 635;
        const h = 210;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 18px "JetBrains Mono", monospace';
        ctx.fillText(`[ ${track.schedule.toUpperCase()} ]`, x + 24, y + 44);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(track.title, x + 24, y + 88);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 20px Inter, sans-serif';
        const words = track.desc.split(' ');
        let line = '';
        let ly = y + 130;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > w - 48) {
            ctx.fillText(line, x + 24, ly);
            line = word;
            ly += 28;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, x + 24, ly);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp / [E] để xem lộ trình chuyên môn FE, BE, AI & Data', 68, 728);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  // Front-Left Wall: Partners & Contact Info
  const partnersContactTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1440, 760);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 720);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('ĐỐI TÁC ĐỒNG HÀNH & KẾT NỐI CHÍNH THỨC', 68, 92);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 44px Inter, sans-serif';
      ctx.fillText('HỢP TÁC & THÔNG TIN LIÊN HỆ', 68, 154);

      // Partners boxes
      CLUB_PROFILE.partners.forEach((partner, idx) => {
        const x = 68 + idx * 665;
        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, 204, 635, 132);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 204, 635, 132);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 20px "JetBrains Mono", monospace';
        ctx.fillText('ĐỐI TÁC DOANH NGHIỆP', x + 26, 250);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillText(partner, x + 26, 304);
      });

      // Contact box
      ctx.fillStyle = '#111a2d';
      ctx.fillRect(68, 372, 1300, 270);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 2;
      ctx.strokeRect(68, 372, 1300, 270);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText('Văn phòng & Kênh Truyền Thông TechTonic Club', 98, 424);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 23px Inter, sans-serif';
      ctx.fillText(`• Địa chỉ: ${CLUB_PROFILE.contact.address}`, 98, 476);
      ctx.fillText(
        `• Email: ${CLUB_PROFILE.contact.email}   •   Hotline: ${CLUB_PROFILE.contact.hotline}`,
        98,
        522
      );
      ctx.fillText(
        '• Kênh chính thức: Website techtonic-club.id.vn • Facebook • YouTube • Instagram • Threads',
        98,
        568
      );
      ctx.fillText(
        '• Tuyển thành viên TechXplore: Không thu phí thành viên • Dành cho SV năm 1–2 DUE',
        98,
        614
      );

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để mở liên kết các kênh chính thức', 68, 698);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  // Front-Right Wall: Member Testimonials
  const testimonialsTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1440, 760);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1400, 720);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px "JetBrains Mono", monospace';
      ctx.fillText('TIẾNG NÓI THÀNH VIÊN & MENTOR', 68, 92);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 44px Inter, sans-serif';
      ctx.fillText('THÀNH VIÊN NÓI GÌ VỀ TECHTONIC', 68, 154);

      CLUB_PROFILE.testimonials.forEach((t, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 68 + col * 665;
        const y = 204 + row * 224;
        const w = 635;
        const h = 196;

        ctx.fillStyle = '#131d32';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillText(t.name, x + 26, y + 54);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 21px Inter, sans-serif';
        const words = t.role.split(' ');
        let line = '';
        let ly = y + 102;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > w - 52) {
            ctx.fillText(line, x + 26, ly);
            line = word;
            ly += 30;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, x + 26, ly);
      });

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp / [E] để xem danh sách Ban Chủ Nhiệm & Mentor các nhiệm kỳ', 68, 698);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      timelineTexture.dispose();
      activityTexture.dispose();
      shirtPlaqueTexture.dispose();
      academicTexture.dispose();
      partnersContactTexture.dispose();
      testimonialsTexture.dispose();
    };
  }, [
    timelineTexture,
    activityTexture,
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

  const activityExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'activity-highlights',
      title: 'Chuỗi Hoạt Động Trọng Tâm & Tuyển Thành Viên TechXplore',
      category: 'activity',
      year: 'Mỗi nhiệm kỳ',
      highlight: '6 Hoạt Động Cố Định • Không Thu Phí Thành Viên',
      description:
        'Các chương trình kết nối tân sinh viên, tuyển thành viên qua Vòng đơn → Phỏng vấn → Thực tập (đối với BCN) và chuỗi hoạt động gắn kết nội bộ.',
      bullets: activityHighlights.map((a) => `${a.title} (${a.tag}): ${a.summary}`),
    }),
    [activityHighlights]
  );

  const academicExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'academic-tracks',
      title: 'Sinh Hoạt Chuyên Môn Hằng Tuần & Product Team',
      category: 'activity',
      year: 'Hằng tuần & Tháng',
      highlight: 'FE • BE • AI & Data • CSLT & CSDL',
      description:
        'Hoạt động học thuật cốt lõi giúp thành viên thực hành dự án thực tế, rèn kỹ năng thuyết trình và chuẩn bị thi đấu ICPC-OLP, NCKH.',
      bullets: CLUB_PROFILE.weeklyTracks.map((w) => `${w.title} (${w.schedule}): ${w.desc}`),
    }),
    []
  );

  const partnersContactExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'partners-contact',
      title: 'Đối Tác Doanh Nghiệp & Kênh Kết Nối TechTonic Club',
      category: 'history',
      year: 'Đà Nẵng • DUE',
      highlight: 'VTC Academy • MGM Technology',
      description: `Địa chỉ: ${CLUB_PROFILE.contact.address}. Email: ${CLUB_PROFILE.contact.email}. Hotline: ${CLUB_PROFILE.contact.hotline}.`,
      bullets: [
        'Đối tác đồng hành: VTC Academy, MGM Technology',
        'Đối tượng tham gia: Sinh viên năm 1–2 DUE (không yêu cầu biết code trước)',
        'Không thu phí thành viên — học tập và rèn luyện thực chiến',
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

  const openShirtModal = () => openModal('shirt');
  const openTimelineModal = () => openModal('exhibit', timelineExhibit);
  const openActivityModal = () => openModal('exhibit', activityExhibit);
  const openAcademicModal = () => openModal('exhibit', academicExhibit);
  const openPartnersModal = () => openModal('exhibit', partnersContactExhibit);

  return (
    <group>
      {/* ================= LEFT WALL: TIMELINE + 6 TERM ACTIVITIES ================= */}
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
            setHoveringInteractive(true, 'Xem Hành trình phát triển CLB', openTimelineModal);
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[11, 4.2]} />
          <meshBasicMaterial map={timelineTexture} />
        </mesh>
      </group>

      <group position={[-16.52, 3.2, 3.6]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.42, 4.52, 0.1]} radius={0.04} smoothness={4}>
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
            setHoveringInteractive(true, 'Xem Chuỗi hoạt động trọng tâm', openActivityModal);
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[7.1, 4.2]} />
          <meshBasicMaterial map={activityTexture} />
        </mesh>
      </group>

      {/* ================= RIGHT WALL: CLUB SHIRT + BCN + WEEKLY ACADEMICS ================= */}
      <ClubShirtExhibit
        onInteract={openShirtModal}
        onHoverChange={(hovering) =>
          setHoveringInteractive(hovering, 'Xem Danh Sách Ban Chủ Nhiệm', openShirtModal)
        }
      />

      <group position={[16.52, 3.2, -4.2]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.52, 4.12, 0.1]} radius={0.04} smoothness={4}>
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
            setHoveringInteractive(true, 'Xem Cơ cấu & Ban Chủ Nhiệm', openShirtModal);
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[7.2, 3.8]} />
          <meshBasicMaterial map={shirtPlaqueTexture} />
        </mesh>
      </group>

      <group position={[16.52, 3.2, 3.8]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.12, 4.12, 0.1]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            openAcademicModal();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveringInteractive(true, 'Xem Chuyên môn hằng tuần', openAcademicModal);
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[6.8, 3.8]} />
          <meshBasicMaterial map={academicTexture} />
        </mesh>
      </group>

      {/* ================= FRONT INNER WALLS: PARTNERS/CONTACT & TESTIMONIALS ================= */}
      <group position={[-9.6, 3.1, 8.05]} rotation={[0, Math.PI, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.12, 3.82, 0.1]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.26} />
        </RoundedBox>
        <mesh
          position={[0, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            openPartnersModal();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveringInteractive(true, 'Xem Đối tác & Kênh kết nối', openPartnersModal);
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[6.8, 3.5]} />
          <meshBasicMaterial map={partnersContactTexture} />
        </mesh>
      </group>

      <group position={[9.6, 3.1, 8.05]} rotation={[0, Math.PI, 0]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.12, 3.82, 0.1]} radius={0.04} smoothness={4}>
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
            setHoveringInteractive(true, 'Xem Ban Chủ Nhiệm & Mentor', openShirtModal);
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[6.8, 3.5]} />
          <meshBasicMaterial map={testimonialsTexture} />
        </mesh>
      </group>
    </group>
  );
};
