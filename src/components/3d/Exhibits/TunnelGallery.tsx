import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps } from '../utils/proceduralMaterials';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { ExhibitItem, HoverPreview } from '../../../types/heritage';

interface TunnelFrameConfig {
  id: string;
  side: 'left' | 'right';
  z: number;
  kind: 'photo' | 'info';
  title: string;
  subtitle: string;
  tag: string;
  image?: string;
  bullets: string[];
  accent: string;
}

const TUNNEL_ITEMS: TunnelFrameConfig[] = [
  // Left Tunnel Wall (x = -2.35)
  {
    id: 'tunnel-l1',
    side: 'left',
    z: 24.5,
    kind: 'info',
    tag: 'TRẠM 01 • KHỞI NGUỒN',
    title: 'CHÀO MỪNG ĐẾN VỚI TECHTONIC CLUB',
    subtitle: 'Câu lạc bộ học thuật công nghệ trực thuộc Hội Sinh viên Trường ĐH Kinh tế - ĐH Đà Nẵng',
    bullets: [
      'Khẩu hiệu: DREAM IT - CODE IT • Study Hard - Play Harder',
      'Thành lập 01/07/2024 bởi 8 Co-Founders nhiệt huyết',
      '100+ Thành viên • 20+ Dự án công nghệ • 10+ Giải thưởng',
    ],
    accent: '#38bdf8',
  },
  {
    id: 'tunnel-l2',
    side: 'left',
    z: 20.5,
    kind: 'photo',
    tag: 'TRẠM 02 • ĐÀO TẠO THỰC CHIẾN',
    title: 'CHIA SẺ CSLT & CSDL HẰNG TUẦN',
    subtitle: 'Củng cố nền tảng Lập trình & Cơ sở dữ liệu cho sinh viên năm 1–2 DUE',
    image: '/assets/images/tunnel/cslt_1.webp',
    bullets: [
      'Hướng dẫn trực tiếp từ Mentor & anh chị khóa trên',
      'Học đi đôi với thực hành, không thu phí thành viên',
    ],
    accent: '#60a5fa',
  },
  {
    id: 'tunnel-l3',
    side: 'left',
    z: 16.5,
    kind: 'photo',
    tag: 'TRẠM 03 • KẾT NỐI ĐỒNG HÀNH',
    title: 'CHƯƠNG TRÌNH MENTOR - MENTEE',
    subtitle: 'From Us To You — Kết nối thế hệ sinh viên CNTT & MIS',
    image: '/assets/images/tunnel/mentor_mentee_ss1.webp',
    bullets: [
      'Định hướng lộ trình học thuật FE, BE, AI & Data',
      'Gắn kết tình anh em trong học tập lẫn cuộc sống đại học',
    ],
    accent: '#a855f7',
  },
  {
    id: 'tunnel-l4',
    side: 'left',
    z: 12.5,
    kind: 'photo',
    tag: 'TRẠM 04 • CHINH PHỤC HỌC THUẬT',
    title: 'NGHIÊN CỨU KHOA HỌC & OLP - ICPC',
    subtitle: 'Đẩy mạnh tư duy thuật toán, phát triển sản phẩm & công trình sinh viên',
    image: '/assets/images/tunnel/nckh_s1.webp',
    bullets: [
      'Giải Khuyến Khích Olympic Tin học SV VN lần thứ 34',
      'Đội Product Team & sinh hoạt báo cáo tiến độ định kỳ',
    ],
    accent: '#fbbf24',
  },

  // Right Tunnel Wall (x = +2.35)
  {
    id: 'tunnel-r1',
    side: 'right',
    z: 24.5,
    kind: 'photo',
    tag: 'KHÁM PHÁ • TUYỂN THÀNH VIÊN',
    title: 'SỰ KIỆN TECHXPLORE CHÀO TÂN SINH VIÊN',
    subtitle: 'Mở cánh cửa gia nhập TechTonic qua Vòng đơn → Phỏng vấn → Thực tập',
    image: '/assets/images/tunnel/tech_x_plore.webp',
    bullets: [
      'Không yêu cầu biết code trước — chỉ cần tinh thần ham học hỏi',
      'Gặp gỡ trực tiếp BCN và trải nghiệm không gian công nghệ',
    ],
    accent: '#34d399',
  },
  {
    id: 'tunnel-r2',
    side: 'right',
    z: 20.5,
    kind: 'info',
    tag: 'CƠ CẤU • 4 BAN CHỨC NĂNG',
    title: 'HỆ SINH THÁI VẬN HÀNH CHUYÊN NGHIỆP',
    subtitle: 'Ban Chủ Nhiệm điều phối 4 Ban chức năng cùng 45+ thành viên tự do',
    bullets: [
      'Ban Chuyên Môn (7 TV) • Ban Sự Kiện (7 TV)',
      'Ban Truyền Thông (9 TV) • Ban Nhân Sự (3 TV)',
      'Đặt nền tảng bởi 3 Quản lý BCN & cố vấn giảng viên/sinh viên',
    ],
    accent: '#38bdf8',
  },
  {
    id: 'tunnel-r3',
    side: 'right',
    z: 16.5,
    kind: 'photo',
    tag: 'CỘNG ĐỒNG • SẺ CHIA',
    title: 'TECHWARE & TÌNH NGUYỆN ĐÔNG - XUÂN',
    subtitle: 'Trải nghiệm thực tế, thiện nguyện cộng đồng & hành trình trưởng thành',
    image: '/assets/images/tunnel/techware_ss1.webp',
    bullets: [
      'Chuỗi hoạt động cố định mỗi nhiệm kỳ gắn kết thành viên',
      'Kết hợp đối tác doanh nghiệp VTC Academy & MGM Technology',
    ],
    accent: '#f59e0b',
  },
  {
    id: 'tunnel-r4',
    side: 'right',
    z: 12.5,
    kind: 'photo',
    tag: 'NGÔI NHÀ CHUNG • KỈ NIỆM',
    title: 'ĐÊM NHẠC & DU LỊCH GẮN KẾT NỘI BỘ',
    subtitle: 'Study Hard - Play Harder — Mỗi thành viên là một mảnh ghép trân quý',
    image: '/assets/images/tunnel/ntnm1.webp',
    bullets: [
      'Happy Hour hằng tháng cùng tập thể Ban Chủ Nhiệm',
      'Bước qua cổng vòm phía trước để vào Đại Sảnh Danh Dự 3D',
    ],
    accent: '#f472b6',
  },
];

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildInfoPlaqueTexture(item: TunnelFrameConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(1024, 640, 1.75); // exact 1.60 aspect ratio matching 2.24 x 1.40 plane
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 1024, 640);
    grad.addColorStop(0, '#0c1628');
    grad.addColorStop(1, '#13223b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 640);

    ctx.strokeStyle = item.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, 988, 604);

    ctx.fillStyle = item.accent;
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(item.tag, 56, 82);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 40px Inter, sans-serif';
    const tLines = wrapLines(ctx, item.title, 912);
    tLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 56, 146 + i * 50));

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 23px Inter, sans-serif';
    const subStart = 146 + Math.min(2, tLines.length) * 50 + 18;
    const sLines = wrapLines(ctx, item.subtitle, 912);
    sLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 56, subStart + i * 34));

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(56, 336);
    ctx.lineTo(968, 336);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '400 25px Inter, sans-serif';
    let by = 392;
    item.bullets.slice(0, 3).forEach((b) => {
      ctx.fillStyle = item.accent;
      ctx.fillText('▸', 56, by);
      ctx.fillStyle = '#e2e8f0';
      const bLines = wrapLines(ctx, b, 868);
      bLines.slice(0, 2).forEach((l, j) => {
        ctx.fillText(l, 94, by + j * 34);
      });
      by += Math.max(1, bLines.slice(0, 2).length) * 34 + 22;
    });
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

function buildCaptionStripTexture(item: TunnelFrameConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(1024, 148, 2);
  if (ctx) {
    ctx.fillStyle = '#0c1424';
    ctx.fillRect(0, 0, 1024, 148);

    ctx.strokeStyle = item.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 1016, 140);

    ctx.fillStyle = item.accent;
    ctx.font = '700 19px "JetBrains Mono", monospace';
    ctx.fillText(item.tag, 28, 42);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(item.title, 28, 86, 968);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 21px Inter, sans-serif';
    ctx.fillText(item.subtitle, 28, 124, 968);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

const TunnelFrame: React.FC<{
  item: TunnelFrameConfig;
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ item, metalMaps }) => {
  const { openModal, setHoveringInteractive } = useHeritageStore();
  const [photoTex, setPhotoTex] = useState<THREE.CanvasTexture | null>(null);
  const neonTrimRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const picLightRef = useRef<THREE.MeshBasicMaterial>(null);
  const mainMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const capMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const revealLevelRef = useRef(item.z >= 24 ? 0.3 : 0.04);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const playerZ = state.camera.position.z;
    const triggerZ = item.z >= 24 ? 25.35 : item.z + 3.2;
    const trailZ = item.z - 7.0;

    let target = 0.04;
    if (item.z >= 24 && playerZ > triggerZ) {
      target = 0.28;
    } else if (playerZ <= triggerZ && playerZ >= trailZ) {
      target = 1.0;
    } else if (playerZ < trailZ) {
      target = 0.32;
    }

    const speed = target > revealLevelRef.current ? 5.6 : 2.5;
    revealLevelRef.current = THREE.MathUtils.lerp(
      revealLevelRef.current,
      target,
      1 - Math.exp(-speed * dt)
    );
    const lvl = revealLevelRef.current;

    neonTrimRefs.current.forEach((m) => {
      if (m) m.opacity = 0.06 + lvl * 0.94;
    });
    if (picLightRef.current) {
      picLightRef.current.opacity = 0.05 + lvl * 0.95;
    }
    if (mainMatRef.current) {
      mainMatRef.current.emissiveIntensity = 0.03 + lvl * (item.kind === 'photo' ? 0.3 : 0.34);
    }
    if (capMatRef.current) {
      capMatRef.current.emissiveIntensity = 0.03 + lvl * 0.34;
    }
  });

  const infoTex = useMemo(
    () => (item.kind === 'info' ? buildInfoPlaqueTexture(item) : null),
    [item]
  );
  const captionTex = useMemo(() => buildCaptionStripTexture(item), [item]);

  // Draw tunnel photos with aspect-locked object-cover crop onto a 1024x640 (1.60) canvas
  // matching the 2.24 x 1.40 (1.60) plane -> ZERO stretching or image tearing
  useEffect(() => {
    if (item.kind !== 'photo' || !item.image) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const w = 1024;
      const h = 640;
      const { canvas, ctx } = createHiResCanvas(w, h, 1.75);
      if (ctx) {
        const targetRatio = w / h;
        const imgRatio = img.width / img.height;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      }
      setPhotoTex(finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true }));
    };
    img.src = item.image;
    return () => {
      cancelled = true;
    };
  }, [item.kind, item.image]);

  useEffect(() => {
    return () => {
      infoTex?.dispose();
      captionTex.dispose();
      photoTex?.dispose();
    };
  }, [infoTex, captionTex, photoTex]);

  const exhibitData: ExhibitItem = useMemo(
    () => ({
      id: item.id,
      title: item.title,
      category: 'activity',
      year: 'TechTonic Club',
      image: item.image,
      highlight: item.tag,
      description: item.subtitle,
      bullets: item.bullets,
    }),
    [item]
  );

  const previewData: HoverPreview = useMemo(
    () => ({
      title: item.title,
      badge: item.tag,
      summary: item.subtitle,
      bullets: item.bullets,
      actionLabel: 'Xem chi tiết tư liệu hành lang',
    }),
    [item]
  );

  const x = item.side === 'left' ? -2.35 : 2.35;
  const rotY = item.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  const handleOpen = () => openModal('exhibit', exhibitData);

  // Lowered to eye level (y = 2.08) so frames read directly while walking down the tunnel
  return (
    <group position={[x, 2.08, item.z]} rotation={[0, rotY, 0]}>
      <RoundedBox
        position={[0, 0, -0.04]}
        args={[2.42, item.kind === 'photo' ? 1.84 : 1.56, 0.08]}
        radius={0.03}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial
          color="#26344d"
          roughnessMap={metalMaps.roughnessMap}
          bumpMap={metalMaps.bumpMap}
          bumpScale={0.004}
          metalness={0.85}
          roughness={0.24}
        />
      </RoundedBox>

      {/* Neon side accent edge trim (ignites on superstar approach) */}
      {[-1.22, 1.22].map((nx, trimIdx) => (
        <mesh key={`frame-neon-${nx}`} position={[nx, 0, 0]}>
          <boxGeometry args={[0.018, item.kind === 'photo' ? 1.72 : 1.44, 0.025]} />
          <meshBasicMaterial
            ref={(el) => {
              neonTrimRefs.current[trimIdx] = el;
            }}
            color={item.accent}
            transparent
            opacity={0.08}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Picture light bar above frame */}
      <group position={[0, item.kind === 'photo' ? 0.99 : 0.85, 0.16]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.35, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.018, 0]}>
          <boxGeometry args={[1.25, 0.008, 0.02]} />
          <meshBasicMaterial
            ref={picLightRef}
            color={item.accent}
            transparent
            opacity={0.08}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Aspect-locked 2.24 x 1.40 (1.60) main graphic / photo plane */}
      <mesh
        position={[0, item.kind === 'photo' ? 0.14 : 0, 0.01]}
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveringInteractive(true, `Xem: ${item.title}`, handleOpen, previewData);
        }}
        onPointerOut={() => setHoveringInteractive(false)}
      >
        <planeGeometry args={[2.24, 1.4]} />
        {item.kind === 'photo' && photoTex ? (
          <meshStandardMaterial
            ref={mainMatRef}
            map={photoTex}
            emissive="#ffffff"
            emissiveMap={photoTex}
            emissiveIntensity={0.04}
            roughness={0.38}
            metalness={0.05}
          />
        ) : (
          <meshStandardMaterial
            ref={mainMatRef}
            map={infoTex ?? captionTex}
            emissive="#ffffff"
            emissiveMap={infoTex ?? captionTex}
            emissiveIntensity={0.04}
            roughness={0.42}
            metalness={0.04}
          />
        )}
      </mesh>

      {/* Caption strip cleanly below photo */}
      {item.kind === 'photo' && (
        <mesh
          position={[0, -0.71, 0.012]}
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
        >
          <planeGeometry args={[2.24, 0.32]} />
          <meshStandardMaterial
            ref={capMatRef}
            map={captionTex}
            emissive="#ffffff"
            emissiveMap={captionTex}
            emissiveIntensity={0.04}
            roughness={0.42}
            metalness={0.04}
          />
        </mesh>
      )}
    </group>
  );
};

export const TunnelGallery: React.FC = () => {
  const metalMaps = useMemo(() => createBrushedMetalMaps(), []);

  useEffect(() => {
    return () => {
      metalMaps.roughnessMap.dispose();
      metalMaps.bumpMap.dispose();
    };
  }, [metalMaps]);

  return (
    <group>
      {TUNNEL_ITEMS.map((item) => (
        <TunnelFrame key={item.id} item={item} metalMaps={metalMaps} />
      ))}
    </group>
  );
};
