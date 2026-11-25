import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { CLUB_PROFILE } from '../../../data/heritageSeed';
import { useReducedMotionPreference } from '../Effects/AmbientMotion';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
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

const SLAT_POSITIONS = [-6.95, -6.55, -6.15, 6.15, 6.55, 6.95];

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
  const { setHoveringInteractive, openModal, activityHighlights } = useHeritageStore();
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
    const { canvas, ctx } = createHiResCanvas(2048, 1024, 1.5);
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
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, []);

  // Back-left wing panel (left of Dream It - Code It): 6 Key Term Events & Activities
  const eventsWingTexture = useMemo(() => {
    const { canvas, ctx } = createHiResCanvas(1520, 1100, 2);
    if (ctx) {
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(0, 0, 1520, 1100);

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.42)';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 1472, 1052);

      ctx.fillStyle = '#c084fc';
      ctx.font = '600 22px "JetBrains Mono", monospace';
      ctx.fillText('CHUỖI SỰ KIỆN TRỌNG TÂM • MỖI NHIỆM KỲ', 68, 84);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('6 CHƯƠNG TRÌNH & SỰ KIỆN CLB', 68, 138);

      activityHighlights.slice(0, 6).forEach((ev, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 68 + col * 704;
        const y = 178 + row * 276;
        const w = 676;
        const h = 250;

        ctx.fillStyle = '#121b2e';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = ev.color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = ev.color;
        ctx.font = '600 17px "JetBrains Mono", monospace';
        ctx.fillText(`[ ${ev.tag} • ${ev.year} ]`, x + 24, y + 38);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 25px Inter, sans-serif';
        ctx.fillText(ev.title, x + 24, y + 76, w - 48);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 19px Inter, sans-serif';
        drawWrappedText(ctx, ev.summary, x + 24, y + 114, w - 48, 26);

        if (ev.goal) {
          ctx.fillStyle = '#7dd3fc';
          ctx.font = '500 17px Inter, sans-serif';
          ctx.fillText(`Mục tiêu: ${ev.goal}`, x + 24, y + h - 24, w - 48);
        }
      });

      ctx.fillStyle = '#e879f9';
      ctx.font = '500 21px "JetBrains Mono", monospace';
      ctx.fillText('• Nhấp hoặc nhấn [E] để xem chi tiết 6 sự kiện & lộ trình TechXplore', 68, 1034);
    }
    return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
  }, [activityHighlights]);

  useEffect(() => {
    return () => {
      outerHexGeom.dispose();
      innerHexGeom.dispose();
      textTexture.dispose();
      eventsWingTexture.dispose();
    };
  }, [outerHexGeom, innerHexGeom, textTexture, eventsWingTexture]);

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

  const eventsWingExhibit: ExhibitItem = useMemo(
    () => ({
      id: 'center-events-wing',
      title: 'Chuỗi Hoạt Động Trọng Tâm & Sự Kiện CLB',
      category: 'activity',
      year: 'Mỗi nhiệm kỳ',
      highlight: '6 Sự Kiện Cố Định • Không Thu Phí Thành Viên',
      description:
        'Các chương trình kết nối tân sinh viên, tuyển thành viên TechXplore và chuỗi sự kiện gắn kết cộng đồng TechTonic Club.',
      bullets: activityHighlights.map(
        (a) =>
          `${a.title} (${a.tag}): ${a.summary}${a.goal ? ` — Mục tiêu: ${a.goal}.` : ''}${
            a.audience ? ` Đối tượng: ${a.audience}.` : ''
          }`
      ),
    }),
    [activityHighlights]
  );

  const eventsWingPreview: HoverPreview = useMemo(
    () => ({
      title: 'Chuỗi 6 Sự Kiện Trọng Tâm',
      badge: 'TECHXPLORE • MENTOR-MENTEE • TECHWARE',
      summary: '6 chương trình hoạt động cố định mỗi nhiệm kỳ tại TechTonic Club.',
      bullets: activityHighlights.slice(0, 3).map((a) => `${a.title} (${a.tag})`),
      actionLabel: 'Xem chi tiết 6 sự kiện trọng tâm',
    }),
    [activityHighlights]
  );

  const handleOpenMission = () => openModal('exhibit', MISSION_EXHIBIT);
  const handleOpenEvents = () => openModal('exhibit', eventsWingExhibit);

  return (
    <group position={[0, 0, -18.42]}>
      <RoundedBox
        position={[0, 3.35, -0.05]}
        args={[14.6, 5.5, 0.14]}
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
        <boxGeometry args={[14.4, 0.06, 0.08]} />
        <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.62, 0.04]}>
        <boxGeometry args={[14.4, 0.06, 0.08]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={1.1} toneMapped={false} />
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

      {/* Vision & Mission Graphic Plane centered cleanly inside Dream It - Code It */}
      <mesh
        position={[0, 2.55, 0.06]}
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
        <planeGeometry args={[13.6, 6.6]} />
        <meshStandardMaterial
          map={textTexture}
          transparent
          emissive="#ffffff"
          emissiveMap={textTexture}
          emissiveIntensity={0.42}
          roughness={0.42}
          metalness={0.05}
        />
      </mesh>

      {/* Back-Right Wing: Framed 6 Chương Trình & Sự Kiện CLB cleanly to the right of Dream It - Code It */}
      <group position={[11.75, 3.25, 0.04]}>
        <RoundedBox position={[0, 0, -0.05]} args={[7.0, 4.35, 0.1]} radius={0.04} smoothness={4} castShadow>
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.22} />
        </RoundedBox>
        <mesh position={[0, 2.15, 0.005]}>
          <boxGeometry args={[6.75, 0.024, 0.02]} />
          <meshBasicMaterial color="#c084fc" toneMapped={false} />
        </mesh>
        {[
          [-3.36, 2.04],
          [3.36, 2.04],
          [-3.36, -2.04],
          [3.36, -2.04],
        ].map(([bx, by], i) => (
          <mesh key={`ev-bolt-${i}`} position={[bx, by, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.035, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.18} />
          </mesh>
        ))}
        <mesh
          position={[0, 0, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEvents();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveringInteractive(
              true,
              'Xem Chuỗi 6 Sự kiện trọng tâm',
              handleOpenEvents,
              eventsWingPreview
            );
          }}
          onPointerOut={() => setHoveringInteractive(false)}
        >
          <planeGeometry args={[6.65, 4.02]} />
          <meshStandardMaterial
            map={eventsWingTexture}
            emissive="#ffffff"
            emissiveMap={eventsWingTexture}
            emissiveIntensity={0.34}
            roughness={0.44}
            metalness={0.04}
          />
        </mesh>
      </group>
    </group>
  );
};
