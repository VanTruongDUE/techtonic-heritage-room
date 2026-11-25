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
  missionKeywords: ['Học thuật', 'Kết nối', 'Phát triển', 'Trải nghiệm', 'Chân thành'],
  benefits: [
    {
      title: 'Anh chị tốt',
      desc: 'Kết nối thế hệ trước & sau, hỗ trợ định hướng phát triển nghề nghiệp nhanh và đúng hướng.',
    },
    {
      title: 'Cơ sở học thuật tốt',
      desc: 'Cung cấp tài liệu, phương pháp, khóa chia sẻ và lộ trình thực hành dự án thực tế.',
    },
    {
      title: 'Bạn bè cùng chí hướng',
      desc: 'Đồng hành cùng cộng đồng sinh viên yêu công nghệ, sẵn sàng sẻ chia và phát triển.',
    },
  ],
  metrics: [
    { label: 'Giải thưởng', value: '10+' },
    { label: 'Thành viên', value: '100+' },
    { label: 'Dự án', value: '20+' },
    { label: 'Năm hoạt động', value: '2+' },
  ],
  coreValues: [
    {
      name: 'Tinh thần chia sẻ',
      note: 'Hiểu — Chủ động chia sẻ khó khăn lẫn thành công để gắn kết.',
    },
    {
      name: 'Sự tương trợ',
      note: 'Hiểu rồi mới giúp được — Sẵn sàng hỗ trợ kiến thức & kỹ năng.',
    },
    {
      name: 'Sự chân thành',
      note: 'Hiểu và giúp bằng sự chân thành — Cùng tiến bộ lâu dài.',
    },
    {
      name: 'Sự tôn trọng',
      note: 'Trân trọng đóng góp của cá nhân, tập thể & người đi trước.',
    },
    {
      name: 'Sự trách nhiệm',
      note: 'Ý thức với bản thân, CLB và cộng đồng đang tham gia.',
    },
    {
      name: 'Sự đổi mới',
      note: 'Cơ chế phản chứng — Dám thử, dám sai, dám cải tiến.',
    },
    {
      name: 'Sự vui vẻ',
      note: 'Study Hard - Play Harder — Cân bằng học tập & đời sống tinh thần.',
    },
  ],
  partners: [
    { name: 'VTC Academy', logo: '/assets/images/achievement/vtc_academy.webp' },
    { name: 'MGM Technology', logo: '/assets/images/achievement/mgm_technology.webp' },
  ],
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
  recruitmentSummary: {
    steps: [
      '1. Chinh phục TechXplore (Vòng đơn → Phỏng vấn; riêng BCN thêm Training & Thực tập)',
      '2. Tham gia buổi giới thiệu gặp gỡ thành viên & ban chuyên môn',
      '3. Bắt đầu coding qua các buổi học thuật hằng tuần & Product Team',
    ],
    faqHighlights: [
      'Đối tượng: Sinh viên năm 1–2 DUE Đà Nẵng (ưu tiên khối ngành có yếu tố CNTT)',
      'Không yêu cầu biết code trước khi đăng ký • Không thu phí thành viên',
    ],
  },
  testimonials: [
    {
      name: 'Đinh Sỹ Quốc Doanh',
      role: 'Cựu SV 48K14.2 • Co-Founder • Trưởng Ban Chuyên Môn (2024–2025) • Mentor BE mùa 1 • Giải KK Olympic Tin học SV VN lần 34',
    },
    {
      name: 'Phan Nhật Minh Anh',
      role: 'Sinh viên năm 4 • Chủ nhiệm CLB TechTonic nhiệm kỳ 2025–2026',
    },
    {
      name: 'Nguyễn Hoàng',
      role: 'Cựu sinh viên • Mentor Chuyên môn Front-end CLB TechTonic nhiệm kỳ 2025–2026',
    },
    {
      name: 'Hồ Văn Trường',
      role: 'Sinh viên năm 3 • Trưởng Ban Chuyên Môn CLB TechTonic nhiệm kỳ 2026–2027',
    },
  ],
  weeklyTracks: [
    {
      title: 'Chuyên môn Front-end (FE)',
      schedule: 'Hằng tuần',
      desc: 'Xây dựng giao diện và trải nghiệm người dùng trực quan, hiện đại cho website và ứng dụng với công nghệ Front-end phổ biến.',
    },
    {
      title: 'Chuyên môn Back-end (BE)',
      schedule: 'Hằng tuần',
      desc: 'Xử lý hệ thống, API, cơ sở dữ liệu và logic vận hành phía máy chủ qua các buổi học và dự án thực tế.',
    },
    {
      title: 'Chuyên môn AI & Data',
      schedule: 'Hằng tuần',
      desc: 'Xử lý dữ liệu, phân tích dữ liệu, Machine Learning và xu hướng ứng dụng AI vào bài toán thực tế.',
    },
    {
      title: 'Chia sẻ CSLT & CSDL',
      schedule: 'Hằng tuần',
      desc: 'Củng cố nền tảng Cơ sở lập trình (CSLT) và Cơ sở dữ liệu (CSDL) theo hướng dễ hiểu, thực tiễn.',
    },
    {
      title: 'Product Team & Happy Hour',
      schedule: 'Định kỳ & Tháng',
      desc: 'Báo cáo tiến độ đội dự án, góp ý chuyên môn, rèn thuyết trình; kết hợp Happy Hour gắn kết đội ngũ hằng tháng.',
    },
  ],
  departmentStructure: [
    {
      name: 'Ban Chuyên Môn (8 TV)',
      summary: 'Đầu mối học thuật: lộ trình khóa học, biên soạn tài liệu, quản lý dự án FE/BE/AI & Data, khuyến khích thi ICPC-OLP, NCKH.',
    },
    {
      name: 'Ban Sự Kiện (7 TV)',
      summary: 'Ý tưởng, kịch bản, timeline, âm thanh/ánh sáng và điều phối Mentor-Mentee, TechXplore, TechWare, Kiện toàn.',
    },
    {
      name: 'Ban Truyền Thông (9 TV)',
      summary: 'Nghiên cứu insight, sáng tạo nội dung, thiết kế ấn phẩm, chụp ảnh/quay phim recap và vận hành kênh truyền thông.',
    },
    {
      name: 'Ban Nhân Sự (3 TV)',
      summary: 'Gây quỹ, proposal/đối ngoại nhà tài trợ, quản lý hồ sơ thành viên, tài chính thu chi minh bạch và hậu cần.',
    },
  ],
};

export const EXECUTIVE_MEMBERS_SEED: ExecutiveMember[] = [
  // ─── Nhiệm kỳ 2026 - 2027 (Nhiệm kỳ hiện tại — 29 thành viên, 5 Ban) ───
  {
    id: 'bcn-2627-1',
    name: 'Đặng Nguyên Quốc Bảo',
    role: 'Chủ nhiệm CLB',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chủ Nhiệm',
    avatar: 'https://res.cloudinary.com/jb6ttotp/image/upload/v1789064855/dang-nguyen-quoc-bao.png',
    avatarPosition: 'center 38%',
    bio: 'Điều hành chiến lược phát triển và đại diện toàn câu lạc bộ nhiệm kỳ 2026 - 2027.',
  },
  {
    id: 'bcn-2627-2',
    name: 'Nguyễn Thị Phương Thảo',
    role: 'Phó Chủ nhiệm',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chủ Nhiệm',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789064773/Nguy%E1%BB%85n_Th%E1%BB%8B_Ph%C6%B0%C6%A1ng_Th%E1%BA%A3o.png',
    bio: 'Phó Chủ nhiệm điều hành hoạt động nội bộ, chương trình học thuật và kết nối thành viên.',
  },
  {
    id: 'bcn-2627-3',
    name: 'Ngô Phương Thảo',
    role: 'Phó Chủ nhiệm',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chủ Nhiệm',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789064705/Ng%C3%B4_Ph%C6%B0%C6%A1ng_Th%E1%BA%A3o.png',
    bio: 'Phó Chủ nhiệm phụ trách vận hành, nhân sự và triển khai chuỗi sự kiện nhiệm kỳ 2026 - 2027.',
  },

  // Ban Chuyên Môn (7 TV)
  {
    id: 'bcn-2627-4',
    name: 'Hồ Văn Trường',
    role: 'Trưởng ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785817600/H%E1%BB%93_V%C4%83n_Tr%C6%B0%E1%BB%9Dng_nlrxqc.png',
    bio: 'Trưởng Ban Chuyên Môn; lập lộ trình khóa học, quản lý dự án CNTT nội bộ (FE, BE, AI & Data).',
  },
  {
    id: 'bcn-2627-5',
    name: 'Đinh Tấn Khoa',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1786544925/%C4%90inh_T%E1%BA%A5n_Khoa_fg66bg.png',
    bio: 'Phó Ban Chuyên Môn; hỗ trợ điều phối học thuật, biên soạn tài liệu và hướng dẫn dự án.',
  },
  {
    id: 'bcn-2627-6',
    name: 'Ngô Thị Ngọc Huyền',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1789062492/Ng%C3%B4_Th%E1%BB%8B_Ng%E1%BB%8Dc_Huy%E1%BB%81n_wjuxvh.png',
    bio: 'Phó Ban Chuyên Môn; đồng điều phối chất lượng chuyên môn và kết nối nhóm học tập hằng tuần.',
  },
  {
    id: 'bcn-2627-7',
    name: 'Trần Thị Thanh Tâm',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1786544841/Tr%E1%BA%A7n_Th%E1%BB%8B_Thanh_T%C3%A2m_h3iqu1.png',
    bio: 'Phó Ban Chuyên Môn; phụ trách tổ chức hoạt động học thuật và đánh giá tiến độ đầu ra chuyên môn.',
  },
  {
    id: 'bcn-2627-11',
    name: 'Nguyễn Lê Anh Hoàng',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785817600/Nguy%E1%BB%85n_L%C3%AA_Anh_Ho%C3%A0ng_ymbmzl.png',
    bio: 'Thành viên Ban Chuyên Môn; đồng hành triển khai đào tạo, chia sẻ kiến thức và dự án học thuật.',
  },
  {
    id: 'bcn-2627-12',
    name: 'Trương Thị Lan',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785816310/Tr%C6%B0%C6%A1ng_Th%E1%BB%8B_Lan_vvjynt.png',
    bio: 'Thành viên Ban Chuyên Môn (Cựu Phó Ban 25–26); cố vấn và hỗ trợ chuyên môn thực chiến.',
  },
  {
    id: 'bcn-2627-13',
    name: 'Lê Thị Nhung Nguyệt',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Chuyên Môn',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785816321/L%C3%AA_Th%E1%BB%8B_Nhung_Nguy%E1%BB%87t_wjtzqq.png',
    bio: 'Thành viên Ban Chuyên Môn (Cựu Trưởng Ban 25–26); cố vấn chuyên môn FE, BE, AI & Data.',
  },

  // Ban Sự Kiện (7 TV)
  {
    id: 'bcn-2627-8',
    name: 'Đoàn Ngọc Bảo Trân',
    role: 'Trưởng ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785833720/%C4%90o%C3%A0n_Ng%E1%BB%8Dc_B%E1%BA%A3o_Tr%C3%A2n_biye8o.png',
    bio: 'Trưởng Ban Sự Kiện; chủ trì ý tưởng, kịch bản và điều phối TechXplore, TechWare, Tình nguyện.',
  },
  {
    id: 'bcn-2627-14',
    name: 'Nguyễn Ngọc Nhật',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785833720/Nguy%E1%BB%85n_Ng%E1%BB%8Dc_Nh%E1%BA%ADt_wvbxsh.png',
    bio: 'Phó Ban Sự Kiện; hỗ trợ điều phối vận hành, âm thanh ánh sáng và hậu trường chương trình.',
  },
  {
    id: 'bcn-2627-15',
    name: 'Tô Nguyễn Quốc Bảo',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1786549679/T%C3%B4_Nguy%E1%BB%85n_Qu%E1%BB%91c_B%E1%BA%A3o_ewkhlv.png',
    bio: 'Phó Ban Sự Kiện; xây dựng timeline kịch bản và kết nối điều phối chuỗi hoạt động gắn kết.',
  },
  {
    id: 'bcn-2627-16',
    name: 'Phạm Nhật Hạ',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1786549680/Ph%E1%BA%A1m_Nh%E1%BA%ADt_H%E1%BA%A1_sdblbc.png',
    bio: 'Phó Ban Sự Kiện; phụ trách nội dung trải nghiệm, Mentor - Mentee và gắn kết tân sinh viên.',
  },
  {
    id: 'bcn-2627-17',
    name: 'Phạm Ngọc Yến Nhi',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785833722/Ph%E1%BA%A1m_Ng%E1%BB%8Dc_Y%E1%BA%BFn_Nhi_uhyzbr.png',
    bio: 'Phó Ban Sự Kiện; điều phối tổ chức sự kiện và kết nối lực lượng cộng tác viên CLB.',
  },
  {
    id: 'bcn-2627-18',
    name: 'Trần Tôn Phương Thảo',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    bio: 'Thành viên Ban Sự Kiện; tham gia lập kế hoạch và triển khai trực tiếp các sự kiện CLB.',
  },
  {
    id: 'bcn-2627-19',
    name: 'Trần Nguyễn Minh Anh',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Sự Kiện',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789137699/ChatGPT_Image_21_41_31_11_thg_9_2026.png',
    avatarPosition: 'center 13%',
    bio: 'Thành viên Ban Sự Kiện; hỗ trợ tổ chức, trò chơi kết nối và hậu trường hoạt động CLB.',
  },

  // Ban Nhân Sự (3 TV)
  {
    id: 'bcn-2627-9',
    name: 'Nguyễn Anh Tú',
    role: 'Trưởng ban (Co-Founder)',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Nhân Sự',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1786544985/Nguy%E1%BB%85n_Anh_T%C3%BA_d8rm4i.png',
    isFounder: true,
    bio: 'Co-Founder & Trưởng Ban Nhân Sự; phụ trách gây quỹ, đối ngoại tài trợ, nhân sự và hậu cần.',
  },
  {
    id: 'bcn-2627-20',
    name: 'Phạm Khánh Ngân',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Nhân Sự',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1785839866/Ph%E1%BA%A1m_Kh%C3%A1nh_Ng%C3%A2n_jh0c9p.png',
    bio: 'Phó Ban Nhân Sự; quản lý hồ sơ thành viên, theo dõi quỹ và điều phối công tác hậu cần.',
  },
  {
    id: 'bcn-2627-21',
    name: 'Phan Thị Quỳnh Chi',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Nhân Sự',
    avatar:
      'https://res.cloudinary.com/dggsvq2tw/image/upload/v1786549625/Phan_Th%E1%BB%8B_Qu%E1%BB%B3nh_Chi_ikcqha.png',
    bio: 'Thành viên Ban Nhân Sự; đồng hành quản trị thành viên, hậu cần và chăm sóc nội bộ.',
  },

  // Ban Truyền Thông (9 TV)
  {
    id: 'bcn-2627-10',
    name: 'Võ Đình Khoa',
    role: 'Trưởng ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789085239/%C4%90%C3%ACnh_Khoa.png',
    avatarPosition: 'center -8px',
    bio: 'Trưởng Ban Truyền Thông; định hướng chiến dịch đa kênh, thiết kế ấn phẩm và hình ảnh CLB.',
  },
  {
    id: 'bcn-2627-22',
    name: 'Vũ Thị Huyền Trang',
    role: 'Phó ban',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789119871/ChatGPT_Image_16_43_43_11_thg_9_2026.png',
    avatarPosition: 'center 20%',
    bio: 'Phó Ban Truyền Thông; điều phối sản xuất nội dung, biên tập bài đăng và chất lượng media.',
  },
  {
    id: 'bcn-2627-23',
    name: 'Phạm Thị Nhật Uyên',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789197005/ChatGPT_Image_14_09_39_12_thg_9_2026.png',
    avatarPosition: 'center 15%',
    bio: 'Thành viên Ban Truyền Thông; sáng tạo nội dung, viết bài và truyền thông sự kiện CLB.',
  },
  {
    id: 'bcn-2627-24',
    name: 'Nguyễn Huỳnh Minh Ánh',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789120336/ChatGPT_Image_16_52_06_11_thg_9_2026.png',
    avatarPosition: 'center 20%',
    bio: 'Thành viên Ban Truyền Thông; thiết kế ấn phẩm truyền thông và hình ảnh thương hiệu CLB.',
  },
  {
    id: 'bcn-2627-25',
    name: 'Phan Thị Yến Chi',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789122388/ChatGPT_Image_17_26_18_11_thg_9_2026.png',
    avatarPosition: 'center 20%',
    bio: 'Thành viên Ban Truyền Thông; phát triển nội dung số và truyền thông hoạt động học thuật.',
  },
  {
    id: 'bcn-2627-26',
    name: 'Nguyễn Nữ Vũ Hoàng',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789125427/ChatGPT_Image_18_16_54_11_thg_9_2026.png',
    avatarPosition: 'center 13%',
    bio: 'Thành viên Ban Truyền Thông; chụp ảnh, quay phim recap và sản xuất tư liệu sự kiện.',
  },
  {
    id: 'bcn-2627-27',
    name: 'Lê Văn Lợi',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789132816/ChatGPT_Image_20_19_57_11_thg_9_2026.png',
    avatarPosition: 'center 15%',
    bio: 'Thành viên Ban Truyền Thông; dựng video recap và truyền thông đa nền tảng cho CLB.',
  },
  {
    id: 'bcn-2627-28',
    name: 'Phan Nhật Đài Trang',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789137376/ChatGPT_Image_21_35_48_11_thg_9_2026.png',
    avatarPosition: 'center 15%',
    bio: 'Thành viên Ban Truyền Thông; thiết kế đồ họa và truyền tải câu chuyện thành viên CLB.',
  },
  {
    id: 'bcn-2627-29',
    name: 'Phan Trần Hạ Giang',
    role: 'Thành viên',
    term: 'Nhiệm kỳ 2026 - 2027',
    department: 'Ban Truyền Thông',
    avatar:
      'https://res.cloudinary.com/jb6ttotp/image/upload/v1789125187/ChatGPT_Image_18_12_59_11_thg_9_2026.png',
    avatarPosition: 'center 20%',
    bio: 'Thành viên Ban Truyền Thông; vận hành kênh mạng xã hội và lan tỏa giá trị TechTonic.',
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
    avatar: '/assets/images/founders/Nguyen_Van_Quang.jpg',
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
    avatar: '/assets/images/founders/Nguyen_Anh_Tu.jpg',
    isFounder: true,
    bio: 'Tổ chức chuỗi sự kiện TechXplore, Mentor - Mentee, Tech Threads và TechWare.',
  },
  {
    id: 'bcn-2526-7',
    name: 'Nguyễn Thị Kim Phượng',
    role: 'Trưởng Ban Nhân Sự (Co-Founder)',
    term: 'Nhiệm kỳ 2025 - 2026',
    department: 'Ban Nhân Sự',
    avatar: '/assets/images/founders/Nguyen_Thi_Kim_Phuong.jpg',
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
    avatar: '/assets/images/founders/Nguyen_Van_Quang.jpg',
    isFounder: true,
    bio: 'Co-Founder, Chủ nhiệm đầu tiên đặt nền móng xây dựng CLB TechTonic tại DUE.',
  },
  {
    id: 'bcn-2425-2',
    name: 'Đinh Sỹ Quốc Doanh',
    role: 'Phó Chủ nhiệm & Trưởng Ban Chuyên Môn (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Chuyên Môn',
    avatar: '/assets/images/founders/Dinh_Sy_Quoc_Doanh.jpg',
    isFounder: true,
    bio: 'Co-Founder, Mentor chuyên môn BE mùa đầu tiên; đạt Giải Khuyến Khích Olympic Tin học SV VN lần thứ 34.',
  },
  {
    id: 'bcn-2425-3',
    name: 'Nguyễn Đình Khoa',
    role: 'Phó Ban Chuyên Môn (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Chuyên Môn',
    avatar: '/assets/images/founders/Nguyen_Dinh_Khoa.jpg',
    isFounder: true,
    bio: 'Co-Founder, đồng xây dựng chương trình đào tạo CSLT, CSDL và dự án học thuật.',
  },
  {
    id: 'bcn-2425-4',
    name: 'Nguyễn Anh Tú',
    role: 'Phó Chủ nhiệm & Trưởng Ban Sự Kiện (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Sự Kiện',
    avatar: '/assets/images/founders/Nguyen_Anh_Tu.jpg',
    isFounder: true,
    bio: 'Co-Founder, dẫn dắt Ban Sự Kiện tổ chức Mentor - Mentee và TechWare mùa đầu tiên.',
  },
  {
    id: 'bcn-2425-5',
    name: 'Nguyễn Thị Kim Phượng',
    role: 'Phó Chủ nhiệm & Trưởng Ban Nhân Sự (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Nhân Sự',
    avatar: '/assets/images/founders/Nguyen_Thi_Kim_Phuong.jpg',
    isFounder: true,
    bio: 'Co-Founder, xây dựng quy trình nhân sự, hậu cần và gây quỹ cho CLB.',
  },
  {
    id: 'bcn-2425-6',
    name: 'Lê Minh Thư',
    role: 'Phó Ban Nhân Sự (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Nhân Sự',
    avatar: '/assets/images/founders/Le_Minh_Thu.jpg',
    isFounder: true,
    bio: 'Co-Founder, phụ trách quản lý thành viên và kết nối đối ngoại.',
  },
  {
    id: 'bcn-2425-7',
    name: 'Phạm Bảo Hân',
    role: 'Phó Chủ nhiệm & Trưởng Ban Truyền Thông (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Truyền Thông',
    avatar: '/assets/images/founders/Pham_Bao_Han.jpg',
    isFounder: true,
    bio: 'Co-Founder, xây dựng bộ nhận diện và các kênh truyền thông chính thức của CLB.',
  },
  {
    id: 'bcn-2425-8',
    name: 'Nguyễn Thị Ánh Tuyết',
    role: 'Phó Ban Truyền Thông (Co-Founder)',
    term: 'Nhiệm kỳ 2024 - 2025',
    department: 'Ban Truyền Thông',
    avatar: '/assets/images/founders/Nguyen_Thi_Anh_Tuyet.jpg',
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
    image: '/assets/images/activity/olp_icpc.webp',
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
    image: '/assets/images/activity/mentor_mentee.webp',
    highlight: 'Hội Sinh Viên ĐH Kinh Tế - ĐH Đà Nẵng',
    description:
      'Câu lạc bộ TechTonic chính thức ra mắt trực thuộc Hội Sinh viên Trường Đại học Kinh tế - Đại học Đà Nẵng với tôn chỉ "Dream it - Code it", hướng tới môi trường học thuật công nghệ chuyên sâu và chân thành.',
    bullets: [
      'Đơn vị chủ quản: Hội Sinh viên Trường Đại học Kinh tế - Đại học Đà Nẵng',
      '8 Nhà sáng lập (Co-Founders) khởi xướng từ 01/07/2024',
      'Cơ cấu gồm 3 Quản lý BCN, 4 Ban chức năng (27 TV), Cố vấn học thuật & 45+ Thành viên tự do',
    ],
  },
  {
    id: 'ex-3',
    title: 'Hệ Sinh Thái Chuyên Môn FE • BE • AI & Data',
    category: 'trophy',
    year: '05/2025',
    image: '/assets/images/activity/cshd.webp',
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
    image: '/assets/images/activity/techware.webp',
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
      'Ý tưởng về môi trường học thuật công nghệ tại DUE được hình thành và chuyển thành hành động thực tế.',
    highlights: ['8 Co-Founders khởi xướng'],
  },
  {
    id: 'tl-2',
    year: '09/2024',
    title: 'Mentor - Mentee Mùa 1',
    description:
      'Tổ chức chương trình Mentor - Mentee (From Us To You) mùa đầu tiên định hướng tân sinh viên.',
    highlights: ['Sinh viên năm 1-2 DUE'],
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
    goal: 'Định hướng phát triển cá nhân cho sinh viên năm 1–2 DUE & giới thiệu TechTonic trước đợt tuyển.',
    audience: 'Tân sinh viên & SV năm 1–2 DUE (ưu tiên ngành có yếu tố CNTT)',
    summary:
      'Chuỗi chương trình gần gũi giữa thành viên CLB và sinh viên ngoài CLB, tập trung giá trị định hướng thực chất.',
  },
  {
    id: 'act-2',
    title: 'Tuyển Thành Viên TechXplore',
    tag: 'TUYỂN THÀNH VIÊN',
    year: 'Thường niên',
    color: '#00F0FF',
    goal: 'Xây dựng đội ngũ Thành viên tự do và Thành viên Ban Chủ Nhiệm cho mỗi nhiệm kỳ.',
    audience: 'SV năm 1–2 DUE (không yêu cầu biết code trước • không thu phí)',
    summary:
      'Thành viên tự do: Vòng đơn → Phỏng vấn. Thành viên BCN: Vòng đơn → Phỏng vấn → Training → Thực tập.',
  },
  {
    id: 'act-3',
    title: 'Tech Threads & Tình Nguyện Đông - Xuân',
    tag: 'KẾT NỐI NỘI BỘ 1 & 2',
    year: 'Hằng năm',
    color: '#60a5fa',
    goal: 'Chào đón tân thành viên (Tech Threads) & gắn kết chiều sâu qua thiện nguyện (Đông - Xuân).',
    audience: 'Thành viên TechTonic & sinh viên ĐH Kinh tế - ĐH Đà Nẵng',
    summary:
      'Lan tỏa tinh thần "Lá lành đùm lá rách" qua gây quỹ và đóng quân thiện nguyện tại địa phương.',
  },
  {
    id: 'act-4',
    title: 'Team Bonding - TechWare',
    tag: 'KẾT NỐI NỘI BỘ 3',
    year: 'Trước mỗi nhiệm kỳ',
    color: '#fbbf24',
    goal: 'Thử thách phối hợp thực chiến giữa các vai trò Dev, BA, Tester, UX và IT Support.',
    audience: 'Thành viên CLB & Cựu thành viên trước một nhiệm kỳ',
    summary:
      'Hoạt động Team Bonding kéo dài có tính ganh đua trực tiếp, rèn tinh thần đồng đội bền chặt.',
  },
  {
    id: 'act-5',
    title: 'Người Trong Ngành MIS & CSLT/CSDL',
    tag: 'HỌC THUẬT CHUYÊN SÂU',
    year: 'Hằng tuần',
    color: '#34d399',
    goal: 'Củng cố nền tảng CSLT, CSDL và kết nối góc nhìn nghề nghiệp thực tế cùng anh chị đi trước.',
    audience: 'Sinh viên DUE yêu thích Python, Web, AI, Chatbot, Data & Testing',
    summary:
      'Lớp chia sẻ nội bộ hằng tuần kết hợp talkshow định hướng chuyên sâu ngành MIS & CNTT.',
  },
  {
    id: 'act-6',
    title: 'Happy Hour & Kiện Toàn CLB',
    tag: 'VĂN HÓA & TỔNG KẾT',
    year: 'Hằng tháng / Cuối kỳ',
    color: '#a78bfa',
    goal: 'Thư giãn gắn kết hằng tháng (Happy Hour) và tổng kết chuyển giao Ban Chủ Nhiệm mới.',
    audience: 'Thành viên CLB, Ban Chủ Nhiệm & Đại diện Hội Sinh viên',
    summary:
      'Cùng nhìn lại hành trình nhiệm kỳ đã qua, chia sẻ câu chuyện và chọn ra BCN nhiệm kỳ kế tiếp.',
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
    description: 'Đường hầm triển lãm dẫn vào phòng truyền thống TechTonic Club (DUE Đà Nẵng).',
    position: [0, 1.4, 25.8],
    lookAt: [0, 2.2, 8.0],
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
    position: [0, 1.55, 2.4],
    lookAt: [0, 1.25, -4.2],
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
    id: 'org-tree',
    label: 'Cây Sơ Đồ Ban Chủ Nhiệm',
    shortLabel: 'Cây BCN',
    description: 'Cây cấu trúc Ban Chủ Nhiệm theo cấp bậc Chủ nhiệm - Phó Chủ nhiệm - 4 Ban.',
    position: [-4.4, 1.55, -6.4],
    lookAt: [-9.6, 2.55, -12.2],
  },
  {
    id: 'club-shirt',
    label: 'Áo CLB & Ban Chủ Nhiệm',
    shortLabel: 'Áo CLB',
    description: 'Áo CLB 3D trên mannequin, cơ cấu 4 ban và sinh hoạt chuyên môn hằng tuần.',
    position: [6.2, 1.45, -7.8],
    lookAt: [13.8, 1.9, -10.4],
  },
  {
    id: 'interactive-corner',
    label: 'Góc Truyền Thông & Lưu Bút',
    shortLabel: 'Lưu bút',
    description: 'Màn hình trình chiếu TechTonic và Sổ lưu bút mở trên bục đọc.',
    position: [4.6, 1.55, -12.7],
    lookAt: [5.9, 1.12, -14.9],
  },
  {
    id: 'partners-wall',
    label: 'Đối Tác & Kết Nối',
    shortLabel: 'Đối tác',
    description: 'Đối tác VTC Academy, MGM Technology, lộ trình TechXplore & kênh liên hệ.',
    position: [-8.5, 1.4, 1.5],
    lookAt: [-12.6, 2.9, 8.05],
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
