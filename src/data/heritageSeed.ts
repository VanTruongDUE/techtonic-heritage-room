import type {
  ActivityHighlight,
  ExecutiveMember,
  ExhibitItem,
  GuestbookEntry,
  TeleportZone,
  TimelineMilestone,
} from '../types/heritage';

export const CLUB_PROFILE = {
  name: 'TechTonic Club',
  affiliation: 'Trực thuộc Hội Sinh viên Trường Đại học Kinh tế - Đại học Đà Nẵng (DUE)',
  slogan: 'Dream it - Code it',
  spirit: 'Study Hard - Play Harder',
  tagline: 'Khơi nguồn đam mê, kiến tạo tương lai công nghệ.',
  vision:
    'Trở thành câu lạc bộ học thuật hàng đầu trực thuộc Hội Sinh viên tại trường Đại học Kinh Tế - Đại học Đà Nẵng, nơi trao đi những giá trị sâu sắc cho sinh viên trong khoảng thời gian học đại học và tương lai.',
  mission:
    'Câu lạc bộ TechTonic là một môi trường học thuật cạnh tranh, lành mạnh, giúp cải thiện kiến thức, kỹ năng, thái độ, kinh nghiệm, các mối quan hệ theo đúng lĩnh vực Công nghệ thông tin, thông qua sự dẫn dắt chân thành, lòng biết ơn, và trách nhiệm cao của mỗi cá nhân với bản thân và cộng đồng.',
  metrics: [
    { label: 'Giải thưởng', value: '10+' },
    { label: 'Thành viên', value: '100+' },
    { label: 'Dự án', value: '20+' },
    { label: 'Năm hoạt động', value: '2+' },
  ],
  coreValues: [
    { name: 'Tinh thần chia sẻ', note: 'Hiểu' },
    { name: 'Sự tương trợ', note: 'Hiểu rồi mới giúp được' },
    { name: 'Sự chân thành', note: 'Hiểu và giúp bằng sự chân thành' },
    { name: 'Sự tôn trọng', note: 'Có sự tôn trọng lẫn nhau' },
    { name: 'Sự trách nhiệm', note: 'Ý thức xây dựng và phát triển CLB' },
    { name: 'Sự đổi mới', note: 'Cơ chế phản chứng' },
    { name: 'Sự vui vẻ', note: 'Study Hard - Play Harder' },
  ],
  partners: ['VTC Academy', 'MGM Technology'],
  contact: {
    website: 'https://www.techtonic-club.id.vn/',
    email: 'techtonic.clb@gmail.com',
    hotline: '091 474 3819',
    address: '71 Ngũ Hành Sơn, Phường Ngũ Hành Sơn, Đà Nẵng',
    facebook: 'https://www.facebook.com/TechTonic.Club17',
    youtube: 'https://www.youtube.com/@TechTonicClub-1724',
    instagram: 'https://www.instagram.com/techtonic.club',
    threads: 'https://www.threads.com/@techtonic.club',
  },
  testimonials: [
    {
      name: 'Đinh Sỹ Quốc Doanh',
      role: 'Co-Founder • Trưởng Ban Chuyên Môn (2024–2025) • Mentor BE mùa đầu tiên',
    },
    {
      name: 'Phan Nhật Minh Anh',
      role: 'Sinh viên năm 4 • Chủ nhiệm CLB TechTonic nhiệm kỳ 2025–2026',
    },
    {
      name: 'Nguyễn Hoàng',
      role: 'Cựu sinh viên • Mentor Chuyên môn Frontend nhiệm kỳ 2025–2026',
    },
    {
      name: 'Hồ Văn Trường',
      role: 'Sinh viên năm 3 • Trưởng Ban Chuyên Môn nhiệm kỳ 2026–2027',
    },
  ],
  weeklyTracks: [
    {
      title: 'Chuyên môn Front-end (FE)',
      schedule: 'Hằng tuần',
      desc: 'Xây dựng giao diện và trải nghiệm người dùng cho website & ứng dụng hiện đại.',
    },
    {
      title: 'Chuyên môn Back-end (BE)',
      schedule: 'Hằng tuần',
      desc: 'Xử lý hệ thống, API, cơ sở dữ liệu và logic vận hành phía máy chủ qua dự án thực tế.',
    },
    {
      title: 'Chuyên môn AI & Data',
      schedule: 'Hằng tuần',
      desc: 'Xử lý dữ liệu, phân tích dữ liệu, Machine Learning và ứng dụng AI vào thực tiễn.',
    },
    {
      title: 'CSLT & CSDL • Product Team • MIS',
      schedule: 'Hằng tuần & Tháng',
      desc: 'Củng cố Cơ sở lập trình & CSDL, báo cáo Product Team, talkshow Người trong ngành MIS và Happy Hour.',
    },
  ],
};

export const EXECUTIVE_MEMBERS_SEED: ExecutiveMember[] = [
  // ─── Nhiệm kỳ 2026 - 2027 ───
  {
    id: 'bcn-2627-1',
    name: 'Đặng Nguyên Quốc Bảo',
    role: 'Chủ nhiệm CLB',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chủ Nhiệm',
    bio: 'Điều hành chiến lược phát triển và hoạt động toàn câu lạc bộ nhiệm kỳ 2026 - 2027.',
  },
  {
    id: 'bcn-2627-2',
    name: 'Nguyễn Thị Phương Thảo',
    role: 'Phó Chủ nhiệm CLB',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chủ Nhiệm',
    bio: 'Phối hợp điều hành hoạt động nội bộ, chương trình học thuật và kết nối thành viên.',
  },
  {
    id: 'bcn-2627-3',
    name: 'Ngô Phương Thảo',
    role: 'Phó Chủ nhiệm CLB',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chủ Nhiệm',
    bio: 'Phụ trách vận hành, nhân sự và triển khai chuỗi sự kiện nhiệm kỳ 2026 - 2027.',
  },
  {
    id: 'bcn-2627-4',
    name: 'Hồ Văn Trường',
    role: 'Trưởng Ban Chuyên Môn',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    bio: 'Lập lộ trình khóa học, quản lý dự án CNTT nội bộ (FE, BE, AI & Data) và định hướng thi học thuật.',
  },
  {
    id: 'bcn-2627-5',
    name: 'Đinh Tấn Khoa',
    role: 'Phó Ban Chuyên Môn',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    bio: 'Hỗ trợ điều phối học thuật, biên soạn tài liệu và hướng dẫn thành viên nhóm dự án.',
  },
  {
    id: 'bcn-2627-6',
    name: 'Ngô Thị Ngọc Huyền',
    role: 'Phó Ban Chuyên Môn',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    bio: 'Đồng điều phối chất lượng chuyên môn và kết nối nhóm học tập hằng tuần.',
  },
  {
    id: 'bcn-2627-7',
    name: 'Trần Thị Thanh Tâm',
    role: 'Phó Ban Chuyên Môn',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    bio: 'Phụ trách tổ chức hoạt động học thuật và đánh giá tiến độ đầu ra chuyên môn.',
  },
  {
    id: 'bcn-2627-8',
    name: 'Đoàn Ngọc Bảo Trân',
    role: 'Trưởng Ban Sự Kiện',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    bio: 'Chủ trì ý tưởng, kịch bản và điều phối các sự kiện lớn: TechXplore, TechWare, Tình nguyện Đông - Xuân.',
  },
  {
    id: 'bcn-2627-9',
    name: 'Nguyễn Anh Tú',
    role: 'Trưởng Ban Nhân Sự (Co-Founder)',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Nhân Sự',
    isFounder: true,
    bio: 'Co-Founder CLB; phụ trách gây quỹ, đối ngoại nhà tài trợ, nhân sự và hậu cần minh bạch.',
  },
  {
    id: 'bcn-2627-10',
    name: 'Võ Đình Khoa',
    role: 'Trưởng Ban Truyền Thông',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    bio: 'Định hướng truyền thông đa kênh, ấn phẩm thiết kế và lan tỏa hình ảnh TechTonic.',
  },

  // ─── Nhiệm kỳ 2025 - 2026 ───
  {
    id: 'bcn-2526-1',
    name: 'Phan Nhật Minh Anh',
    role: 'Chủ nhiệm CLB',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Chủ Nhiệm',
    bio: 'Sinh viên năm 4 — Chủ nhiệm CLB TechTonic nhiệm kỳ 2025 - 2026.',
  },
  {
    id: 'bcn-2526-2',
    name: 'Đặng Nguyễn Quốc Bảo',
    role: 'Phó Chủ nhiệm CLB',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Chủ Nhiệm',
    bio: 'Phó Chủ nhiệm điều phối hoạt động học thuật và phát triển cộng đồng CLB.',
  },
  {
    id: 'bcn-2526-3',
    name: 'Nguyễn Văn Quang',
    role: 'Phó Chủ nhiệm CLB (Co-Founder)',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Chủ Nhiệm',
    isFounder: true,
    bio: 'Co-Founder & Cựu Chủ nhiệm sáng lập, tiếp tục cố vấn điều hành trong nhiệm kỳ 2025 - 2026.',
  },
  {
    id: 'bcn-2526-4',
    name: 'Lê Thị Nhung Nguyệt',
    role: 'Trưởng Ban Chuyên Môn',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Chuyên Môn',
    bio: 'Điều phối chuyên môn FE, BE, AI & Data và hoạt động chia sẻ CSLT & CSDL.',
  },
  {
    id: 'bcn-2526-5',
    name: 'Trương Thị Lan',
    role: 'Phó Ban Chuyên Môn',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Chuyên Môn',
    bio: 'Phối hợp quản lý dự án nội bộ và hỗ trợ đào tạo thành viên chuyên môn.',
  },
  {
    id: 'bcn-2526-6',
    name: 'Nguyễn Anh Tú',
    role: 'Trưởng Ban Sự Kiện (Co-Founder)',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Sự Kiện',
    isFounder: true,
    bio: 'Tổ chức chuỗi sự kiện TechXplore, Mentor - Mentee, Tech Threads và TechWare.',
  },
  {
    id: 'bcn-2526-7',
    name: 'Nguyễn Thị Kim Phượng',
    role: 'Trưởng Ban Nhân Sự (Co-Founder)',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Nhân Sự',
    isFounder: true,
    bio: 'Quản lý hồ sơ thành viên, tài chính quỹ và kết nối đối tác tài trợ.',
  },
  {
    id: 'bcn-2526-8',
    name: 'Võ Đình Khoa',
    role: 'Trưởng Ban Truyền Thông',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Truyền Thông',
    bio: 'Phát triển nội dung sáng tạo, media recap và chiến dịch truyền thông sự kiện.',
  },

  // ─── Nhiệm kỳ 2024 - 2025 (Sáng lập) ───
  {
    id: 'bcn-2425-1',
    name: 'Nguyễn Văn Quang',
    role: 'Chủ nhiệm CLB (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Chủ Nhiệm',
    isFounder: true,
    bio: 'Co-Founder, Chủ nhiệm đầu tiên đặt nền móng xây dựng CLB TechTonic tại DUE.',
  },
  {
    id: 'bcn-2425-2',
    name: 'Đinh Sỹ Quốc Doanh',
    role: 'Phó Chủ nhiệm & Trưởng Ban Chuyên Môn (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Chuyên Môn',
    isFounder: true,
    bio: 'Co-Founder, Mentor chuyên môn BE mùa đầu tiên; đạt Giải Khuyến Khích Olympic Tin học SV VN lần thứ 34.',
  },
  {
    id: 'bcn-2425-3',
    name: 'Nguyễn Đình Khoa',
    role: 'Phó Ban Chuyên Môn (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Chuyên Môn',
    isFounder: true,
    bio: 'Co-Founder, đồng xây dựng chương trình đào tạo CSLT, CSDL và dự án học thuật.',
  },
  {
    id: 'bcn-2425-4',
    name: 'Nguyễn Anh Tú',
    role: 'Phó Chủ nhiệm & Trưởng Ban Sự Kiện (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Sự Kiện',
    isFounder: true,
    bio: 'Co-Founder, dẫn dắt Ban Sự Kiện tổ chức Mentor - Mentee và TechWare mùa đầu tiên.',
  },
  {
    id: 'bcn-2425-5',
    name: 'Nguyễn Thị Kim Phượng',
    role: 'Phó Chủ nhiệm & Trưởng Ban Nhân Sự (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Nhân Sự',
    isFounder: true,
    bio: 'Co-Founder, xây dựng quy trình nhân sự, hậu cần và gây quỹ cho CLB.',
  },
  {
    id: 'bcn-2425-6',
    name: 'Lê Minh Thư',
    role: 'Phó Ban Nhân Sự (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Nhân Sự',
    isFounder: true,
    bio: 'Co-Founder, phụ trách quản lý thành viên và kết nối đối ngoại.',
  },
  {
    id: 'bcn-2425-7',
    name: 'Phạm Bảo Hân',
    role: 'Phó Chủ nhiệm & Trưởng Ban Truyền Thông (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Truyền Thông',
    isFounder: true,
    bio: 'Co-Founder, xây dựng bộ nhận diện và các kênh truyền thông chính thức của CLB.',
  },
  {
    id: 'bcn-2425-8',
    name: 'Nguyễn Thị Ánh Tuyết',
    role: 'Phó Ban Truyền Thông (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Truyền Thông',
    isFounder: true,
    bio: 'Co-Founder, đồng kiến tạo nội dung và hình ảnh truyền thông trong giai đoạn ra mắt.',
  },
];

export const EXHIBIT_ITEMS_SEED: ExhibitItem[] = [
  {
    id: 'ex-1',
    title: 'Olympic Tin Học Sinh Viên Việt Nam Lần Thứ 34',
    category: 'trophy',
    year: '2025',
    highlight: 'Khối Chuyên Tin • Giải Khuyến Khích',
    description:
      'Dấu ấn thi đấu học thuật tiêu biểu được ghi nhận tại Olympic Tin học Sinh viên Việt Nam lần thứ 34 — Khối Chuyên Tin (Đinh Sỹ Quốc Doanh, lớp 48K14.2, Co-Founder & Mentor Back-end).',
    bullets: [
      'Kỳ thi: Olympic Tin học Sinh viên Việt Nam lần thứ 34 — Khối Chuyên Tin',
      'Thành tích: Giải Khuyến Khích',
      'Đại diện tiêu biểu: Đinh Sỹ Quốc Doanh (48K14.2 — Co-Founder CLB TechTonic)',
    ],
  },
  {
    id: 'ex-2',
    title: 'Chứng Nhận Ra Mắt Chính Thức CLB TechTonic',
    category: 'certificate',
    year: '09/04/2025',
    highlight: 'Hội Sinh Viên ĐH Kinh Tế - ĐH Đà Nẵng',
    description:
      'Câu lạc bộ TechTonic chính thức ra mắt trực thuộc Hội Sinh viên Trường Đại học Kinh tế - Đại học Đà Nẵng với tôn chỉ "Dream it - Code it", hướng tới môi trường học thuật công nghệ chuyên sâu và chân thành.',
    bullets: [
      'Đơn vị chủ quản: Hội Sinh viên Trường Đại học Kinh tế - Đại học Đà Nẵng',
      '8 Nhà sáng lập (Co-Founders) khởi xướng từ 01/07/2024',
      'Cơ cấu gồm 3 Quản lý BCN, 4 Ban chức năng (27 thành viên), Cố vấn học thuật & 45+ Thành viên tự do',
    ],
  },
  {
    id: 'ex-3',
    title: 'Hệ Sinh Thái Chuyên Môn FE • BE • AI & Data',
    category: 'trophy',
    year: '05/2025',
    highlight: '20+ Dự Án & Thi Đấu ICPC-OLP / NCKH',
    description:
      'Các nhóm chuyên môn Front-end, Back-end, AI & Data cùng Product Team duy trì sinh hoạt học thuật hằng tuần, rèn luyện kỹ năng lập trình qua dự án thực tế và tham gia ICPC-OLP, NCKH, Hackathon.',
    bullets: [
      '3 mảng chuyên môn cốt lõi: Front-end, Back-end, AI & Data',
      'Đội dự án Product Team báo cáo tiến độ định kỳ & rèn kỹ năng thuyết trình',
      'Lớp chia sẻ Cơ sở lập trình (CSLT), Cơ sở dữ liệu (CSDL) và Người trong ngành MIS',
    ],
  },
  {
    id: 'ex-4',
    title: 'Dấu Ấn Phát Triển & Hợp Tác Doanh Nghiệp',
    category: 'trophy',
    year: '2024 - 2026',
    highlight: '10+ Giải Thưởng • 100+ Thành Viên',
    description:
      'Sau hơn 2 năm hoạt động, TechTonic Club quy tụ hơn 100 thành viên, thực hiện hơn 20 dự án, gặt hái trên 10 giải thưởng và đồng hành cùng các đối tác công nghệ như VTC Academy và MGM Technology.',
    metrics: CLUB_PROFILE.metrics,
    bullets: [
      'Đối tác đồng hành: VTC Academy, MGM Technology',
      'Tinh thần cốt lõi: Study Hard - Play Harder',
      '7 Giá trị cốt lõi: Chia sẻ, Tương trợ, Chân thành, Tôn trọng, Trách nhiệm, Đổi mới, Vui vẻ',
    ],
  },
];

export const TIMELINE_MILESTONES_SEED: TimelineMilestone[] = [
  {
    id: 'tl-1',
    year: '01/07/2024',
    title: 'Hình Thành Ý Tưởng',
    description:
      'Ý tưởng về môi trường học thuật công nghệ tại DUE được hình thành và biến thành hành động thực tế.',
    highlights: ['8 Co-Founders khởi xướng'],
  },
  {
    id: 'tl-2',
    year: '09/2024',
    title: 'Mentor - Mentee Mùa 1',
    description:
      'Tổ chức chương trình Mentor - Mentee (From Us To You) mùa đầu tiên cho tân sinh viên.',
    highlights: ['Định hướng sinh viên năm 1-2'],
  },
  {
    id: 'tl-3',
    year: '04/2025',
    title: 'TechWare Mùa Đầu Tiên',
    description:
      'Đưa Dev, BA, Tester, UX và IT Support vào thử thách Team Bonding thực tế.',
    highlights: ['Study Hard - Play Harder'],
  },
  {
    id: 'tl-4',
    year: '09/04/2025',
    title: 'Chính Thức Ra Mắt CLB',
    description:
      'CLB TechTonic chính thức ra mắt trực thuộc Hội Sinh viên Trường ĐH Kinh tế - ĐH Đà Nẵng.',
    highlights: ['Dream it - Code it'],
  },
  {
    id: 'tl-5',
    year: '05/2025',
    title: 'Ra Mắt FE, BE, AI & Data',
    description:
      'Chính thức vận hành các chuyên môn sâu Front-end, Back-end và AI & Data hằng tuần.',
    highlights: ['Product Team & Học thuật'],
  },
];

export const ACTIVITY_HIGHLIGHTS_SEED: ActivityHighlight[] = [
  {
    id: 'act-1',
    title: 'Mentor - Mentee (From Us To You)',
    tag: 'SỰ KIỆN MỞ ĐẦU',
    year: 'Định kỳ mỗi nhiệm kỳ',
    color: '#38bdf8',
    summary:
      'Định hướng phát triển cá nhân cho sinh viên năm 1–2 DUE có đam mê CNTT và giới thiệu TechTonic trước đợt tuyển.',
  },
  {
    id: 'act-2',
    title: 'Tuyển Thành Viên TechXplore',
    tag: 'TUYỂN THÀNH VIÊN',
    year: 'Thường niên',
    color: '#00F0FF',
    summary:
      'Tuyển Thành viên tự do (Vòng đơn, Phỏng vấn) và BCN (thêm Training & Thực tập), không thu phí thành viên.',
  },
  {
    id: 'act-3',
    title: 'Tech Threads & Tình Nguyện Đông - Xuân',
    tag: 'KẾT NỐI NỘI BỘ',
    year: 'Hằng năm',
    color: '#60a5fa',
    summary:
      'Chào đón tân thành viên qua Tech Threads và lan tỏa giá trị cộng đồng sâu sắc với Tình nguyện Đông - Xuân.',
  },
  {
    id: 'act-4',
    title: 'Team Bonding - TechWare',
    tag: 'ĐỘI NHÓM & THỬ THÁCH',
    year: 'Trước mỗi nhiệm kỳ',
    color: '#fbbf24',
    summary:
      'Thử thách phối hợp vai trò Dev, BA, Tester, UX, IT Support giúp gắn kết thành viên và cựu thành viên CLB.',
  },
  {
    id: 'act-5',
    title: 'Người Trong Ngành MIS & Chia Sẻ CSLT/CSDL',
    tag: 'HỌC THUẬT CHUYÊN SÂU',
    year: 'Hằng tuần',
    color: '#34d399',
    summary:
      'Talkshow giao lưu nghề nghiệp AI, Chatbot, Data, Testing cùng lớp học nội bộ Python, BA, CSDL và Web.',
  },
  {
    id: 'act-6',
    title: 'Happy Hour & Kiện Toàn CLB',
    tag: 'VĂN HÓA & TỔNG KẾT',
    year: 'Hằng tháng / Cuối nhiệm kỳ',
    color: '#a78bfa',
    summary:
      'Không gian giao lưu Happy Hour hằng tháng và lễ Kiện toàn tổng kết, chuyển giao Ban Chủ Nhiệm nhiệm kỳ mới.',
  },
];

export const GUESTBOOK_ENTRIES_SEED: GuestbookEntry[] = [
  {
    id: 'gb-1',
    author: 'Đinh Sỹ Quốc Doanh',
    roleOrAffiliation: 'Co-Founder • Mentor Back-end',
    message:
      'Dream it - Code it! Hy vọng phòng truyền thống 3D này sẽ lưu giữ mãi tinh thần chia sẻ, tương trợ và nhiệt huyết của các thế hệ TechTonic DUE.',
    timestamp: '2025-05-12',
  },
  {
    id: 'gb-2',
    author: 'Phan Nhật Minh Anh',
    roleOrAffiliation: 'Chủ nhiệm CLB Nhiệm kỳ 2025 - 2026',
    message:
      'Tự hào được đồng hành cùng đại gia đình TechTonic — Study Hard, Play Harder và cùng nhau tạo ra thật nhiều dự án giá trị!',
    timestamp: '2025-10-18',
  },
  {
    id: 'gb-3',
    author: 'Hồ Văn Trường',
    roleOrAffiliation: 'Trưởng Ban Chuyên Môn 2026 - 2027',
    message:
      'Chúc các bạn thành viên mới luôn giữ vững ngọn lửa đam mê học thuật ở FE, BE, AI & Data và tự tin chinh phục các kỳ thi ICPC-OLP, NCKH!',
    timestamp: '2026-04-09',
  },
];

export const TELEPORT_ZONES: TeleportZone[] = [
  {
    id: 'entrance',
    label: 'Hành Lang Lối Vào',
    shortLabel: 'Lối vào',
    description: 'Điểm khởi đầu bước vào phòng truyền thống TechTonic Club (DUE Đà Nẵng).',
    position: [0, 1.4, 13.5],
    lookAt: [0, 2.2, -18],
  },
  {
    id: 'center-wall',
    label: 'Vách Tâm Điểm',
    shortLabel: 'Sứ mệnh',
    description: 'Slogan "Dream it - Code it", Tầm nhìn, Sứ mệnh và 7 Giá trị cốt lõi.',
    position: [-0.5, 1.4, -10.2],
    lookAt: [-0.5, 3.2, -18.4],
  },
  {
    id: 'central-island',
    label: 'Đảo Vinh Danh 360°',
    shortLabel: 'Đảo Cúp',
    description: '4 tủ kính trưng bày giải Olympic Tin học, chứng nhận ra mắt và dấu ấn dự án.',
    position: [0, 1.4, 1.2],
    lookAt: [0, 1.5, -5],
  },
  {
    id: 'timeline-gallery',
    label: 'Dòng Thời Gian & Hoạt Động',
    shortLabel: 'Lịch sử',
    description: 'Cột mốc 07/2024 – 05/2025 và chuỗi 6 sự kiện trọng tâm mỗi nhiệm kỳ.',
    position: [-4.8, 1.4, -1.2],
    lookAt: [-16.5, 3.0, -1.5],
  },
  {
    id: 'club-shirt',
    label: 'Áo CLB & Ban Chủ Nhiệm',
    shortLabel: 'Áo CLB',
    description: 'Áo CLB 3D trên mannequin, cơ cấu 4 ban và sinh hoạt chuyên môn hằng tuần.',
    position: [5.0, 1.4, -0.5],
    lookAt: [16.0, 2.7, -0.5],
  },
  {
    id: 'interactive-corner',
    label: 'Góc Truyền Thông & Lưu Bút',
    shortLabel: 'Lưu bút',
    description: 'Màn hình trình chiếu TechTonic và Sổ lưu bút mở trên bục đọc.',
    position: [3.4, 1.4, -10.2],
    lookAt: [6.4, 1.9, -15.2],
  },
  {
    id: 'partners-wall',
    label: 'Đối Tác & Kết Nối',
    shortLabel: 'Đối tác',
    description: 'Đối tác VTC Academy, MGM Technology, địa chỉ và kênh kết nối chính thức.',
    position: [-6.5, 1.4, 1.0],
    lookAt: [-9.6, 2.9, 8.05],
  },
  {
    id: 'testimonials-wall',
    label: 'Cảm Nhận Thành Viên',
    shortLabel: 'Cảm nhận',
    description: 'Chia sẻ từ Co-Founders, Chủ nhiệm CLB và Mentor chuyên môn TechTonic.',
    position: [6.5, 1.4, 1.0],
    lookAt: [9.6, 2.9, 8.05],
  },
];
