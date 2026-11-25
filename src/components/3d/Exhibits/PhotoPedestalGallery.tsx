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

const PHOTO_PEDESTALS: PhotoPedestalConfig[] = [
  {
    id: 'pedestal-nckh',
    position: [-7.55, 0, -17.3],
    rotationY: 0.2,
    tag: 'NGHIÊN CỨU • PRODUCT TEAM',
    title: 'Nghiên Cứu Khoa Học & Báo Cáo Dự Án',
    description:
      'Thành viên TechTonic tham gia nghiên cứu khoa học sinh viên, thuyết trình giải pháp phần mềm và phát triển sản phẩm thực tế.',
    image: '/assets/images/tunnel/nckh_s1.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-olp',
    position: [7.55, 0, -17.3],
    rotationY: -0.2,
    tag: 'THÀNH TÍCH • ĐẤU TRƯỜNG',
    title: 'Olympic Tin Học Sinh Viên VN & ICPC',
    description:
      'Đội tuyển thuật toán TechTonic Club đạt Giải Khuyến Khích Olympic Tin học Sinh viên Việt Nam lần thứ 34 (2025).',
    image: '/assets/images/activity/olp_icpc.webp',
    accent: '#fbbf24',
  },
  {
    id: 'pedestal-cslt',
    position: [-15.2, 0, -12.1],
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
    position: [-15.2, 0, -0.1],
    rotationY: Math.PI / 2,
    tag: 'ĐỒNG HÀNH • KẾT NỐI',
    title: 'Chương Trình Mentor - Mentee',
    description:
      'From Us To You — kết nối anh chị khóa trên định hướng lộ trình Front-End, Back-End, AI & Data và kỹ năng nghề nghiệp.',
    image: '/assets/images/gallery/mm2.webp',
    accent: '#00F0FF',
  },
  {
    id: 'pedestal-techware',
    position: [15.2, 0, -0.1],
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
    position: [-8.7, 0, 6.95],
    rotationY: Math.PI - 0.16,
    tag: 'TUYỂN THÀNH VIÊN',
    title: 'TechXplore Chào Tân Sinh Viên',
    description:
      'Sự kiện thường niên đón tân sinh viên DUE khám phá thế giới CNTT và gia nhập đại gia đình TechTonic Club.',
    image: '/assets/images/gallery/tx2.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-ntnm',
    position: [-3.15, 0, 6.95],
    rotationY: Math.PI + 0.16,
    tag: 'GẮN KẾT • VĂN HÓA CLB',
    title: 'Đêm Nhạc & Du Lịch Gắn Kết',
    description:
      'Study Hard - Play Harder — khoảnh khắc âm nhạc, thiện nguyện và du lịch nội bộ lưu giữ thanh xuân cùng TechTonic.',
    image: '/assets/images/gallery/ntnm2.webp',
    accent: '#f472b6',
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
      {/* Sculpted Marble & Brushed Metal Gallery Plinth with Physics Collider */}
      <RigidBody type="fixed" position={[0, 0.48, 0]}>
        <RoundedBox position={[0, -0.42, 0]} args={[0.98, 0.1, 0.62]} radius={0.025} smoothness={4} receiveShadow>
          <meshStandardMaterial
            color="#334155"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.86}
            roughness={0.24}
          />
        </RoundedBox>
        <RoundedBox args={[0.84, 0.86, 0.5]} radius={0.03} smoothness={4} castShadow receiveShadow>
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
        <RoundedBox position={[0, 0.445, 0]} args={[0.9, 0.04, 0.56]} radius={0.015} smoothness={4}>
          <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.22} />
        </RoundedBox>
        <mesh position={[0, 0.41, 0]}>
          <boxGeometry args={[0.86, 0.014, 0.52]} />
          <meshBasicMaterial color={item.accent} toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Tilted Museum Easel Frame & Crisp Photo Canvas */}
      <group
        position={[0, 1.24, 0.02]}
        rotation={[-0.28, 0, 0]}
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
        {/* Support neck stem */}
        <mesh position={[0, -0.26, -0.05]}>
          <cylinderGeometry args={[0.045, 0.055, 0.2, 20]} />
          <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.22} />
        </mesh>

        {/* Brushed metal gallery photo frame */}
        <RoundedBox args={[0.92, 0.6, 0.045]} radius={0.018} smoothness={4} castShadow>
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
        <group position={[0, 0.33, 0.08]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 0.46, 14]} />
            <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.012, 0]}>
            <boxGeometry args={[0.42, 0.008, 0.014]} />
            <meshBasicMaterial color={item.accent} toneMapped={false} />
          </mesh>
        </group>

        {/* 16:10 Crisp Photograph */}
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.84, 0.525]} />
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
      <group position={[0, 0.74, 0.26]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[0.68, 0.19, 0.024]} radius={0.008} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0, 0.014]}>
          <planeGeometry args={[0.64, 0.16]} />
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
