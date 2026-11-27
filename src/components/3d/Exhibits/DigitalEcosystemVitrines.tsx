import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps, createMarbleMaps } from '../utils/proceduralMaterials';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { ExhibitItem, HoverPreview } from '../../../types/heritage';

type VitrineKind = 'website' | 'facebook' | 'drive' | 'puzzle';

interface DigitalVitrineConfig {
  id: string;
  kind: VitrineKind;
  position: [number, number, number];
  rotationY: number;
  badge: string;
  title: string;
  shortUrl: string;
  url: string;
  linkLabel: string;
  accent: string;
  secondaryAccent: string;
  description: string;
  bullets: string[];
  screenTitle: string;
  screenSubtitle: string;
}

/**
 * 4 interactive cyber-museum glass vitrines placed at organic, spacious discovery spots
 * across the Main Hall (100% clear of Central Island, benches, guestbook, Club Shirt, and perimeter pedestals).
 */
const DIGITAL_VITRINES: DigitalVitrineConfig[] = [
  {
    id: 'vitrine-website-techtonic',
    kind: 'website',
    position: [-8.8, 0, -8.6],
    rotationY: 0.58,
    badge: 'WEBSITE CHÍNH THỨC',
    title: 'Cổng Thông Tin TechTonic Club',
    shortUrl: 'techtonic-club.id.vn',
    url: 'https://www.techtonic-club.id.vn',
    linkLabel: 'Truy cập Website TechTonic (techtonic-club.id.vn)',
    accent: '#00F5FF',
    secondaryAccent: '#38bdf8',
    description:
      'Trang web chính thức của CLB Học thuật Công nghệ TechTonic (DUE) — nơi giới thiệu sứ mệnh, lộ trình đào tạo chuyên môn, các sự kiện nổi bật, dự án sinh viên và thông tin tuyển thành viên.',
    bullets: [
      'Tổng hợp đầy đủ thông tin về CLB, Cơ cấu 4 Ban & Ban Chủ Nhiệm các nhiệm kỳ',
      'Cập nhật lịch sinh hoạt chuyên môn FE / BE / AI & Data và sự kiện TechXplore, TechWare',
      'Kênh đăng ký tham gia CLB & kết nối đối tác doanh nghiệp công nghệ',
    ],
    screenTitle: 'DREAM IT • CODE IT',
    screenSubtitle: 'techtonic-club.id.vn',
  },
  {
    id: 'vitrine-facebook-techtonic',
    kind: 'facebook',
    position: [9.4, 0, -2.2],
    rotationY: -0.72,
    badge: 'CỘNG ĐỒNG FACEBOOK',
    title: 'Fanpage & Cộng Đồng TechTonic',
    shortUrl: 'fb.com/TechTonic.Club17',
    url: 'https://www.facebook.com/TechTonic.Club17',
    linkLabel: 'Mở Facebook TechTonic Club',
    accent: '#3b82f6',
    secondaryAccent: '#60a5fa',
    description:
      'Kênh truyền thông sôi động nhất của TechTonic Club trên Facebook — cập nhật nhanh chóng tin tức sự kiện, album ảnh hoạt động, thành tích sinh viên và các minigame tương tác hằng tuần.',
    bullets: [
      'Cập nhật trực tiếp lịch workshop, chia sẻ CSLT/CSDL và chương trình Mentor - Mentee',
      'Lưu giữ khoảnh khắc sự kiện TechWare, TechXplore và thiện nguyện Đông - Xuân',
      'Kết nối nhanh với Ban Truyền Thông & cộng đồng sinh viên yêu CNTT tại DUE',
    ],
    screenTitle: 'TECHTONIC CLUB',
    screenSubtitle: 'fb.com/TechTonic.Club17',
  },
  {
    id: 'vitrine-drive-archive',
    kind: 'drive',
    position: [8.2, 0, -12.4],
    rotationY: -0.45,
    badge: 'KHO TÀI LIỆU HỌC THUẬT',
    title: 'Thư Viện Tài Liệu Google Drive',
    shortUrl: 'drive.google.com • Archive',
    url: 'https://drive.google.com/drive/folders/13ts2b1hP9-AUOuKNxFhrkZqW5-2zHO8m',
    linkLabel: 'Mở Thư Mục Tài Liệu Google Drive',
    accent: '#34d399',
    secondaryAccent: '#fbbf24',
    description:
      'Kho lưu trữ tài liệu học thuật mở của TechTonic Club trên Google Drive — tổng hợp slide bài giảng, tài liệu ôn tập CSLT/CSDL, bài tập thực hành và nguồn học liệu quý giá cho sinh viên.',
    bullets: [
      'Tài liệu tự học & slide chuyên đề Front-End, Back-End, AI & Data do Mentor biên soạn',
      'Ngân hàng bài tập thực hành CSLT, CSDL và tài liệu định hướng thi đấu OLP - ICPC',
      'Chia sẻ miễn phí, sắp xếp khoa học để sinh viên DUE dễ dàng tra cứu mọi lúc',
    ],
    screenTitle: 'KHO TÀI LIỆU',
    screenSubtitle: 'Google Drive • Open Archive',
  },
  {
    id: 'vitrine-minigame-puzzle',
    kind: 'puzzle',
    position: [-9.6, 0, 1.4],
    rotationY: 0.78,
    badge: 'MINIGAME TƯƠNG TÁC',
    title: 'Minigame Live Puzzle TechTonic',
    shortUrl: 'live-puzzle • Vercel App',
    url: 'https://van-truong-due-mini-game-live-puzzl.vercel.app/',
    linkLabel: 'Chơi ngay Minigame Live Puzzle',
    accent: '#d946ef',
    secondaryAccent: '#00F5FF',
    description:
      'Trò chơi giải đố xếp hình trực tuyến (Live Puzzle) do thành viên TechTonic phát triển — thử thách tốc độ, tư duy hình ảnh và tinh thần Study Hard - Play Harder ngay trên trình duyệt.',
    bullets: [
      'Chơi trực tiếp trên web mượt mà, không cần cài đặt phần mềm',
      'Thử thách ghép tranh nhanh với giao diện tương tác trực quan, vui nhộn',
      'Sản phẩm sáng tạo thực tế thể hiện năng lực lập trình web của sinh viên TechTonic',
    ],
    screenTitle: 'LIVE PUZZLE',
    screenSubtitle: 'Nhấn để chơi ngay!',
  },
];

function createVitrinePlaqueTexture(cfg: DigitalVitrineConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(560, 260, 1.5);
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 560, 260);
    bg.addColorStop(0, '#050b18');
    bg.addColorStop(0.5, '#0a1428');
    bg.addColorStop(1, '#040914');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 560, 260);

    ctx.strokeStyle = cfg.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 548, 248);

    ctx.fillStyle = cfg.accent;
    ctx.fillRect(6, 6, 548, 8);

    // Category pill
    ctx.fillStyle = `${cfg.accent}24`;
    ctx.fillRect(28, 30, 504, 34);
    ctx.fillStyle = cfg.accent;
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.badge, 280, 53);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(cfg.title, 280, 114, 510);

    // Short URL
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 19px "JetBrains Mono", monospace';
    ctx.fillText(cfg.shortUrl, 280, 156, 510);

    // Divider
    ctx.fillStyle = `${cfg.accent}55`;
    ctx.fillRect(60, 182, 440, 2);

    // Action CTA
    ctx.fillStyle = cfg.accent;
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillText('NHẤP HOẶC [E] ĐỂ MỞ & TRẢI NGHIỆM →', 280, 224);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

function createArtifactScreenTexture(cfg: DigitalVitrineConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(384, 240, 1.5);
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 384, 240);
    bg.addColorStop(0, '#040916');
    bg.addColorStop(1, '#0b1933');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 384, 240);

    // Subtle glow center
    const rad = ctx.createRadialGradient(192, 120, 10, 192, 120, 175);
    rad.addColorStop(0, `${cfg.accent}44`);
    rad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 384, 240);

    // Top browser/app bar
    ctx.fillStyle = '#0f1d38';
    ctx.fillRect(0, 0, 384, 34);
    ['#f43f5e', '#fbbf24', '#34d399'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(20 + i * 16, 17, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = cfg.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 376, 232);

    // Center stylized badge symbol
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.accent;
    ctx.font = '800 54px Inter, sans-serif';
    const iconGlyph =
      cfg.kind === 'website'
        ? '</>'
        : cfg.kind === 'facebook'
        ? 'f'
        : cfg.kind === 'drive'
        ? '▲'
        : '❖';
    ctx.fillText(iconGlyph, 192, 118);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText(cfg.screenTitle, 192, 166, 340);

    ctx.fillStyle = cfg.secondaryAccent;
    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillText(cfg.screenSubtitle, 192, 202, 340);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

const PUZZLE_OFFSETS: Array<[number, number, number, string]> = [
  [-0.11, 0.11, 0.11, '#d946ef'],
  [0.11, 0.11, 0.11, '#00F5FF'],
  [-0.11, -0.11, 0.11, '#38bdf8'],
  [0.11, -0.11, 0.11, '#fbbf24'],
  [-0.11, 0.11, -0.11, '#34d399'],
  [0.11, 0.11, -0.11, '#f472b6'],
  [-0.11, -0.11, -0.11, '#a855f7'],
  [0.11, -0.11, -0.11, '#00F5FF'],
];

const SculptedVitrineArtifact: React.FC<{
  cfg: DigitalVitrineConfig;
  screenTex: THREE.CanvasTexture;
  hovered: boolean;
  phase: number;
}> = ({ cfg, screenTex, hovered, phase }) => {
  const rootRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const puzzleRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame((state, delta) => {
    const storeState = useHeritageStore.getState();
    if (
      storeState.isCenterWallCinemaActive ||
      storeState.activeModal !== null ||
      state.camera.position.z > 12
    ) {
      return;
    }
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (rootRef.current) {
      rootRef.current.position.y = 1.62 + Math.sin(t * 1.6 + phase) * 0.055;
      rootRef.current.rotation.y += dt * (hovered ? 0.85 : 0.42);
      const targetScale = hovered ? 1.09 : 1.0;
      const nextScale = THREE.MathUtils.lerp(
        rootRef.current.scale.x,
        targetScale,
        1 - Math.exp(-7 * dt)
      );
      rootRef.current.scale.setScalar(nextScale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.7 + phase;
    }
    if (cfg.kind === 'puzzle') {
      const expand = 1.0 + (Math.sin(t * 2.1 + phase) * 0.5 + 0.5) * (hovered ? 0.28 : 0.14);
      for (let i = 0; i < PUZZLE_OFFSETS.length; i += 1) {
        const cube = puzzleRefs.current[i];
        if (!cube) continue;
        const [ox, oy, oz] = PUZZLE_OFFSETS[i];
        cube.position.set(ox * expand, oy * expand, oz * expand);
      }
    }
  });

  if (cfg.kind === 'website') {
    return (
      <group ref={rootRef} position={[0, 1.62, 0]}>
        {/* Floating Holographic Browser Tablet / Portal */}
        <RoundedBox args={[0.58, 0.38, 0.032]} radius={0.014} smoothness={2}>
          <meshStandardMaterial color="#0b1528" metalness={0.86} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.019]}>
          <planeGeometry args={[0.53, 0.33]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
        <mesh position={[0, 0, -0.019]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.53, 0.33]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI / 2.6, 0.3, 0]}>
          <torusGeometry args={[0.37, 0.01, 10, 42]} />
          <meshBasicMaterial color={cfg.accent} toneMapped={false} />
        </mesh>
      </group>
    );
  }

  if (cfg.kind === 'facebook') {
    return (
      <group ref={rootRef} position={[0, 1.62, 0]}>
        {/* Sculpted Floating Cobalt Social Badge Prism */}
        <RoundedBox args={[0.46, 0.46, 0.08]} radius={0.05} smoothness={2}>
          <meshStandardMaterial
            color="#1d4ed8"
            emissive="#2563eb"
            emissiveIntensity={0.45}
            metalness={0.55}
            roughness={0.22}
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.044]}>
          <planeGeometry args={[0.4, 0.38]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
        <mesh position={[0, 0, -0.044]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.4, 0.38]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
        {/* Twin Social Broadcast Halo Rings */}
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0.4, 0]}>
          <torusGeometry args={[0.36, 0.01, 10, 40]} />
          <meshBasicMaterial color="#60a5fa" toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 3, -0.4, 0]}>
          <torusGeometry args={[0.39, 0.008, 10, 40]} />
          <meshBasicMaterial color="#00F5FF" toneMapped={false} />
        </mesh>
      </group>
    );
  }

  if (cfg.kind === 'drive') {
    return (
      <group ref={rootRef} position={[0, 1.62, 0]}>
        {/* Sculpted 3D Holographic Archive Folder with Glowing Data Sheets */}
        {/* Back folder plate + protruding tab */}
        <RoundedBox position={[0, -0.02, -0.055]} args={[0.52, 0.36, 0.024]} radius={0.012} smoothness={2}>
          <meshStandardMaterial color="#0f766e" metalness={0.72} roughness={0.24} />
        </RoundedBox>
        <RoundedBox position={[-0.14, 0.18, -0.055]} args={[0.22, 0.08, 0.024]} radius={0.01} smoothness={2}>
          <meshStandardMaterial color="#10b981" emissive="#34d399" emissiveIntensity={0.35} metalness={0.6} roughness={0.25} />
        </RoundedBox>
        {/* 3 Glowing Layered Document Cards peeking out */}
        <mesh position={[0, 0.06, -0.02]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[0.42, 0.3, 0.012]} />
          <meshBasicMaterial color="#fbbf24" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.03, 0.005]} rotation={[0, 0, -0.03]}>
          <boxGeometry args={[0.44, 0.3, 0.012]} />
          <meshBasicMaterial color="#00F5FF" toneMapped={false} />
        </mesh>
        {/* Front folder flap with screen display */}
        <RoundedBox position={[0, -0.04, 0.045]} rotation={[-0.12, 0, 0]} args={[0.54, 0.34, 0.026]} radius={0.014} smoothness={2}>
          <meshStandardMaterial color="#0d2238" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, -0.04, 0.061]} rotation={[-0.12, 0, 0]}>
          <planeGeometry args={[0.48, 0.29]} />
          <meshBasicMaterial map={screenTex} />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.24, 0]}>
          <torusGeometry args={[0.32, 0.01, 10, 36]} />
          <meshBasicMaterial color="#34d399" toneMapped={false} />
        </mesh>
      </group>
    );
  }

  // Minigame Puzzle: Animated 2x2x2 Interlocking Cyber Puzzle Cube Cluster
  return (
    <group ref={rootRef} position={[0, 1.62, 0]} rotation={[0.35, 0.4, 0.2]}>
      {PUZZLE_OFFSETS.map(([ox, oy, oz, col], idx) => (
        <mesh
          key={`puzzle-cube-${idx}`}
          ref={(el) => {
            puzzleRefs.current[idx] = el;
          }}
          position={[ox, oy, oz]}
        >
          <boxGeometry args={[0.175, 0.175, 0.175]} />
          <meshStandardMaterial
            color="#0e172a"
            emissive={col}
            emissiveIntensity={hovered ? 0.92 : 0.62}
            metalness={0.55}
            roughness={0.22}
          />
        </mesh>
      ))}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[0.37, 0.01, 10, 40]} />
        <meshBasicMaterial color={cfg.accent} toneMapped={false} />
      </mesh>
    </group>
  );
};

const DigitalVitrineStand: React.FC<{
  cfg: DigitalVitrineConfig;
  index: number;
  marbleMaps: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ cfg, index, marbleMaps, metalMaps }) => {
  const { openModal, setHoveringInteractive } = useHeritageStore(
    useShallow((s) => ({
      openModal: s.openModal,
      setHoveringInteractive: s.setHoveringInteractive,
    }))
  );
  const [hovered, setHovered] = useState(false);

  const plaqueTex = useMemo(() => createVitrinePlaqueTexture(cfg), [cfg]);
  const screenTex = useMemo(() => createArtifactScreenTexture(cfg), [cfg]);

  useEffect(() => {
    return () => {
      plaqueTex.dispose();
      screenTex.dispose();
    };
  }, [plaqueTex, screenTex]);

  const exhibitData: ExhibitItem = useMemo(
    () => ({
      id: cfg.id,
      title: cfg.title,
      category: 'activity',
      year: 'Hệ Sinh Thái Số TechTonic',
      highlight: cfg.badge,
      description: cfg.description,
      bullets: cfg.bullets,
      links: [{ label: cfg.linkLabel, url: cfg.url }],
    }),
    [cfg]
  );

  const previewData: HoverPreview = useMemo(
    () => ({
      title: cfg.title,
      badge: cfg.badge,
      summary: cfg.description,
      bullets: [cfg.shortUrl, ...cfg.bullets.slice(0, 2)],
      actionLabel: `Mở chi tiết & truy cập ${cfg.shortUrl}`,
    }),
    [cfg]
  );

  const handleOpen = () => openModal('exhibit', exhibitData);

  return (
    <group position={cfg.position} rotation={[0, cfg.rotationY, 0]}>
      {/* Solid Obsidian Museum Vitrine Base with Explicit Fast Collider */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.5, 0]}>
        <CuboidCollider args={[0.52, 1.12, 0.52]} position={[0, 0.62, 0]} />

        {/* Floor luminous neon base halo ring */}
        <mesh position={[0, -0.492, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.64, 0.72, 36]} />
          <meshBasicMaterial
            color={cfg.accent}
            transparent
            opacity={hovered ? 0.85 : 0.45}
            toneMapped={false}
          />
        </mesh>

        {/* Heavy Brushed Titanium Footing */}
        <RoundedBox position={[0, -0.45, 0]} args={[1.08, 0.1, 1.08]} radius={0.02} smoothness={2} receiveShadow>
          <meshStandardMaterial
            color="#0a1222"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.88}
            roughness={0.22}
          />
        </RoundedBox>

        {/* Obsidian Marble Pedestal Core */}
        <RoundedBox position={[0, 0.02, 0]} args={[0.94, 0.88, 0.94]} radius={0.028} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#111d34"
            roughness={0.26}
            metalness={0.44}
          />
        </RoundedBox>

        {/* Top Pedestal Rim + Glowing Neon Collar */}
        <RoundedBox position={[0, 0.48, 0]} args={[1.0, 0.06, 1.0]} radius={0.016} smoothness={2}>
          <meshStandardMaterial color="#122038" metalness={0.9} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0.445, 0]}>
          <boxGeometry args={[0.96, 0.02, 0.96]} />
          <meshBasicMaterial color={cfg.accent} toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Interactive Glass Vitrine Enclosure (y = 1.02 .. 2.24m) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveringInteractive(true, `Khám phá: ${cfg.title}`, handleOpen, previewData);
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveringInteractive(false);
        }}
      >
        {/* Inner glowing display stage disc under the levitating relic */}
        <mesh position={[0, 1.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.34, 36]} />
          <meshBasicMaterial color={cfg.accent} transparent opacity={0.72} toneMapped={false} />
        </mesh>

        {/* 4 Ultra-Slim Brushed Titanium Vitrine Corner Posts */}
        {[
          [-0.44, -0.44],
          [0.44, -0.44],
          [-0.44, 0.44],
          [0.44, 0.44],
        ].map(([cx, cz], i) => (
          <mesh key={`post-${i}`} position={[cx, 1.62, cz]}>
            <boxGeometry args={[0.024, 1.2, 0.024]} />
            <meshStandardMaterial color="#1e2d48" metalness={0.92} roughness={0.18} />
          </mesh>
        ))}

        {/* Top Vitrine Canopy Cap + Glowing Inner Neon Ceiling Ring */}
        <RoundedBox position={[0, 2.24, 0]} args={[0.94, 0.07, 0.94]} radius={0.018} smoothness={2}>
          <meshStandardMaterial color="#0e182c" metalness={0.9} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 2.202, 0]}>
          <boxGeometry args={[0.88, 0.016, 0.88]} />
          <meshBasicMaterial color={cfg.accent} toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.195, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 32]} />
          <meshBasicMaterial color={cfg.accent} toneMapped={false} />
        </mesh>

        {/* Crystal-Clear Museum Glass Case */}
        <mesh position={[0, 1.62, 0]}>
          <boxGeometry args={[0.88, 1.16, 0.88]} />
          <meshPhysicalMaterial
            color="#a5d8ff"
            transparent
            opacity={hovered ? 0.19 : 0.12}
            roughness={0.06}
            metalness={0.14}
            clearcoat={0.95}
            clearcoatRoughness={0.05}
            depthWrite={false}
          />
        </mesh>

        {/* Sculpted Levitating 3D Digital Artifact inside the Glass Vitrine */}
        <SculptedVitrineArtifact
          cfg={cfg}
          screenTex={screenTex}
          hovered={hovered}
          phase={index * 1.6}
        />

        {/* Front Angled Anti-Glare OLED Info Plaque */}
        <group position={[0, 0.68, 0.51]} rotation={[-0.22, 0, 0]}>
          <RoundedBox args={[0.78, 0.37, 0.028]} radius={0.012} smoothness={2}>
            <meshStandardMaterial
              color="#142038"
              metalness={0.88}
              roughness={0.22}
              emissive={cfg.accent}
              emissiveIntensity={hovered ? 0.35 : 0.1}
            />
          </RoundedBox>
          <mesh position={[0, 0, 0.016]}>
            <planeGeometry args={[0.73, 0.335]} />
            <meshBasicMaterial map={plaqueTex} color={hovered ? '#ffffff' : '#dce8f8'} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export const DigitalEcosystemVitrines: React.FC = () => {
  const marbleMaps = useMemo(() => createMarbleMaps(), []);
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);

  useEffect(() => {
    return () => {
      marbleMaps.map.dispose();
      marbleMaps.roughnessMap.dispose();
      marbleMaps.bumpMap.dispose();
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
    };
  }, [marbleMaps, metalMaps]);

  return (
    <group name="digital-ecosystem-vitrines">
      {DIGITAL_VITRINES.map((cfg, idx) => (
        <DigitalVitrineStand
          key={cfg.id}
          cfg={cfg}
          index={idx}
          marbleMaps={marbleMaps}
          metalMaps={metalMaps}
        />
      ))}
    </group>
  );
};
