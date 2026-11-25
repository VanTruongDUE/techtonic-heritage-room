import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
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

/**
 * 19 low-profile museum photo pedestals aligned in straight, evenly spaced perimeter rows along all 4 walls.
 * Max top height is ~0.84m (below all wall board bottom edges at 0.94m..1.19m) and all 5 department
 * portrait trees remain completely unobstructed from floor to ceiling.
 */
const PHOTO_PEDESTALS: PhotoPedestalConfig[] = [
  // ================= 1. LEFT WALL STRAIGHT ROW (x = -15.45, step = 3.65m, z = -11.6 .. +6.65) =================
  {
    id: 'pedestal-lw-1',
    position: [-15.45, 0, -11.6],
    rotationY: Math.PI / 2,
    tag: 'CHUYÊN MÔN • HỌC THUẬT',
    title: 'Đào Tạo CSLT & CSDL Hằng Tuần',
    description:
      'Các buổi chia sẻ thực chiến môn Cơ sở Lập trình & Cơ sở Dữ liệu miễn phí dành cho sinh viên năm nhất và năm hai DUE.',
    image: '/assets/images/gallery/CSLT7_1.webp',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-lw-2',
    position: [-15.45, 0, -7.95],
    rotationY: Math.PI / 2,
    tag: 'THỰC HÀNH • LẬP TRÌNH',
    title: 'Thực Hành Chia Sẻ CSLT',
    description:
      'Giờ học nhóm trực tiếp giải bài tập thuật toán, cấu trúc dữ liệu và hướng dẫn thực hành trên lớp.',
    image: '/assets/images/gallery/CSLT3_1.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-lw-3',
    position: [-15.45, 0, -4.3],
    rotationY: Math.PI / 2,
    tag: 'ĐỒNG HÀNH • KẾT NỐI',
    title: 'Chương Trình Mentor - Mentee',
    description:
      'From Us To You — kết nối anh chị khóa trên định hướng lộ trình Front-End, Back-End, AI & Data và kỹ năng nghề nghiệp.',
    image: '/assets/images/gallery/mm2.webp',
    accent: '#00F0FF',
  },
  {
    id: 'pedestal-lw-4',
    position: [-15.45, 0, -0.65],
    rotationY: Math.PI / 2,
    tag: 'KỶ NIỆM • MENTOR-MENTEE',
    title: 'Khoảnh Khắc Mentor - Mentee',
    description:
      'Những buổi gặp gỡ, sẻ chia học tập và đồng hành phát triển kỹ năng giữa các thế hệ thành viên TechTonic.',
    image: '/assets/images/gallery/mm9.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-lw-5',
    position: [-15.45, 0, 3.0],
    rotationY: Math.PI / 2,
    tag: 'HỌC THUẬT • GẮN KẾT',
    title: 'Giao Lưu Nhóm Mentor - Mentee',
    description:
      'Không khí trao đổi cởi mở giữa Mentor và thành viên mới trong các buổi sinh hoạt định kỳ.',
    image: '/assets/images/gallery/mm6.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-lw-6',
    position: [-15.45, 0, 6.65],
    rotationY: Math.PI / 2,
    tag: 'VĂN HÓA • SẺ CHIA',
    title: 'Hoạt Động Cộng Đồng TechTonic',
    description:
      'Kết nối bạn bè cùng chí hướng, lan tỏa tinh thần Study Hard - Play Harder trong toàn thể thành viên.',
    image: '/assets/images/gallery/mm8.webp',
    accent: '#fbbf24',
  },

  // ================= 2. RIGHT WALL STRAIGHT ROW (x = +15.45, step = 3.60m, z = -7.6 .. +6.8) =================
  {
    id: 'pedestal-rw-1',
    position: [15.45, 0, -7.6],
    rotationY: -Math.PI / 2,
    tag: 'CỐ VẤN • HỌC THUẬT',
    title: 'Sinh Hoạt Mentor & Chuyên Đề',
    description:
      'Trao đổi định hướng nghề nghiệp, review dự án và rèn luyện kỹ năng thuyết trình kỹ thuật.',
    image: '/assets/images/activity/mentor_mentee.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-rw-2',
    position: [15.45, 0, -4.0],
    rotationY: -Math.PI / 2,
    tag: 'THỰC HÀNH • WORKSHOP',
    title: 'Sự Kiện & Workshop TechWare',
    description:
      'Không gian trải nghiệm phần mềm, giao lưu diễn giả công nghệ và thực hành triển khai dự án cùng doanh nghiệp đồng hành.',
    image: '/assets/images/activity/techware.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-rw-3',
    position: [15.45, 0, -0.4],
    rotationY: -Math.PI / 2,
    tag: 'TRẢI NGHIỆM • TECHWARE',
    title: 'Không Gian Cộng Đồng TechWare',
    description:
      'Chuỗi hoạt động kết nối sinh viên với sản phẩm công nghệ thực tế và chia sẻ kinh nghiệm từ các anh chị.',
    image: '/assets/images/gallery/tw3.webp',
    accent: '#00F0FF',
  },
  {
    id: 'pedestal-rw-4',
    position: [15.45, 0, 3.2],
    rotationY: -Math.PI / 2,
    tag: 'SẢN PHẨM • TECHWARE',
    title: 'Triển Lãm Giải Pháp Công Nghệ',
    description:
      'Thành viên trình bày demo sản phẩm phần mềm và nhận góp ý trực tiếp từ Ban Chuyên Môn.',
    image: '/assets/images/gallery/tw4.webp',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-rw-5',
    position: [15.45, 0, 6.8],
    rotationY: -Math.PI / 2,
    tag: 'CÔNG NGHỆ • KẾT NỐI',
    title: 'Hoạt Động Trải Nghiệm TechWare',
    description:
      'Sinh viên DUE giao lưu, học hỏi các công cụ phát triển phần mềm hiện đại qua các gian hàng TechWare.',
    image: '/assets/images/gallery/tw6.webp',
    accent: '#34d399',
  },

  // ================= 3. BACK WALL STRAIGHT ROW (z = -17.3, symmetric flanks) =================
  {
    id: 'pedestal-bw-1',
    position: [-14.4, 0, -17.3],
    rotationY: 0,
    tag: 'ĐỔI MỚI • TECHWARE',
    title: 'Tập Thể TechWare Mùa Đầu Tiên',
    description:
      'Những dấu ấn đầu tiên của tập thể Ban Chủ Nhiệm và cộng tác viên trong chuỗi sự kiện công nghệ lớn.',
    image: '/assets/images/gallery/tw10.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-bw-2',
    position: [-7.78, 0, -17.3],
    rotationY: 0,
    tag: 'NGHIÊN CỨU • PRODUCT TEAM',
    title: 'Nghiên Cứu Khoa Học & Dự Án',
    description:
      'Thành viên TechTonic tham gia nghiên cứu khoa học sinh viên, thuyết trình giải pháp phần mềm và phát triển sản phẩm thực tế.',
    image: '/assets/images/tunnel/nckh_s1.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-bw-3',
    position: [7.78, 0, -17.3],
    rotationY: 0,
    tag: 'THÀNH TÍCH • ĐẤU TRƯỜNG',
    title: 'Olympic Tin Học SV & ICPC',
    description:
      'Đội tuyển thuật toán TechTonic Club đạt Giải Khuyến Khích Olympic Tin học Sinh viên Việt Nam lần thứ 34 (2025).',
    image: '/assets/images/activity/olp_icpc.webp',
    accent: '#fbbf24',
  },
  {
    id: 'pedestal-bw-4',
    position: [14.4, 0, -17.3],
    rotationY: 0,
    tag: 'HỌC THUẬT • CHIA SẺ',
    title: 'Buổi Chia Sẻ Kiến Thức Nền Tảng',
    description:
      'Không gian học thuật nghiêm túc nhưng gần gũi giúp sinh viên vượt qua các học phần công nghệ cốt lõi.',
    image: '/assets/images/activity/cshd.webp',
    accent: '#00F0FF',
  },

  // ================= 4. FRONT WALL STRAIGHT ROW (z = 7.05, cleanly under info boards only) =================
  {
    id: 'pedestal-fw-1',
    position: [-14.2, 0, 7.05],
    rotationY: Math.PI,
    tag: 'TUYỂN THÀNH VIÊN',
    title: 'TechXplore Chào Tân Sinh Viên',
    description:
      'Sự kiện thường niên đón tân sinh viên DUE khám phá thế giới CNTT và gia nhập đại gia đình TechTonic Club.',
    image: '/assets/images/gallery/tx2.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-fw-2',
    position: [-10.6, 0, 7.05],
    rotationY: Math.PI,
    tag: 'KHÁM PHÁ • TECHXPLORE',
    title: 'Hành Trình Khám Phá TechXplore',
    description:
      'Các trạm thử thách tư duy và định hướng chuyên môn dành cho sinh viên tham gia tuyển thành viên TechTonic.',
    image: '/assets/images/gallery/tx3.webp',
    accent: '#00F0FF',
  },
  {
    id: 'pedestal-fw-3',
    position: [7.8, 0, 7.05],
    rotationY: Math.PI,
    tag: 'TRẢI NGHIỆM • TÂN SINH VIÊN',
    title: 'Giao Lưu Trạm TechXplore',
    description:
      'Cơ hội kết nối trực tiếp cùng Ban Chủ Nhiệm và tìm hiểu hoạt động của 4 Ban chức năng.',
    image: '/assets/images/gallery/tx4.webp',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-fw-4',
    position: [11.4, 0, 7.05],
    rotationY: Math.PI,
    tag: 'GẮN KẾT • VĂN HÓA CLB',
    title: 'Đêm Nhạc & Du Lịch Gắn Kết',
    description:
      'Study Hard - Play Harder — khoảnh khắc âm nhạc, thiện nguyện và du lịch nội bộ lưu giữ thanh xuân cùng TechTonic.',
    image: '/assets/images/gallery/ntnm3.webp',
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
      {/* Compact Low-Profile Gallery Plinth (dark-tech obsidian marble + explicit fast box collider) */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.24, 0]}>
        <CuboidCollider args={[0.45, 0.36, 0.28]} position={[0, 0.12, 0]} />
        <RoundedBox position={[0, -0.21, 0]} args={[0.88, 0.06, 0.54]} radius={0.018} smoothness={4} receiveShadow>
          <meshStandardMaterial
            color="#121b2e"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.88}
            roughness={0.22}
          />
        </RoundedBox>
        <RoundedBox args={[0.76, 0.42, 0.44]} radius={0.024} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#20304e"
            roughness={0.28}
            metalness={0.38}
          />
        </RoundedBox>
        <RoundedBox position={[0, 0.22, 0]} args={[0.82, 0.03, 0.48]} radius={0.01} smoothness={4}>
          <meshStandardMaterial color="#1a2740" metalness={0.88} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0.195, 0]}>
          <boxGeometry args={[0.78, 0.014, 0.45]} />
          <meshBasicMaterial color={item.accent} toneMapped={false} />
        </mesh>
      </RigidBody>

      {/* Low Reclined Lectern Photo Easel (center y = 0.65m, -0.82 rad -> top rim y ≈ 0.83m, strictly below all boards) */}
      <group
        position={[0, 0.65, 0.02]}
        rotation={[-0.82, 0, 0]}
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
        <mesh position={[0, -0.15, -0.05]}>
          <cylinderGeometry args={[0.036, 0.046, 0.14, 20]} />
          <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.22} />
        </mesh>

        <RoundedBox args={[0.82, 0.52, 0.036]} radius={0.014} smoothness={4} castShadow>
          <meshStandardMaterial
            color="#1e293b"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.84}
            roughness={0.24}
            emissive={item.accent}
            emissiveIntensity={hovered ? 0.36 : 0.1}
          />
        </RoundedBox>

        {/* Top miniature gallery picture lamp */}
        <group position={[0, 0.285, 0.065]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.011, 0.011, 0.4, 14]} />
            <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.01, 0]}>
            <boxGeometry args={[0.36, 0.008, 0.011]} />
            <meshBasicMaterial color={item.accent} toneMapped={false} />
          </mesh>
        </group>

        {/* 16:10 Crisp Photograph */}
        <mesh position={[0, 0, 0.021]}>
          <planeGeometry args={[0.74, 0.4625]} />
          {photoTex ? (
            <meshStandardMaterial
              map={photoTex}
              color="#e2ecf8"
              emissive="#ffffff"
              emissiveMap={photoTex}
              emissiveIntensity={hovered ? 0.62 : 0.48}
              roughness={0.86}
              metalness={0}
            />
          ) : (
            <meshStandardMaterial color="#13223b" roughness={0.9} />
          )}
        </mesh>
      </group>

      {/* Front Engraved Caption Plaque on Plinth */}
      <group position={[0, 0.31, 0.23]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[0.62, 0.165, 0.02]} radius={0.008} smoothness={4}>
          <meshStandardMaterial color="#334155" metalness={0.86} roughness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.58, 0.14]} />
          <meshStandardMaterial
            map={captionTex}
            emissive="#ffffff"
            emissiveMap={captionTex}
            emissiveIntensity={0.4}
            roughness={0.85}
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
