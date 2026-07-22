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
    status: 'Đang thi Sơ loại · Đề 2 gia hạn đến 04/08',
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
      { label: 'Hạn sơ loại Đề 1 & Đề 3', date: '2026-07-30T23:59:00+07:00', type: 'registration' },
      { label: 'Hạn sơ loại Đề 2 (gia hạn thêm 5 ngày)', date: '2026-08-04T23:59:00+07:00', type: 'registration' },
      { label: 'Vòng 2 - Sơ khảo (15–18/08)', date: '2026-08-15T00:00:00+07:00', type: 'milestone' },
      { label: 'Vòng 3 - Chung kết (09–10/09)', date: '2026-09-09T00:00:00+07:00', type: 'final' },
      { label: 'Lễ trao giải chung cuộc', date: '2026-09-11T16:00:00+07:00', type: 'final' }
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
      'Tổng giá trị giải thưởng lên đến hàng tỷ đồng',
      'Giải Nhì: 300.000.000 VNĐ; 02 Giải Ba: 100.000.000 VNĐ / giải',
      'Giải đặc biệt Techcombank cùng các giải về dữ liệu, startup và học bổng AI'
    ],
    timeline: [
      { label: 'Khởi động & Mở đăng ký', date: '2026-06-19T00:00:00+07:00', type: 'registration' },
      { label: 'Hạn đăng ký & Nộp hồ sơ', date: '2026-07-31T23:59:00+07:00', type: 'registration' }
    ]
  },
  {
    id: 'onevoice',
    name: 'OneVoice AI Challenge 2026',
    slogan: 'Multilingual Edge AI Translation Solution',
    organizer: 'Saigon AI Hub × Qualcomm',
    teamLimit: { min: 1, max: 99 },
    registrationLink: 'https://saigonaihub.com/OneVoiceAIChallenge',
    gradient: 'var(--c-onevoice-grad)',
    glow: 'var(--c-onevoice-glow)',
    status: 'Phase 2 · Đang nộp đề xuất kỹ thuật',
    topics: [
      'Nghiên cứu & phát triển mô hình dịch đa ngôn ngữ chạy trực tiếp trên thiết bị (Edge AI).',
      'Thiết bị dịch song ngữ Việt–Anh, Việt–Trung hoặc Việt–Hàn, xử lý hoàn toàn on-device.',
      'Chấm điểm theo đổi mới (25%), hiệu năng kỹ thuật (50%) và tiềm năng kinh doanh (25%).'
    ],
    prizes: [
      'Tổng giải thưởng: 50.000 USD',
      'Giải Nhất: 20.000 USD; Giải Nhì: 15.000 USD; Giải Ba: 10.000 USD',
      'Giải Đổi mới đặc biệt: tổng cộng 5.000 USD'
    ],
    timeline: [
      { label: 'Mở đăng ký', date: '2026-05-24T00:00:00+07:00', type: 'registration' },
      { label: 'Hạn đăng ký', date: '2026-06-24T23:59:00+07:00', type: 'registration' },
      { label: 'Tháng 7: Nộp đề xuất kỹ thuật (đang diễn ra)', date: '2026-07-01T00:00:00+07:00', type: 'milestone' },
      { label: 'Tháng 8–9: Phát triển và nộp Prototype', date: '2026-08-01T00:00:00+07:00', type: 'milestone' },
      { label: 'Tháng 10: Field Testing & Đánh giá thực tế', date: '2026-10-01T00:00:00+07:00', type: 'milestone' },
      { label: 'Tháng 11: Chung kết & Live Demo tại TP.HCM', date: '2026-11-01T00:00:00+07:00', type: 'final' }
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
  viettel: [
    { id: 't-vt-1', title: 'Huấn luyện mạng Neural Reconstruction', desc: 'Tái dựng cấu trúc 3D trạm BTS từ ảnh chụp drone', assignee: 'tung', column: 'todo' },
    { id: 't-vt-2', title: 'Tối ưu hóa suy luận LLM', desc: 'Tối ưu hóa throughput sử dụng vLLM hoặc TensorRT-LLM', assignee: 'tuantran', column: 'inprogress' }
  ]
};

export const DEFAULT_STARLIGHT_MESSAGES = {
  usually: [
    '✨ Shiina',
    '✨ Tuấn Trần',
    '✨ Thạch',
    '✨ Duy Anh',
    '✨ Hưng',
    '✨ Hậu',
    '✨ Tùng Anh',
    '🍀 Good luck!',
    '💪 You got this!',
    '☕ Take it easy & chill~',
    '🌈 Don\'t worry, be fine!',
    '🌟 Good day!',
    '✨ Ping Ping',
    '⚡ Just go',
    '🌟 Have a good day bae',
    '💅 Slay quá nè!',
    '⚡ Mãi keo mãi đỉnh!',
    '🍃 Kệ đi',
    '🙈 Kệ mày',
    '🕶️ Kệ tao',
    '🐱 Kệ nó',
    '🌪️ Kệ mẹ đi',
    '🔥 Kệ mẹ mày',
    '💥 Kệ mẹ tao',
    '⚡ Kệ mẹ nó',
    '🌀 Kệ con mẹ đi',
    '⚡ Kệ con mẹ mày',
    '💥 Kệ con mẹ tao',
    '🔥 Kệ con mẹ nó',
    '🕺 Nhảy cùng Zinzin',
    '🌌 Life is either a daring adventure or nothing.',
    '🧘 until death all defeat is psychological',
    '💥 Bengz',
    '😄 hihihaha',
    '👻 pekkboo'
  ],
  sometimes: [
    '🌟 Keep shining!',
    '🌙 Nhớ ngủ sớm nhé',
    '🥛 Uống nước rồi làm tiếp',
    '🎯 Mọi nỗ lực sẽ đáp lời',
    '🔥 Cháy hết mình cùng đam mê',
    '☕ Trà hay Cà phê?',
    '🎈 Cứ thong thả thôi',
    '🎵 Chỉ là một phút giây thôi mà ~~',
    '🌳 Không lẽ, mình không cứng cỏi bằng mấy cái cây sau nhà'
  ],
  rarely: [
    '💧 Uống nước đi',
    '🩺 Chú ý sức khỏe',
    '🌌 Ngắm sao 3 giây rồi lại quẩy tiếp...',
    '🌠 ƯỚC ĐIIIIIIII',
    '💖 Địt mẹ mày <3',
    '✨ Youre shining',
    '🏊 Đi bơi không?',
    '🎮 Làm ván X-O ?',
    '🌈 You are GAY'
  ]
};

// ==========================================================================
// PORTAL CONTROLLER & LOCALSTORAGE & SUPABASE BINDINGS
// ==========================================================================
