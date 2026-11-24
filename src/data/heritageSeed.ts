import type {
  ActivityHighlight,
  ExecutiveMember,
  ExhibitItem,
  GuestbookEntry,
  TeleportZone,
  TimelineMilestone,
} from '../types/heritage';

export const EXECUTIVE_MEMBERS_SEED: ExecutiveMember[] = [
  {
    id: 'bcn-1',
    name: 'Nguyễn Hoàng Long',
    role: 'Chủ nhiệm CLB (President)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Chủ Nhiệm',
    bio: 'Định hướng chiến lược phát triển công nghệ, mở rộng mạng lưới hợp tác doanh nghiệp công nghệ.',
  },
  {
    id: 'bcn-2',
    name: 'Trần Minh Quân',
    role: 'Phó Chủ nhiệm Đối ngoại & Sự kiện',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Đối Ngoại',
    bio: 'Phụ trách kết nối đối tác tài trợ, các chương trình Hackathon và TechTalk quy mô lớn.',
  },
  {
    id: 'bcn-3',
    name: 'Lê Thùy Dung',
    role: 'Phó Chủ nhiệm Chuyên môn & R&D',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Chuyên Môn',
    bio: 'Chủ trì các dự án nghiên cứu AI/IoT, tổ chức các chuỗi đào tạo lập trình chuyên sâu cho thành viên.',
  },
  {
    id: 'bcn-4',
    name: 'Phạm Đức Anh',
    role: 'Trưởng Ban Truyền thông & Media',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Truyền Thông',
    bio: 'Xây dựng bộ nhận diện thương hiệu TechTonic, lan tỏa tinh thần đam mê công nghệ tới sinh viên.',
  },
  {
    id: 'bcn-5',
    name: 'Đặng Tuấn Kiệt',
    role: 'Cựu Chủ nhiệm Sáng lập (Founder)',
    term: 'Nhiệm kỳ 2023 - 2024',
    department: 'Ban Chủ Nhiệm',
    bio: 'Đặt nền móng xây dựng TechTonic Club với tôn chỉ "Igniting Passion, Pioneering Technology".',
  },
  {
    id: 'bcn-6',
    name: 'Vũ Hải Yến',
    role: 'Cựu Phó Chủ nhiệm Điều hành',
    term: 'Nhiệm kỳ 2023 - 2024',
    department: 'Ban Chủ Nhiệm',
    bio: 'Xây dựng quy chế hoạt động bền vững và văn hóa cởi mở, sáng tạo cho câu lạc bộ.',
  },
];

export const EXHIBIT_ITEMS_SEED: ExhibitItem[] = [
  {
    id: 'ex-1',
    title: 'Cúp Vô Địch Tech Challenge Toàn Quốc',
    category: 'trophy',
    year: '2024',
    description:
      'Giải Nhất cuộc thi Sáng tạo Công nghệ Trẻ với dự án Hệ thống Trợ lý AI và Ứng dụng Không gian 3D tương tác.',
    highlight: 'Giải Quán Quân Toàn Quốc',
  },
  {
    id: 'ex-2',
    title: 'Bằng Khen Câu Lạc Bộ Tiêu Biểu Xuất Sắc',
    category: 'certificate',
    year: '2023',
    description:
      'Ghi nhận những đóng góp vượt bậc trong phong trào NCKH và đổi mới sáng tạo kỹ thuật số trong sinh viên.',
    highlight: 'Bằng Khen Đoàn - Hội',
  },
  {
    id: 'ex-3',
    title: 'Huy Chương Vàng Hackathon Smart City',
    category: 'trophy',
    year: '2024',
    description:
      'Giải pháp Đô thị thông minh tích hợp IoT và Cloud do nhóm R&D TechTonic Club phát triển liên tục trong 48 giờ.',
    highlight: 'Huy Chương Vàng',
  },
  {
    id: 'ex-4',
    title: 'Cúp Đơn Vị Tổ Chức Sự Kiện Công Nghệ Xuất Sắc',
    category: 'trophy',
    year: '2023',
    description:
      'Chuỗi sự kiện TechTonic DevFest thu hút hơn 1,500 sinh viên và 15 doanh nghiệp công nghệ hàng đầu tham dự.',
    highlight: 'Sự Kiện Công Nghệ Của Năm',
  },
];

export const TIMELINE_MILESTONES_SEED: TimelineMilestone[] = [
  {
    id: 'tl-2022',
    year: '2022',
    title: 'Khởi Nguyên & Thành Lập',
    description:
      'Thành lập TechTonic Club với 30 thành viên sáng lập đam mê lập trình, thuật toán và công nghệ số.',
    highlights: ['30 thành viên sáng lập', 'Định hình tôn chỉ Igniting Passion'],
  },
  {
    id: 'tl-2023',
    year: '2023',
    title: 'Bứt Phá & Mở Rộng',
    description:
      'Tổ chức chuỗi DevFest quy mô 1,500 sinh viên; thành lập 4 ban chuyên môn vững mạnh và nhóm R&D AI/IoT.',
    highlights: ['1,500+ lượt sinh viên tham dự DevFest', 'Bằng khen CLB Tiêu biểu xuất sắc'],
  },
  {
    id: 'tl-2024',
    year: '2024',
    title: 'Tiên Phong & Đỉnh Cao',
    description:
      'Quán quân Tech Challenge toàn quốc, giải pháp số đô thị thông minh; hợp tác 15+ doanh nghiệp công nghệ.',
    highlights: ['Quán quân Tech Challenge Toàn Quốc', 'HCV Hackathon Smart City 48h'],
  },
];

export const ACTIVITY_HIGHLIGHTS_SEED: ActivityHighlight[] = [
  {
    id: 'act-1',
    title: 'TechTonic DevFest 2023',
    tag: 'WORKSHOP & SHOWCASE',
    year: '2023',
    color: '#0066FF',
    summary: 'Chuỗi hội thảo công nghệ thu hút 1,500+ sinh viên cùng 15 doanh nghiệp đối tác.',
  },
  {
    id: 'act-2',
    title: 'Hackathon 48h Non-stop',
    tag: 'CÔNG NGHỆ ĐỈNH CAO',
    year: '2024',
    color: '#00F0FF',
    summary: 'Đội ngũ R&D xây dựng giải pháp Đô thị thông minh tích hợp IoT và Cloud trong 48 giờ.',
  },
  {
    id: 'act-3',
    title: 'Teambuilding & Gala Dinner',
    tag: 'GẮN KẾT VĂN HÓA',
    year: '2024',
    color: '#FF0055',
    summary: 'Hoạt động kết nối các thế hệ thành viên, giữ lửa văn hóa cởi mở và sáng tạo.',
  },
  {
    id: 'act-4',
    title: 'Lễ Trao Giải Tech Challenge',
    tag: 'VINH DANH TÀI NĂNG',
    year: '2024',
    color: '#FFD700',
    summary: 'Vinh danh dự án Trợ lý AI và Không gian 3D tương tác đạt giải Quán Quân Toàn Quốc.',
  },
];

export const GUESTBOOK_ENTRIES_SEED: GuestbookEntry[] = [
  {
    id: 'gb-1',
    author: 'TS. Nguyễn Văn Hưng',
    roleOrAffiliation: 'Cố vấn Chuyên môn',
    message:
      'Chúc TechTonic Club luôn giữ vững ngọn lửa đam mê, tiếp tục vươn xa và là cái nôi ươm mầm các tài năng kỹ thuật số hàng đầu!',
    timestamp: '2024-10-15',
  },
  {
    id: 'gb-2',
    author: 'Nguyễn Thu Trang',
    roleOrAffiliation: 'Cựu Thành viên K20',
    message:
      'Tự hào là một phần của TechTonic! Phòng truyền thống 3D này thực sự quá đẳng cấp và truyền cảm hứng!',
    timestamp: '2024-10-20',
  },
  {
    id: 'gb-3',
    author: 'Phan Bảo Nam',
    roleOrAffiliation: 'Khách tham quan TechFest',
    message:
      'Không gian 3D mượt mà, ánh sáng đỉnh cao. Chúc câu lạc bộ ngày càng phát triển rực rỡ!',
    timestamp: '2024-10-24',
  },
];

export const TELEPORT_ZONES: TeleportZone[] = [
  {
    id: 'entrance',
    label: 'Hành Lang Lối Vào',
    shortLabel: 'Lối vào',
    description: 'Điểm khởi đầu bước vào không gian đại sảnh TechTonic.',
    position: [0, 1.4, 13.5],
    lookAt: [0, 2.2, -18],
  },
  {
    id: 'center-wall',
    label: 'Vách Tâm Điểm',
    shortLabel: 'Sứ mệnh',
    description: 'Biểu tượng TechTonic phát sáng, slogan và tuyên ngôn sứ mệnh.',
    position: [0, 1.4, -10.5],
    lookAt: [0, 3.2, -18.4],
  },
  {
    id: 'central-island',
    label: 'Đảo Vinh Danh 360°',
    shortLabel: 'Đảo Cúp',
    description: '4 tủ kính trưng bày Cúp vô địch, Bằng khen và Huy chương vàng.',
    position: [0, 1.4, 1.2],
    lookAt: [0, 1.5, -5],
  },
  {
    id: 'timeline-gallery',
    label: 'Dòng Thời Gian & Kỷ Yếu',
    shortLabel: 'Lịch sử',
    description: 'Cột mốc phát triển 2022–2024 và khoảnh khắc hoạt động tiêu biểu.',
    position: [-9.5, 1.4, -2],
    lookAt: [-16.5, 3.0, -3],
  },
  {
    id: 'club-shirt',
    label: 'Áo CLB & Ban Chủ Nhiệm',
    shortLabel: 'Áo CLB',
    description: 'Khu trưng bày Áo Câu Lạc Bộ 3D và danh sách Ban Chủ Nhiệm các nhiệm kỳ.',
    position: [9.5, 1.4, -4],
    lookAt: [14.5, 2.0, -4],
  },
  {
    id: 'interactive-corner',
    label: 'Góc Truyền Thông & Lưu Bút',
    shortLabel: 'Lưu bút',
    description: 'Màn hình trình chiếu TechTonic và Sổ lưu bút điện tử tương tác.',
    position: [4.2, 1.4, -11.8],
    lookAt: [6.2, 1.45, -14.8],
  },
];
