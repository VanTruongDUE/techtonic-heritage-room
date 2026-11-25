import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { createBrushedMetalMaps, createMarbleMaps } from '../utils/proceduralMaterials';
import { createHiResCanvas, finalizeCrispTexture } from '../utils/textureUtils';
import type { ExhibitItem, HoverPreview } from '../../../types/heritage';

interface PhotoPedestalConfig {
  id: string;
  position: [number, number, number];
  rotationY: number;
  title: string;
  tag: string;
  description: string;
  image: string;
  accent: string;
}

// 12 compact low-profile museum photo plinths positioned strictly in wall seam gaps & symmetric open promenade aisles
// (top edge at y ≈ 1.08m so zero wall boards or department portrait trees behind them are ever obscured)
const PHOTO_PEDESTALS: PhotoPedestalConfig[] = [
  {
    id: 'pedestal-nckh',
    position: [-7.78, 0, -17.65],
    rotationY: 0,
    tag: 'NGHIÊN CỨU • PRODUCT TEAM',
    title: 'Nghiên Cứu Khoa Học & Dự Án',
    description:
      'Thành viên TechTonic tham gia nghiên cứu khoa học sinh viên, thuyết trình giải pháp phần mềm và phát triển sản phẩm thực tế.',
    image: '/assets/images/tunnel/nckh_s1.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-olp',
    position: [7.78, 0, -17.65],
    rotationY: 0,
    tag: 'THÀNH TÍCH • ĐẤU TRƯỜNG',
    title: 'Olympic Tin Học SV & ICPC',
    description:
      'Đội tuyển thuật toán TechTonic Club đạt Giải Khuyến Khích Olympic Tin học Sinh viên Việt Nam lần thứ 34 (2025).',
    image: '/assets/images/activity/olp_icpc.webp',
    accent: '#fbbf24',
  },
  {
    id: 'pedestal-cslt',
    position: [-15.35, 0, -12.25],
    rotationY: Math.PI / 2,
    tag: 'CHUYÊN MÔN • HỌC THUẬT',
    title: 'Đào Tạo CSLT & CSDL Hằng Tuần',
    description:
      'Các buổi chia sẻ thực chiến môn Cơ sở Lập trình & Cơ sở Dữ liệu miễn phí dành cho sinh viên năm nhất và năm hai DUE.',
    image: '/assets/images/gallery/CSLT7_1.webp',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-mentor',
    position: [-15.35, 0, 0.05],
    rotationY: Math.PI / 2,
    tag: 'ĐỒNG HÀNH • KẾT NỐI',
    title: 'Chương Trình Mentor - Mentee',
    description:
      'From Us To You — kết nối anh chị khóa trên định hướng lộ trình Front-End, Back-End, AI & Data và kỹ năng nghề nghiệp.',
    image: '/assets/images/gallery/mm2.webp',
    accent: '#00F0FF',
  },
  {
    id: 'pedestal-shirt-side',
    position: [15.35, 0, -8.3],
    rotationY: -Math.PI / 2,
    tag: 'HỌC THUẬT • GẮN KẾT',
    title: 'Sinh Hoạt Mentor & Chuyên Đề',
    description:
      'Không khí trao đổi học thuật cởi mở giữa Mentor và thành viên mới trong các buổi sinh hoạt định kỳ.',
    image: '/assets/images/activity/mentor_mentee.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-techware',
    position: [15.35, 0, 0.0],
    rotationY: -Math.PI / 2,
    tag: 'THỰC HÀNH • WORKSHOP',
    title: 'Sự Kiện & Workshop TechWare',
    description:
      'Không gian trải nghiệm phần mềm, giao lưu diễn giả công nghệ và thực hành triển khai dự án cùng doanh nghiệp đồng hành.',
    image: '/assets/images/activity/techware.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-techxplore',
    position: [-8.6, 0, 7.1],
    rotationY: Math.PI,
    tag: 'TUYỂN THÀNH VIÊN',
    title: 'TechXplore Chào Tân Sinh Viên',
    description:
      'Sự kiện thường niên đón tân sinh viên DUE khám phá thế giới CNTT và gia nhập đại gia đình TechTonic Club.',
    image: '/assets/images/gallery/tx2.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-ntnm',
    position: [-2.95, 0, 7.1],
    rotationY: Math.PI,
    tag: 'GẮN KẾT • VĂN HÓA CLB',
    title: 'Đêm Nhạc & Du Lịch Gắn Kết',
    description:
      'Study Hard - Play Harder — khoảnh khắc âm nhạc, thiện nguyện và du lịch nội bộ lưu giữ thanh xuân cùng TechTonic.',
    image: '/assets/images/gallery/ntnm2.webp',
    accent: '#f472b6',
  },
  {
    id: 'pedestal-promenade-nw',
    position: [-6.7, 0, -9.8],
    rotationY: Math.PI / 4,
    tag: 'TRẢI NGHIỆM • TECHWARE',
    title: 'Không Gian Cộng Đồng TechWare',
    description:
      'Chuỗi hoạt động kết nối sinh viên với sản phẩm công nghệ thực tế và chia sẻ kinh nghiệm từ các anh chị.',
    image: '/assets/images/gallery/tw3.webp',
    accent: '#a855f7',
  },
  {
    id: 'pedestal-promenade-ne',
    position: [6.7, 0, -9.8],
    rotationY: -Math.PI / 4,
    tag: 'KHÁM PHÁ • TECHXPLORE',
    title: 'Hành Trình Khám Phá TechXplore',
    description:
      'Các trạm thử thách tư duy và định hướng chuyên môn dành cho sinh viên tham gia tuyển thành viên TechTonic.',
    image: '/assets/images/gallery/tx3.webp',
    accent: '#00F0FF',
  },
  {
    id: 'pedestal-promenade-w',
    position: [-7.3, 0, -2.5],
    rotationY: Math.PI / 2,
    tag: 'KỶ NIỆM • MENTOR-MENTEE',
    title: 'Khoảnh Khắc Mentor - Mentee',
    description:
      'Những buổi gặp gỡ, sẻ chia học tập và đồng hành phát triển kỹ năng giữa các thế hệ thành viên TechTonic.',
    image: '/assets/images/gallery/mm9.webp',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-promenade-e',
    position: [7.3, 0, -2.5],
    rotationY: -Math.PI / 2,
    tag: 'THỰC HÀNH • LẬP TRÌNH',
    title: 'Thực Hành Chia Sẻ CSLT',
    description:
      'Giờ học nhóm trực tiếp giải bài tập thuật toán, cấu trúc dữ liệu và hướng dẫn thực hành trên lớp.',
    image: '/assets/images/gallery/CSLT3_1.webp',
    accent: '#38bdf8',
  },
];

function createPedestalCaptionTexture(item: PhotoPedestalConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(512, 128, 2);
  if (ctx) {
    ctx.fillStyle = '#0c1526';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = item.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.fillStyle = item.accent;
    ctx.font = '700 17px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.tag, 256, 36, 476);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(item.title, 256, 78, 476);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillText('Nhấp hoặc nhấn [E] để phóng to ảnh', 256, 108, 476);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 16, srgb: true });
}

const PhotoPedestalStand: React.FC<{
  item: PhotoPedestalConfig;
  marbleMaps: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ item, marbleMaps, metalMaps }) => {
  const { openModal, setHoveringInteractive } = useHeritageStore();
  const [hovered, setHovered] = useState(false);
  const [photoTex, setPhotoTex] = useState<THREE.CanvasTexture | null>(null);

  const captionTex = useMemo(() => createPedestalCaptionTexture(item), [item]);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const w = 800;
      const h = 500;
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
  }, [item.image]);

  useEffect(() => {
    return () => {
      captionTex.dispose();
      photoTex?.dispose();
    };
  }, [captionTex, photoTex]);

  const exhibitData: ExhibitItem = useMemo(
    () => ({
      id: item.id,
      title: item.title,
      category: 'activity',
      year: 'TechTonic Archive',
      image: item.image,
      highlight: item.tag,
      description: item.description,
    }),
    [item]
  );

  const previewData: HoverPreview = useMemo(
    () => ({
      title: item.title,
      badge: item.tag,
      summary: item.description,
      actionLabel: 'Xem ảnh tư liệu cỡ lớn',
    }),
    [item]
  );

  const handleOpen = () => openModal('exhibit', exhibitData);

  return (
    <group position={item.position} rotation={[0, item.rotationY, 0]}>
      {/* Low-profile Marble & Brushed Metal Gallery Plinth (top height ~0.62m) */}
      <RigidBody type="fixed" position={[0, 0.31, 0]}>
        <RoundedBox position={[0, -0.27, 0]} args={[0.9, 0.08, 0.58]} radius={0.02} smoothness={4} receiveShadow>
          <meshStandardMaterial
            color="#334155"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.86}
            roughness={0.24}
          />
        </RoundedBox>
        <RoundedBox args={[0.78, 0.54, 0.46]} radius={0.028} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#cad8ee"
            roughness={0.34}
            metalness={0.28}
          />
        </RoundedBox>
        {/* Top metal collar + neon trim line */}
        <RoundedBox position={[0, 0.285, 0]} args={[0.84, 0.036, 0.52]} radius={0.012} smoothness={4}>
          <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.22} />
        </RoundedBox>
        <mesh position={[0, 0.255, 0]}>
          <boxGeometry args={[0.8, 0.014, 0.48]} />
          <meshBasicMaterial color={item.accent} toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Low Slanted Museum Easel Frame (y = 0.85, top edge <= 1.08m -> never blocks boards behind!) */}
      <group
        position={[0, 0.85, 0.02]}
        rotation={[-0.58, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveringInteractive(true, `Xem ảnh: ${item.title}`, handleOpen, previewData);
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveringInteractive(false);
        }}
      >
        <mesh position={[0, -0.19, -0.05]}>
          <cylinderGeometry args={[0.04, 0.05, 0.16, 20]} />
          <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.22} />
        </mesh>

        <RoundedBox args={[0.84, 0.54, 0.04]} radius={0.016} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#1e293b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.84}
            roughness={0.24}
            emissive={item.accent}
            emissiveIntensity={hovered ? 0.36 : 0.1}
          />
        </RoundedBox>

        {/* Top miniature picture lamp bar */}
        <group position={[0, 0.295, 0.07]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.42, 14]} />
            <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.011, 0]}>
            <boxGeometry args={[0.38, 0.008, 0.012]} />
            <meshBasicMaterial color={item.accent} toneMapped={false} />
          </mesh>
        </group>

        {/* 16:10 Crisp Photograph */}
        <mesh position={[0, 0, 0.023]}>
          <planeGeometry args={[0.76, 0.475]} />
          {photoTex ? (
            <meshStandardMaterial
              map={photoTex}
              emissive="#ffffff"
              emissiveMap={photoTex}
              emissiveIntensity={hovered ? 0.44 : 0.32}
              roughness={0.78}
              metalness={0}
            />
          ) : (
            <meshStandardMaterial color="#13223b" roughness={0.8} />
          )}
        </mesh>
      </group>

      {/* Front Engraved Caption Plaque on Plinth */}
      <group position={[0, 0.45, 0.24]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[0.64, 0.175, 0.022]} radius={0.008} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[0.6, 0.15]} />
          <meshStandardMaterial
            map={captionTex}
            emissive="#ffffff"
            emissiveMap={captionTex}
            emissiveIntensity={0.36}
            roughness={0.75}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  );
};

export const PhotoPedestalGallery: React.FC = () => {
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
    <group>
      {PHOTO_PEDESTALS.map((item) => (
        <PhotoPedestalStand
          key={item.id}
          item={item}
          marbleMaps={marbleMaps}
          metalMaps={metalMaps}
        />
      ))}
    </group>
  );
};
