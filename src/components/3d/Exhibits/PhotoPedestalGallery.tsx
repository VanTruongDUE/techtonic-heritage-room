import React, { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
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
 * 32 low-profile museum photo pedestals aligned in straight, evenly spaced, mirror-symmetric perimeter rows
 * across all 4 walls:
 * - Left Wall:  10 pedestals (x = -15.45, exact uniform step = 2.00m, z = -11.8 .. +6.2)
 * - Right Wall:  8 pedestals (x = +15.45, exact uniform step = 2.00m, z = -7.8 .. +6.2 — mirror-aligned with Left Wall)
 * - Back Wall:   8 pedestals (z = -17.30, 4 Left + 4 Right mirror-symmetric, step = 2.65m, x = ±6.70 .. ±14.65)
 * - Front Wall:  6 pedestals (z = +7.05,  3 Left + 3 Right evenly spaced, step = 2.40m, strictly under info boards)
 * Max top height is ~0.83m (below all wall board edges) and all 5 department trees & Club Shirt remain 100% unobstructed.
 */
const PHOTO_PEDESTALS: PhotoPedestalConfig[] = [
  // ================= 1. LEFT WALL STRAIGHT ROW (10 pedestals + 1 BCM feature pedestal) =================
  {
    id: 'pedestal-bcm-1',
    position: [-14.72, 0, -15.1],
    rotationY: Math.PI / 2,
    tag: 'BAN CHUYÊN MÔN • BCM',
    title: 'Tập Thể Ban Chuyên Môn TechTonic',
    description:
      'Đội ngũ nòng cốt dẫn dắt các buổi đào tạo học thuật FE/BE/AI & Data, dự án Product Team và đội tuyển thi đấu ICPC - OLP, NCKH tại DUE.',
    image: '/assets/images/gallery/bcm_team.jpg',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-lw-1',
    position: [-15.45, 0, -11.8],
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
    position: [-15.45, 0, -9.8],
    rotationY: Math.PI / 2,
    tag: 'THỰC HÀNH • LẬP TRÌNH',
    title: 'Thực Hành Chia Sẻ CSLT',
    description:
      'Giờ học nhóm trực tiếp giải bài tập thuật toán, cấu trúc dữ liệu và hướng dẫn thực hành ngay trên lớp.',
    image: '/assets/images/gallery/CSLT3_1.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-lw-3',
    position: [-15.45, 0, -7.8],
    rotationY: Math.PI / 2,
    tag: 'KHỞI ĐẦU • CSLT',
    title: 'Lớp Học Thuật Nền Tảng Đầu Tiên',
    description:
      'Những buổi đứng lớp chia sẻ kiến thức lập trình căn bản đầy tâm huyết đặt nền móng văn hóa học thuật TechTonic.',
    image: '/assets/images/tunnel/cslt_1.webp',
    accent: '#00F5FF',
  },
  {
    id: 'pedestal-lw-4',
    position: [-15.45, 0, -5.8],
    rotationY: Math.PI / 2,
    tag: 'MENTOR - MENTEE • MÙA 1',
    title: 'Hành Trình Mentor - Mentee Mùa 1',
    description:
      'Mùa đầu tiên của chuỗi From Us To You — kết nối sinh viên khóa trên đồng hành, giải đáp định hướng ngành CNTT tại DUE.',
    image: '/assets/images/tunnel/mentor_mentee_ss1.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-lw-5',
    position: [-15.45, 0, -3.8],
    rotationY: Math.PI / 2,
    tag: 'MENTOR - MENTEE • MÙA 2',
    title: 'Chương Trình Mentor - Mentee Mùa 2',
    description:
      'Tiếp nối và mở rộng quy mô cố vấn chuyên sâu mảng Front-End, Back-End, AI & Data cùng đội ngũ Mentor giàu kinh nghiệm.',
    image: '/assets/images/tunnel/mentor_mentee_ss2.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-lw-6',
    position: [-15.45, 0, -1.8],
    rotationY: Math.PI / 2,
    tag: 'KHAI MẠC • KẾT NỐI',
    title: 'Lễ Khai Mạc Mentor - Mentee',
    description:
      'Khoảnh khắc ra mắt các cặp Mentor - Mentee, khởi động chặng đường rèn luyện kỹ năng chuyên môn và làm việc nhóm.',
    image: '/assets/images/tunnel/mm1.webp',
    accent: '#fbbf24',
  },
  {
    id: 'pedestal-lw-7',
    position: [-15.45, 0, 0.2],
    rotationY: Math.PI / 2,
    tag: 'ĐỒNG HÀNH • ĐỊNH HƯỚNG',
    title: 'Chia Sẻ Lộ Trình Nghề Nghiệp',
    description:
      'From Us To You — định hướng lộ trình học tập, xây dựng dự án cá nhân và chuẩn bị hành trang thực tập doanh nghiệp.',
    image: '/assets/images/gallery/mm2.webp',
    accent: '#00F5FF',
  },
  {
    id: 'pedestal-lw-8',
    position: [-15.45, 0, 2.2],
    rotationY: Math.PI / 2,
    tag: 'KỶ NIỆM • MENTOR-MENTEE',
    title: 'Khoảnh Khắc Mentor - Mentee',
    description:
      'Những buổi gặp gỡ, sẻ chia học tập và đồng hành phát triển kỹ năng giữa các thế hệ thành viên TechTonic.',
    image: '/assets/images/gallery/mm9.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-lw-9',
    position: [-15.45, 0, 4.2],
    rotationY: Math.PI / 2,
    tag: 'HỌC THUẬT • GẮN KẾT',
    title: 'Giao Lưu Nhóm Mentor - Mentee',
    description:
      'Không khí trao đổi cởi mở giữa Mentor và thành viên mới trong các buổi sinh hoạt định kỳ hằng tuần.',
    image: '/assets/images/gallery/mm6.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-lw-10',
    position: [-15.45, 0, 6.2],
    rotationY: Math.PI / 2,
    tag: 'VĂN HÓA • SẺ CHIA',
    title: 'Hoạt Động Cộng Đồng TechTonic',
    description:
      'Kết nối bạn bè cùng chí hướng, lan tỏa tinh thần Study Hard - Play Harder trong toàn thể thành viên CLB.',
    image: '/assets/images/gallery/mm8.webp',
    accent: '#fbbf24',
  },

  // ================= 2. RIGHT WALL STRAIGHT ROW (8 pedestals step 1.80m + 1 BSK feature pedestal) =================
  {
    id: 'pedestal-bsk-1',
    position: [14.72, 0, -15.1],
    rotationY: -Math.PI / 2,
    tag: 'BAN SỰ KIỆN • BSK',
    title: 'Tập Thể Ban Sự Kiện TechTonic',
    description:
      'Đội ngũ tổ chức và điều phối các chương trình lớn như TechXplore, TechWare, Mentor - Mentee và các hoạt động gắn kết cộng đồng DUE.',
    image: '/assets/images/gallery/tw10.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-rw-1',
    position: [15.45, 0, -7.9],
    rotationY: -Math.PI / 2,
    tag: 'CỐ VẤN • HỌC THUẬT',
    title: 'Sinh Hoạt Mentor & Chuyên Đề',
    description:
      'Trao đổi định hướng nghề nghiệp, review dự án và rèn luyện kỹ năng thuyết trình kỹ thuật trước tập thể.',
    image: '/assets/images/activity/mentor_mentee.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-rw-2',
    position: [15.45, 0, -6.1],
    rotationY: -Math.PI / 2,
    tag: 'SỰ KIỆN • TECHWARE MÙA 1',
    title: 'Chuỗi Sự Kiện TechWare Mùa 1',
    description:
      'Dấu mốc sự kiện công nghệ quy mô lớn dành cho sinh viên yêu thích phần mềm, sáng tạo và trải nghiệm thực tế.',
    image: '/assets/images/tunnel/techware_ss1.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-rw-3',
    position: [15.45, 0, -4.3],
    rotationY: -Math.PI / 2,
    tag: 'THỰC HÀNH • WORKSHOP',
    title: 'Workshop Công Nghệ TechWare',
    description:
      'Không gian trải nghiệm phần mềm, giao lưu diễn giả công nghệ và thực hành triển khai dự án cùng doanh nghiệp đồng hành.',
    image: '/assets/images/activity/techware.webp',
    accent: '#00F5FF',
  },
  {
    id: 'pedestal-rw-4',
    position: [15.45, 0, -2.5],
    rotationY: -Math.PI / 2,
    tag: 'SÂN KHẤU • TECHWARE',
    title: 'Sân Khấu Khai Mạc TechWare',
    description:
      'Bầu không khí sôi động trong ngày hội công nghệ TechWare với sự góp mặt của đông đảo sinh viên DUE.',
    image: '/assets/images/tunnel/tw1.webp',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-rw-5',
    position: [15.45, 0, -0.7],
    rotationY: -Math.PI / 2,
    tag: 'TRẢI NGHIỆM • TECHWARE',
    title: 'Không Gian Cộng Đồng TechWare',
    description:
      'Chuỗi hoạt động kết nối sinh viên với sản phẩm công nghệ thực tế và chia sẻ kinh nghiệm từ các anh chị.',
    image: '/assets/images/gallery/tw3.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-rw-6',
    position: [15.45, 0, 1.1],
    rotationY: -Math.PI / 2,
    tag: 'SẢN PHẨM • TECHWARE',
    title: 'Triển Lãm Giải Pháp Công Nghệ',
    description:
      'Thành viên trình bày demo sản phẩm phần mềm và nhận góp ý chuyên sâu trực tiếp từ Ban Chuyên Môn.',
    image: '/assets/images/gallery/tw4.webp',
    accent: '#fbbf24',
  },
  {
    id: 'pedestal-rw-7',
    position: [15.45, 0, 2.9],
    rotationY: -Math.PI / 2,
    tag: 'CÔNG NGHỆ • KẾT NỐI',
    title: 'Hoạt Động Trải Nghiệm TechWare',
    description:
      'Sinh viên DUE giao lưu, học hỏi các công cụ phát triển phần mềm hiện đại qua các gian hàng TechWare.',
    image: '/assets/images/gallery/tw6.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-rw-8',
    position: [15.45, 0, 4.7],
    rotationY: -Math.PI / 2,
    tag: 'THIỆN NGUYỆN • ĐÊM NHẠC',
    title: 'Đêm Nhạc Gây Quỹ Thiện Nguyện',
    description:
      'Những giai điệu ấm áp lan tỏa tinh thần sẻ chia vì cộng đồng trong chuỗi hoạt động Tình nguyện Đông - Xuân.',
    image: '/assets/images/gallery/ntnm2.webp',
    accent: '#f472b6',
  },

  // ================= 3. BACK WALL STRAIGHT ROW (8 mirror-symmetric pedestals, z = -17.30, step = 2.65m) =================
  {
    id: 'pedestal-bw-1',
    position: [-14.65, 0, -17.3],
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
    position: [-12.0, 0, -17.3],
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
    position: [-9.35, 0, -17.3],
    rotationY: 0,
    tag: 'KẾT NỐI • KHOA MIS',
    title: 'Ngày Hội Tựu Trường & Kết Nối MIS',
    description:
      'TechTonic Club đồng hành cùng sinh viên Khoa Hệ thống Thông tin Quản lý trong các hoạt động chào đón năm học mới.',
    image: '/assets/images/activity/ntn_mis.webp',
    accent: '#00F5FF',
  },
  {
    id: 'pedestal-bw-4',
    position: [-6.7, 0, -17.3],
    rotationY: 0,
    tag: 'CỘNG ĐỒNG • THIỆN NGUYỆN',
    title: 'Tình Nguyện & Nhịp Tim Nhỏ Mình',
    description:
      'Hành trình thiện nguyện ấm áp mang yêu thương và tinh thần tuổi trẻ TechTonic đến với cộng đồng.',
    image: '/assets/images/tunnel/ntnm1.webp',
    accent: '#f472b6',
  },
  {
    id: 'pedestal-bw-5',
    position: [6.7, 0, -17.3],
    rotationY: 0,
    tag: 'THÀNH TÍCH • ĐẤU TRƯỜNG',
    title: 'Olympic Tin Học SV & ICPC',
    description:
      'Đội tuyển thuật toán TechTonic Club đạt Giải Khuyến Khích Olympic Tin học Sinh viên Việt Nam lần thứ 34 (2025).',
    image: '/assets/images/activity/olp_icpc.webp',
    accent: '#fbbf24',
  },
  {
    id: 'pedestal-bw-6',
    position: [9.35, 0, -17.3],
    rotationY: 0,
    tag: 'HỌC THUẬT • CHIA SẺ',
    title: 'Buổi Chia Sẻ Kiến Thức Nền Tảng',
    description:
      'Không gian học thuật nghiêm túc nhưng gần gũi giúp sinh viên vượt qua các học phần công nghệ cốt lõi.',
    image: '/assets/images/activity/cshd.webp',
    accent: '#00F5FF',
  },
  {
    id: 'pedestal-bw-7',
    position: [12.0, 0, -17.3],
    rotationY: 0,
    tag: 'ĐỐI TÁC • DOANH NGHIỆP',
    title: 'Đồng Hành MGM Technology Partners',
    description:
      'Kết nối doanh nghiệp công nghệ hàng đầu tại Đà Nẵng mở rộng cơ hội học hỏi thực tiễn và thực tập cho sinh viên.',
    image: '/assets/images/achievement/mgm_technology.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-bw-8',
    position: [14.65, 0, -17.3],
    rotationY: 0,
    tag: 'ĐỐI TÁC • ĐÀO TẠO',
    title: 'Hợp Tác Học Thuật VTC Academy',
    description:
      'VTC Academy đồng hành cùng các workshop chuyên đề, cố vấn dự án và tài trợ nguồn lực phát triển cộng đồng CNTT trẻ.',
    image: '/assets/images/achievement/vtc_academy.webp',
    accent: '#fb923c',
  },

  // ================= 4. FRONT WALL STRAIGHT ROW (6 evenly spaced pedestals, z = 7.05, step = 2.40m) =================
  {
    id: 'pedestal-fw-1',
    position: [-14.6, 0, 7.05],
    rotationY: Math.PI,
    tag: 'TUYỂN THÀNH VIÊN • TECHXPLORE',
    title: 'Chiến Dịch Tuyển Thành Viên TechXplore',
    description:
      'Khởi động mùa tuyển thành viên thường niên không thu phí, chào đón mọi sinh viên DUE đam mê công nghệ.',
    image: '/assets/images/tunnel/tech_x_plore.webp',
    accent: '#c084fc',
  },
  {
    id: 'pedestal-fw-2',
    position: [-12.2, 0, 7.05],
    rotationY: Math.PI,
    tag: 'CHÀO TÂN • TECHXPLORE',
    title: 'TechXplore Chào Tân Sinh Viên',
    description:
      'Sự kiện đón tân sinh viên DUE khám phá thế giới CNTT và gia nhập đại gia đình TechTonic Club.',
    image: '/assets/images/gallery/tx2.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-fw-3',
    position: [-9.8, 0, 7.05],
    rotationY: Math.PI,
    tag: 'KHÁM PHÁ • TECHXPLORE',
    title: 'Hành Trình Khám Phá TechXplore',
    description:
      'Các trạm thử thách tư duy và định hướng chuyên môn dành cho sinh viên tham gia tuyển thành viên TechTonic.',
    image: '/assets/images/gallery/tx3.webp',
    accent: '#00F5FF',
  },
  {
    id: 'pedestal-btt-1',
    position: [-5.8, 0, 6.25],
    rotationY: Math.PI,
    tag: 'BAN TRUYỀN THÔNG • BTT',
    title: 'Tập Thể Ban Truyền Thông TechTonic',
    description:
      'Đội ngũ sáng tạo nội dung, thiết kế ấn phẩm, ghi hình và lan tỏa hình ảnh năng động của CLB TechTonic đến cộng đồng sinh viên DUE.',
    image: '/assets/images/gallery/btt_team.jpg',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-bns-1',
    position: [4.4, 0, 6.25],
    rotationY: Math.PI,
    tag: 'BAN NHÂN SỰ • BNS',
    title: 'Tập Thể Ban Nhân Sự TechTonic',
    description:
      'Phụ trách gắn kết thành viên, đối ngoại, gây quỹ, quản lý hồ sơ nhân sự và hậu cần vận hành các hoạt động của CLB.',
    image: '/assets/images/gallery/mm8.webp',
    accent: '#34d399',
  },
  {
    id: 'pedestal-fw-4',
    position: [7.2, 0, 7.05],
    rotationY: Math.PI,
    tag: 'KẾT NỐI • TUYỂN CHỌN',
    title: 'Giao Lưu & Phỏng Vấn TechXplore',
    description:
      'Không gian trò chuyện gần gũi giúp ứng viên tìm ra đúng Ban chức năng phù hợp với sở thích và thế mạnh cá nhân.',
    image: '/assets/images/tunnel/tx1.webp',
    accent: '#38bdf8',
  },
  {
    id: 'pedestal-fw-5',
    position: [9.6, 0, 7.05],
    rotationY: Math.PI,
    tag: 'TRẢI NGHIỆM • TÂN SINH VIÊN',
    title: 'Giao Lưu Trạm TechXplore',
    description:
      'Cơ hội kết nối trực tiếp cùng Ban Chủ Nhiệm và tìm hiểu hoạt động của 4 Ban chức năng.',
    image: '/assets/images/gallery/tx4.webp',
    accent: '#fb923c',
  },
  {
    id: 'pedestal-fw-6',
    position: [12.0, 0, 7.05],
    rotationY: Math.PI,
    tag: 'GẮN KẾT • VĂN HÓA CLB',
    title: 'Đêm Nhạc & Du Lịch Gắn Kết',
    description:
      'Study Hard - Play Harder — khoảnh khắc âm nhạc, thiện nguyện và du lịch nội bộ lưu giữ thanh xuân cùng TechTonic.',
    image: '/assets/images/gallery/ntnm3.webp',
    accent: '#f472b6',
  },
  {
    id: 'pedestal-bcn-1',
    position: [14.6, 0, 6.25],
    rotationY: Math.PI,
    tag: 'BAN CHỦ NHIỆM • BCN',
    title: 'Ban Chủ Nhiệm & Điều Hành TechTonic',
    description:
      'Đội ngũ lãnh đạo định hướng chiến lược, kết nối 4 Ban chức năng và dẫn dắt hành trình phát triển của TechTonic Club qua các nhiệm kỳ.',
    image: '/assets/images/tunnel/techware_ss1.webp',
    accent: '#fbbf24',
  },
];

function createPedestalCaptionTexture(item: PhotoPedestalConfig): THREE.CanvasTexture {
  const { canvas, ctx } = createHiResCanvas(448, 112, 1.5);
  if (ctx) {
    ctx.fillStyle = '#070e1c';
    ctx.fillRect(0, 0, 448, 112);

    ctx.strokeStyle = item.accent;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(3, 3, 442, 106);

    ctx.fillStyle = item.accent;
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.tag, 224, 32, 418);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 21px Inter, sans-serif';
    ctx.fillText(item.title, 224, 68, 418);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillText('Nhấp hoặc nhấn [E] để phóng to ảnh', 224, 95, 418);
  }
  return finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true });
}

const PhotoPedestalStand: React.FC<{
  item: PhotoPedestalConfig;
  marbleMaps: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
  metalMaps: { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture };
}> = ({ item, marbleMaps, metalMaps }) => {
  const { openModal, setHoveringInteractive } = useHeritageStore(
    useShallow((s) => ({
      openModal: s.openModal,
      setHoveringInteractive: s.setHoveringInteractive,
    }))
  );
  const [hovered, setHovered] = useState(false);
  const [photoTex, setPhotoTex] = useState<THREE.CanvasTexture | null>(null);

  const captionTex = useMemo(() => createPedestalCaptionTexture(item), [item]);

  useEffect(() => {
    let cancelled = false;
    let triedFallback = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const w = 640;
      const h = 400;
      const { canvas, ctx } = createHiResCanvas(w, h, 1.5);
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
      setPhotoTex(finalizeCrispTexture(canvas, { anisotropy: 4, srgb: true }));
    };
    img.onerror = () => {
      if (cancelled || triedFallback) return;
      triedFallback = true;
      img.src = '/assets/images/gallery/tw10.webp';
    };
    img.src = item.image;
    return () => {
      cancelled = true;
    };
  }, [item.image]);

  useEffect(() => {
    return () => {
      captionTex.dispose();
    };
  }, [captionTex]);

  useEffect(() => {
    return () => {
      photoTex?.dispose();
    };
  }, [photoTex]);

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
        <RoundedBox position={[0, -0.21, 0]} args={[0.88, 0.06, 0.54]} radius={0.018} smoothness={2} receiveShadow>
          <meshStandardMaterial
            color="#0b1222"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.88}
            roughness={0.22}
          />
        </RoundedBox>
        <RoundedBox args={[0.76, 0.42, 0.44]} radius={0.024} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial
            map={marbleMaps.map}
            roughnessMap={marbleMaps.roughnessMap}
            bumpMap={marbleMaps.bumpMap}
            bumpScale={0.008}
            color="#15223b"
            roughness={0.28}
            metalness={0.4}
          />
        </RoundedBox>
        <RoundedBox position={[0, 0.22, 0]} args={[0.82, 0.03, 0.48]} radius={0.01} smoothness={2}>
          <meshStandardMaterial color="#121e36" metalness={0.88} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0.195, 0]}>
          <boxGeometry args={[0.78, 0.016, 0.45]} />
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
          <cylinderGeometry args={[0.036, 0.046, 0.14, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.22} />
        </mesh>

        <RoundedBox args={[0.82, 0.52, 0.036]} radius={0.014} smoothness={2} castShadow>
          <meshStandardMaterial
            color="#142036"
            roughnessMap={metalMaps.roughnessMap}
            metalness={0.84}
            roughness={0.24}
            emissive={item.accent}
            emissiveIntensity={hovered ? 0.42 : 0.14}
          />
        </RoundedBox>

        {/* Top miniature gallery picture lamp */}
        <group position={[0, 0.285, 0.065]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.011, 0.011, 0.4, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.01, 0]}>
            <boxGeometry args={[0.36, 0.008, 0.011]} />
            <meshBasicMaterial color={item.accent} toneMapped={false} />
          </mesh>
        </group>

        {/* 16:10 Crisp Backlit Museum Photograph (distinct key forces Three.js shader recompile when photo loads) */}
        <mesh position={[0, 0, 0.021]}>
          <planeGeometry args={[0.74, 0.4625]} />
          {photoTex ? (
            <meshBasicMaterial
              key="photo-ready"
              map={photoTex}
              color={hovered ? '#ffffff' : '#dbe8f8'}
            />
          ) : (
            <meshStandardMaterial key="photo-loading" color="#101c33" roughness={0.9} />
          )}
        </mesh>
      </group>

      {/* Front Engraved Caption Plaque on Plinth */}
      <group position={[0, 0.31, 0.23]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[0.62, 0.165, 0.02]} radius={0.008} smoothness={2}>
          <meshStandardMaterial color="#25344f" metalness={0.86} roughness={0.24} />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.58, 0.14]} />
          <meshStandardMaterial
            map={captionTex}
            emissive="#ffffff"
            emissiveMap={captionTex}
            emissiveIntensity={0.48}
            roughness={0.82}
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
