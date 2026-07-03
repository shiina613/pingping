// ==========================================================================
// APPLICATION DATA: INITIAL STATE DEFINITIONS
// ==========================================================================

export const DEFAULT_MEMBERS = [
  { id: 'tung', name: 'Tùng', role: 'AI/ML Engineer', skills: 'PyTorch, Computer Vision, CNN, OpenCV, Docker', color: '#3b82f6', avatar: '💻' },
  { id: 'tunganh', name: 'Tùng Anh', role: 'Backend Developer', skills: 'Node.js, Express, MongoDB, Redis, Docker, APIs', color: '#10b981', avatar: '🚀' },
  { id: 'hau', name: 'Hậu', role: 'Data Scientist', skills: 'Python, Pandas, Scikit-Learn, SQL, Data Visualization', color: '#8b5cf6', avatar: '📊' },
  { id: 'tuantran', name: 'Tuấn Trần', role: 'AI/ML Engineer', skills: 'LLMs, NLP, Hugging Face, LangChain, RAG, PyTorch', color: '#f59e0b', avatar: '🧠' },
  { id: 'hung', name: 'Hưng', role: 'Frontend Developer', skills: 'HTML, CSS, JavaScript, React, CSS Grid, Responsive Design', color: '#ec4899', avatar: '🎨' },
  { id: 'duyanh', name: 'Duy Anh', role: 'PM & AI Engineer', skills: 'Project Management, Speech AI, Edge AI, Agile, Git', color: '#06b6d4', avatar: '🦁' },
  { id: 'thach', name: 'Thạch', role: 'IoT Specialist', skills: 'Embedded C, ESP32, IoT Sensors, Firmware, Hardware Prototyping', color: '#ef4444', avatar: '⚙️' }
];

export const COMPETITIONS = [
  {
    id: 'viettel',
    name: 'Viettel AI Race 2026',
    slogan: 'Cuộc đua AI cho kỹ sư Việt Nam',
    organizer: 'Tập đoàn Viettel',
    teamLimit: { min: 1, max: 3 },
    registrationLink: 'https://competition.viettel.vn/',
    gradient: 'var(--c-viettel-grad)',
    glow: 'var(--c-viettel-glow)',
    status: 'Sắp thi Sơ loại',
    topics: [
      'Đề 1: BTS Digital Twin - Tái tạo cấu trúc 3D của trạm BTS từ ảnh chụp drone.',
      'Đề 2: Ontological Reasoning - Xử lý văn bản y tế chuyên sâu từ EHR phát hiện thực thể.',
      'Đề 3: LLM Inference Optimization - Tối ưu suy luận LLM hiệu năng cao trên tài nguyên GPU giới hạn.'
    ],
    prizes: [
      '03 Giải Nhất: 200.000.000 VNĐ / giải (cho mỗi đề thi)',
      '09 Giải Khuyến khích: 20.000.000 VNĐ / giải',
      'Tổng giá trị giải thưởng lên đến 780.000.000 VNĐ'
    ],
    timeline: [
      { label: 'Mở đăng ký thi đấu', date: '2026-06-26T00:00:00+07:00', type: 'registration' },
      { label: 'Vòng sơ loại trực tuyến', date: '2026-07-02T08:00:00+07:00', type: 'registration' },
      { label: 'Hạn chót nộp bài sơ loại', date: '2026-07-30T23:59:00+07:00', type: 'registration' },
      { label: 'Vòng sơ khảo thi tập trung', date: '2026-08-17T09:00:00+07:00', type: 'milestone' },
      { label: 'Vòng chung kết thi tập trung (2 ngày)', date: '2026-09-09T08:00:00+07:00', type: 'final' },
      { label: 'Lễ trao giải chung cuộc', date: '2026-09-11T16:00:00+07:00', type: 'final' }
    ]
  },
  {
    id: 'buildhub',
    name: 'Build@HUB Hackathon 2026',
    slogan: 'Build Beyond Limits - Sân chơi Khởi nghiệp Trẻ',
    organizer: 'HUB Network High School',
    teamLimit: { min: 3, max: 4 },
    registrationLink: 'https://hubnetworkhs.com/build-hub',
    gradient: 'var(--c-buildhub-grad)',
    glow: 'var(--c-buildhub-glow)',
    status: 'Đang thi Sơ khảo',
    topics: [
      'Phát triển sản phẩm ứng dụng các công nghệ tiên phong: AI, IoT, Blockchain.',
      'Giải quyết các vấn đề thiết thực trong công nghiệp, nông nghiệp, y tế, du lịch.',
      'Sản phẩm là sáng tạo mới, nộp pitch deck 12 slides và video thuyết trình < 5 phút.'
    ],
    prizes: [
      'Giải Nhất: 50.000.000 VNĐ tiền mặt (mỗi bảng đấu)',
      'Giải Nhì: 30.000.000 VNĐ tiền mặt',
      'Giải Ba: 20.000.000 VNĐ tiền mặt',
      'Tổng giá trị giải thưởng 200.000.000 VNĐ'
    ],
    timeline: [
      { label: 'Vòng sơ khảo trực tuyến', date: '2026-06-22T08:00:00+07:00', type: 'registration' },
      { label: 'Hạn nộp bài thi sơ khảo', date: '2026-07-19T23:59:00+07:00', type: 'registration' },
      { label: 'Công bố kết quả vào Chung kết', date: '2026-07-29T17:00:00+07:00', type: 'milestone' },
      { label: 'Chung kết 24h Hackathon (Cung Thiếu nhi Hà Nội)', date: '2026-08-15T08:00:00+07:00', type: 'final' }
    ]
  },
  {
    id: 'thucchien',
    name: 'Thực chiến AI 2026',
    slogan: 'Cuộc thi Trí tuệ Nhân tạo đầu tiên trên sóng truyền hình Quốc gia',
    organizer: 'VTV, NDC, NDA & Techcombank',
    teamLimit: { min: 3, max: 3 },
    registrationLink: 'https://thucchien.ai/',
    gradient: 'var(--c-thucchien-grad)',
    glow: 'var(--c-thucchien-glow)',
    status: 'Đang mở đăng ký',
    topics: [
      'Xây dựng mô hình LLM/SLM tiếng Việt quốc gia tối ưu hóa cho cộng đồng.',
      'Phát triển ứng dụng và startup AI dựa trên cơ sở dữ liệu quốc gia Make in Vietnam.',
      'Quay clip ngắn 30-60s giới thiệu đội thi: "Tôi đi thi AI".'
    ],
    prizes: [
      'Giải Nhất: Cúp vô địch và hàng trăm triệu tiền mặt',
      'Giải Đặc biệt Techcombank: Cơ hội làm việc & Cơ hội thành triệu phú dưới 30 tuổi',
      'Giải NDA & NDC: Học bổng đào tạo AI chuyên sâu và ươm tạo startup'
    ],
    timeline: [
      { label: 'Khởi động & Mở đăng ký', date: '2026-06-19T00:00:00+07:00', type: 'registration' },
      { label: 'Hạn đăng ký & Nộp hồ sơ', date: '2026-07-31T23:59:00+07:00', type: 'registration' },
      { label: 'Công bố Top 100 đội xét duyệt', date: '2026-08-10T17:00:00+07:00', type: 'milestone' },
      { label: 'Vòng chung khảo & Quay truyền hình', date: '2026-09-01T09:00:00+07:00', type: 'final' }
    ]
  },
  {
    id: 'aichallenge',
    name: 'Vietnam AI Innovation Challenge 2026',
    slogan: 'Launchpad for Vietnam\'s Next-Gen AI Startups',
    organizer: 'NIC, Meta, AIV & Duy Tân University',
    teamLimit: { min: 3, max: 5 },
    registrationLink: 'https://luma.com/qpph089h?brid=YWdncwEr_jkdtikNCTtkyVKaFA1K&tk=JkEXcF',
    gradient: 'var(--c-aichallenge-grad)',
    glow: 'var(--c-aichallenge-glow)',
    status: 'Đang đào tạo Bootcamp',
    topics: [
      'Giải quyết các bài toán thực tế của các doanh nghiệp hàng đầu bằng giải pháp AI-native.',
      'Học viên đăng ký cá nhân, sau đó lập đội nhóm từ 3-5 người trên hệ thống.',
      'Quy mô lớn với 1500 - 2000 tài năng xuất sắc trên cả nước.'
    ],
    prizes: [
      'Giải thưởng tiền mặt giá trị lớn từ đối tác Meta và NIC',
      'Cơ hội tham gia vườn ươm khởi nghiệp startup AI và nhận cố vấn từ chuyên gia'
    ],
    timeline: [
      { label: 'Mở đăng ký cá nhân', date: '2026-05-15T00:00:00+07:00', type: 'registration' },
      { label: 'Hạn chót ứng tuyển cá nhân', date: '2026-06-15T23:59:00+07:00', type: 'registration' },
      { label: 'Bootcamp huấn luyện chuyên sâu', date: '2026-06-20T08:00:00+07:00', type: 'milestone' },
      { label: 'Chung kết & Pitching (NIC Hòa Lạc)', date: '2026-07-17T09:00:00+07:00', type: 'final' }
    ]
  },
  {
    id: 'onevoice',
    name: 'OneVoice AI Challenge 2026',
    slogan: 'Multilingual Edge AI Translation Solution',
    organizer: 'Saigon AI Hub × Qualcomm',
    teamLimit: { min: 1, max: 99 },
    registrationLink: 'https://luma.com/g1rwi7ag?brid=YWdncwGD4tzxqhiTNvLEc1Pm5LcW',
    gradient: 'var(--c-onevoice-grad)',
    glow: 'var(--c-onevoice-glow)',
    status: 'Đang chuẩn bị Spec',
    topics: [
      'Nghiên cứu & phát triển mô hình dịch đa ngôn ngữ chạy trực tiếp trên thiết bị (Edge AI).',
      'Độ trễ phản hồi (Inference Latency) tối đa dưới 2.0s và Real-time Factor (RTF) < 1.0.',
      'Đánh giá chất lượng dịch thuật thông qua chỉ số BLEU, COMET và độ tự nhiên MOS.'
    ],
    prizes: [
      'Giải Nhất: Trải nghiệm công nghệ đỉnh cao',
      'Cơ hội tài trợ phát triển phần cứng và tiếp cận chuyên gia Qualcomm'
    ],
    timeline: [
      { label: 'Mở đăng ký', date: '2026-05-24T00:00:00+07:00', type: 'registration' },
      { label: 'Hạn đăng ký', date: '2026-06-24T23:59:00+07:00', type: 'registration' },
      { label: 'Nộp đặc tả Spec kỹ thuật', date: '2026-07-15T23:59:00+07:00', type: 'milestone' },
      { label: 'Nộp sản phẩm thử nghiệm Prototype', date: '2026-09-15T23:59:00+07:00', type: 'milestone' },
      { label: 'Field Testing & Đánh giá thực tế', date: '2026-10-15T23:59:00+07:00', type: 'milestone' },
      { label: 'Vòng chung kết Offline (VNG Campus)', date: '2026-11-15T09:00:00+07:00', type: 'final' }
    ]
  }
];

export const INITIAL_ALLOCATIONS = {
  onevoice: {
    members: ['tung', 'tunganh', 'hau', 'tuantran', 'hung', 'duyanh', 'thach']
  },
  thucchien: {
    teamA: ['hung', 'duyanh', 'tuantran'],
    teamB: ['thach', 'hau', 'tunganh']
  },
  aichallenge: {
    teamA: ['duyanh', 'tuantran', 'hau'],
    teamB: ['tunganh', 'tung', 'thach', 'hung']
  },
  buildhub: {
    teamA: ['duyanh', 'tunganh', 'hung'],
    teamB: ['tuantran', 'tung', 'hau', 'thach']
  },
  viettel: {
    teamA: ['duyanh', 'thach', 'tuantran'],
    teamB: ['tung', 'tunganh', 'hau']
  }
};

export const DEFAULT_KANBAN_TASKS = {
  onevoice: [
    { id: 't-ov-1', title: 'Thiết kế kiến trúc Edge AI', desc: 'Lựa chọn mô hình dịch chạy trực tiếp local phù hợp năng lực phần cứng', assignee: 'duyanh', column: 'inprogress' },
    { id: 't-ov-2', title: 'Tối ưu mô hình qua ONNX/TensorRT', desc: 'Thử nghiệm nén lượng tử hóa (Quantization) để đạt RTF < 1.0', assignee: 'tuantran', column: 'todo' },
    { id: 't-ov-3', title: 'Lựa chọn phần cứng Qualcomm', desc: 'Lựa chọn kit phát triển NPU phù hợp thiết bị đeo tay di động', assignee: 'thach', column: 'todo' }
  ],
  thucchien: [
    { id: 't-tc-1', title: 'Lên kịch bản video giới thiệu', desc: 'Quay và dựng clip 30s "Tôi đi thi AI" giới thiệu cá tính đội thi', assignee: 'hung', column: 'done' },
    { id: 't-tc-2', title: 'Thu thập dữ liệu tiếng Việt quốc gia', desc: 'Thu thập tài liệu y tế, hành chính phục vụ tinh chỉnh LLM/SLM', assignee: 'hau', column: 'inprogress' }
  ],
  aichallenge: [
    { id: 't-ac-1', title: 'Nghiên cứu API Meta Llama 3', desc: 'Tìm hiểu cơ chế tích hợp API Meta và cấu hình RAG', assignee: 'tung', column: 'todo' }
  ],
  buildhub: [
    { id: 't-bh-1', title: 'Tạo tài liệu Pitch Deck', desc: 'Thiết kế slide 12 trang theo khung mẫu đề án kinh doanh', assignee: 'tunganh', column: 'inprogress' }
  ],
  viettel: [
    { id: 't-vt-1', title: 'Huấn luyện mạng Neural Reconstruction', desc: 'Tái dựng cấu trúc 3D trạm BTS từ ảnh chụp drone', assignee: 'tung', column: 'todo' },
    { id: 't-vt-2', title: 'Tối ưu hóa suy luận LLM', desc: 'Tối ưu hóa throughput sử dụng vLLM hoặc TensorRT-LLM', assignee: 'tuantran', column: 'inprogress' }
  ]
};

// ==========================================================================
// PORTAL CONTROLLER & LOCALSTORAGE & SUPABASE BINDINGS
// ==========================================================================
