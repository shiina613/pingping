// Safe HTML escaping helper
function escapeHtml(str) {
  if (typeof str !== 'string') return str == null ? '' : String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial Rich Mock Data with Multimedia (Images, Videos, Files, Links, Voice notes)
const DEFAULT_CHATS = {
  'chat-world-class': {
    title: 'World Class 🌍',
    type: 'global_channel',
    members: ['Tất cả thành viên', 'Shiina', 'Lương Thanh Hậu', 'Nguyễn Quang Tùng', 'Nguyễn Lâm Tùng', 'Alex Rivers', 'Elena Rostova'],
    membersCount: 'Giao lưu toàn cầu · Tối đa 180 tin',
    unread: 0,
    messages: [
      {
        id: 'wc_1',
        author: 'Shiina',
        time: '20:10',
        content: 'Chào mừng mọi người đến với phòng chat chung **World Class**! 🌍🎉 Đây là nơi tất cả thành viên có thể giao lưu, chia sẻ ý tưởng và trao đổi kinh nghiệm tự do.'
      },
      {
        id: 'wc_2',
        author: 'Lương Thanh Hậu',
        role: 'Quản lý',
        time: '20:12',
        content: 'Xin chào cả nhà! Chúc mọi người một ngày làm việc hiệu quả và nhiều niềm vui! 😊'
      },
      {
        id: 'wc_3',
        author: 'Nguyễn Quang Tùng',
        role: 'Kỹ thuật viên',
        time: '20:15',
        content: 'Phòng chat này được thiết lập tự động lưu giữ **180 tin nhắn** gần nhất và tự động làm sạch các tin cũ. Mọi người có thể thoải mái gửi hình ảnh, video và liên kết nhé!'
      }
    ]
  },
  'chat-1': {
    title: 'Dự Án Chung 🚀',
    type: 'channel',
    members: ['Shiina', 'Lương Thanh Hậu', 'Nguyễn Quang Tùng', 'Nguyễn Lâm Tùng'],
    membersCount: '4 thành viên · Tối đa 36 tin',
    unread: 0,
    messages: [
      {
        id: 'm1_1',
        author: 'Shiina',
        time: '22:40',
        content: 'Xin chào cả đội, tiến độ dự án PingPing tuần này thế nào rồi?'
      },
      {
        id: 'm1_2',
        author: 'Lương Thanh Hậu',
        role: 'Quản lý',
        time: '22:41',
        content: 'Hệ thống xác thực tài khoản và Socket.io thời gian thực đã hoàn tất kiểm thử nhé! Em gửi ảnh chụp thực tế:',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        imageCaption: 'Giao diện bảng điều khiển PingPing'
      },
      {
        id: 'm1_3',
        author: 'Nguyễn Lâm Tùng',
        role: 'Giám sát',
        time: '22:42',
        content: 'Em gửi thêm clip kiểm thử thao tác nhắn tin đa phương tiện và đồng bộ trạng thái tức thì:',
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoCaption: 'Video demo tương tác phòng chat PingPing'
      },
      {
        id: 'm1_4',
        author: 'Lương Thanh Hậu',
        role: 'Quản lý',
        time: '22:43',
        content: 'Mọi người tham khảo tài liệu kỹ thuật tại https://github.com/shiina613/pingping và xem file đính kèm bên dưới:',
        file: {
          name: 'Tai_lieu_kien_truc_he_thong_PingPing.pdf',
          size: '2.8 MB',
          type: 'pdf'
        }
      },
      {
        id: 'm1_5',
        author: 'Nguyễn Quang Tùng',
        role: 'Kỹ thuật viên',
        time: '22:44',
        thought: 'Đã suy nghĩ trong 2s',
        thoughtTime: '2s',
        content: `Được rồi, mình kể bạn nghe câu chuyện này nhé:

**Người canh giữ ngọn hải đăng**

Ở một hòn đảo nhỏ xa xôi, có một ông lão tên Tư sống một mình trong ngọn hải đăng đã hơn ba mươi năm. Mỗi đêm, ông thắp sáng ngọn đèn để dẫn đường cho tàu thuyền qua vùng biển đầy đá ngầm.

Suốt nhiều giờ liền giữa mưa bão, ông vẫn giơ cao ngọn đèn cứu sống con tàu đánh cá. Trái tim ấm áp của ông đã trở thành điểm tựa cho muôn người... 🏮`
      }
    ]
  },
  'chat-2': {
    title: 'Lương Thanh Hậu',
    type: 'direct',
    members: ['Shiina', 'Lương Thanh Hậu'],
    membersCount: 'Quản lý - Online',
    unread: 1,
    messages: [
      {
        id: 'm2_1',
        author: 'Lương Thanh Hậu',
        time: '19:15',
        content: 'Chào anh Shiina! Em gửi anh hóa đơn vận chuyển 15 tấn thức ăn ủ chua sáng mai:'
      },
      {
        id: 'm2_2',
        author: 'Lương Thanh Hậu',
        time: '19:16',
        file: {
          name: 'Phieu_xuat_kho_thuc_an_15Tan.pdf',
          size: '1.2 MB',
          type: 'pdf'
        },
        voice: {
          duration: '0:22'
        }
      },
      {
        id: 'm2_3',
        author: 'Shiina',
        time: '19:20',
        content: 'Đã duyệt phiếu. Nhớ nhắc tài xế vào đúng cổng số 2 nhé.'
      }
    ]
  },
  'chat-3': {
    title: 'Nguyễn Quang Tùng',
    type: 'direct',
    members: ['Shiina', 'Nguyễn Quang Tùng'],
    membersCount: 'Kỹ thuật viên - Online',
    unread: 0,
    messages: [
      {
        id: 'm3_1',
        author: 'Nguyễn Quang Tùng',
        time: '16:05',
        content: 'Em vừa cập nhật bản firmware ESP32 mới nhất đọc cảm biến qua MQTT:'
      },
      {
        id: 'm3_2',
        author: 'Nguyễn Quang Tùng',
        time: '16:06',
        hasArtifact: true,
        artifactTitle: 'sensor_telemetry.py',
        artifactCode: `import time\nimport json\nimport random\n\ndef read_barn_sensors(barn_id="CS1-ZONE-A"):\n    temp = round(random.uniform(24.5, 29.2), 2)\n    humidity = round(random.uniform(65.0, 78.5), 2)\n    return json.dumps({"temp": temp, "humidity": humidity}, indent=2)\n\nprint(read_barn_sensors())`,
        content: 'Đã tối ưu thuật toán giảm tiêu hao năng lượng.'
      }
    ]
  },
  'chat-4': {
    title: 'Nguyễn Lâm Tùng',
    type: 'direct',
    members: ['Shiina', 'Nguyễn Lâm Tùng'],
    membersCount: 'Giám sát - Online',
    unread: 0,
    messages: [
      {
        id: 'm4_1',
        author: 'Nguyễn Lâm Tùng',
        time: '14:30',
        content: 'Ảnh chụp đồng hồ tải điện máy phát 150kVA sau khi kiểm tra:',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        imageCaption: 'Tủ điều khiển tự động ATS và máy phát điện'
      }
    ]
  }
};

// Global Directory of Available Contacts
const CONTACTS_DIRECTORY = [
  { name: 'Lương Thanh Hậu', role: 'Quản lý', status: 'Online', avatar: 'LH' },
  { name: 'Nguyễn Quang Tùng', role: 'Kỹ thuật viên', status: 'Online', avatar: 'QT' },
  { name: 'Nguyễn Lâm Tùng', role: 'Giám sát', status: 'Online', avatar: 'LT' },
  { name: 'Alex Rivers', role: 'Chuyên gia Thú y', status: 'Online', avatar: 'AR' },
  { name: 'Phạm Thu Trang', role: 'Kế toán kho', status: 'Away', avatar: 'TT' },
  { name: 'Trần Văn Mạnh', role: 'Vận hành máy', status: 'Offline', avatar: 'TM' }
];

// Global State
const state = {
  authToken: localStorage.getItem('pingping_token') || null,
  currentUser: JSON.parse(localStorage.getItem('pingping_user') || 'null'),
  currentChatId: null,
  heroMode: 'chat', // 'chat' (1-1 direct) or 'cowork' (group/channel)
  heroSelectedRecipient: 'Lương Thanh Hậu',
  isSidebarCollapsed: false,
  isArtifactsOpen: false,
  chats: JSON.parse(localStorage.getItem('pingping_chats')) || DEFAULT_CHATS,
  settings: JSON.parse(localStorage.getItem('pingping_settings')) || {
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: true
  }
};

// Save state helper
function saveState() {
  try {
    localStorage.setItem('pingping_chats', JSON.stringify(state.chats));
    localStorage.setItem('pingping_settings', JSON.stringify(state.settings));
  } catch (e) {
    console.error('Save error:', e);
  }
}

// DOM Elements Registry
const elements = {
  sidebar: document.getElementById('sidebar'),
  collapseSidebarBtn: document.getElementById('collapseSidebarBtn'),
  openSidebarBtn: document.getElementById('openSidebarBtn'),
  mobileSidebarToggle: document.getElementById('mobileSidebarToggle'),
  brandLogo: document.getElementById('brand-logo'),
  newChatBtn: document.getElementById('newChatBtn'),
  sidebarChatsList: document.getElementById('sidebarChatsList') || document.getElementById('chatsList'),
  navProjects: document.getElementById('navProjects'),
  navConnect: document.getElementById('navConnect'),
  navCustomize: document.getElementById('navCustomize'),
  authModal: document.getElementById('authModal'),
  closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
  guestContinueBtn: document.getElementById('guestContinueBtn'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  logoutBtn: document.getElementById('logoutBtn'),
  newChatModal: document.getElementById('newChatModal'),
  
  // Views
  heroView: document.getElementById('heroView'),
  chatView: document.getElementById('chatView'),
  projectsView: document.getElementById('projectsView'),
  
  // Top Header & Session Dropdown
  sessionDropdownBtn: document.getElementById('sessionDropdownBtn'),
  activeChatTitle: document.getElementById('activeChatTitle'),
  sessionQuickMenu: document.getElementById('sessionQuickMenu'),
  sessionQuickItems: document.getElementById('sessionQuickItems'),
  menuCreateNewSession: document.getElementById('menuCreateNewSession'),
  topPlanBanner: document.getElementById('topPlanBanner'),
  closePlanBannerBtn: document.getElementById('closePlanBannerBtn'),
  planUpgradeLink: document.getElementById('planUpgradeLink'),
  
  // Hero Inputs & Mode Toggle
  heroChatInput: document.getElementById('heroChatInput'),
  heroSendBtn: document.getElementById('heroSendBtn'),
  modeChatBtn: document.getElementById('modeChatBtn'),
  modeCoworkBtn: document.getElementById('modeCoworkBtn'),
  modelDropdownBtn: document.getElementById('modelDropdownBtn'),
  modelDropdownMenu: document.getElementById('modelDropdownMenu'),
  selectedModelLabel: document.getElementById('selectedModelLabel'),
  
  // Active Chat Stream Inputs
  chatMessagesContainer: document.getElementById('chatMessagesContainer') || document.getElementById('messagesContainer'),
  activeChatInput: document.getElementById('activeChatInput'),
  activeSendBtn: document.getElementById('activeSendBtn'),
  typingIndicator: document.getElementById('typingIndicator'),
  streamingStatusText: document.getElementById('streamingStatusText'),
  activeMentionAutocomplete: document.getElementById('activeMentionAutocomplete'),
  activeMentionItems: document.getElementById('activeMentionItems'),
  
  // Projects View
  projectsGrid: document.getElementById('projectsGrid'),
  projectCreateNewBtn: document.getElementById('projectCreateNewBtn'),
  projectConnectBtn: document.getElementById('projectConnectBtn'),
  allCount: document.getElementById('allCount'),
  groupsCount: document.getElementById('groupsCount'),
  friendsCount: document.getElementById('friendsCount'),
  
  // Modals
  connectModal: document.getElementById('connectModal'),
  closeConnectModalBtn: document.getElementById('closeConnectModalBtn'),
  doneConnectBtn: document.getElementById('doneConnectBtn'),
  copyMyIdBtn: document.getElementById('copyMyIdBtn'),
  myIdCode: document.getElementById('myIdCode'),
  targetIdInput: document.getElementById('targetIdInput'),
  connectTargetBtn: document.getElementById('connectTargetBtn'),
  
  customizeModal: document.getElementById('customizeModal'),
  closeCustomizeModalBtn: document.getElementById('closeCustomizeModalBtn'),
  closeCustomizeModalBtn2: document.getElementById('closeCustomizeModalBtn2'),
  saveCustomizeBtn: document.getElementById('saveCustomizeBtn'),
  testSoundBtn: document.getElementById('testSoundBtn'),
  soundToggle: document.getElementById('soundToggle'),
  notifToggle: document.getElementById('notifToggle') || document.getElementById('notificationToggle'),
  
  searchModal: document.getElementById('searchModal'),
  closeSearchModalBtn: document.getElementById('closeSearchModalBtn'),
  globalSearchInput: document.getElementById('globalSearchInput'),
  searchResultsList: document.getElementById('searchResultsList'),
  searchChatsBtn: document.getElementById('searchChatsBtn'),
  
  profileModal: document.getElementById('profileModal'),
  closeProfileModalBtn: document.getElementById('closeProfileModalBtn'),
  cancelProfileBtn: document.getElementById('cancelProfileBtn'),
  saveProfileBtn: document.getElementById('saveProfileBtn'),
  profileNameInput: document.getElementById('profileNameInput'),
  profileRoleInput: document.getElementById('profileRoleInput'),
  userProfileBtn: document.getElementById('userProfileBtn') || document.getElementById('userProfileRow'),
  
  // Header Live Status
  liveDot: document.getElementById('liveDot'),
  liveText: document.getElementById('liveText'),
  profileIdInput: document.getElementById('profileIdInput'),

  // Toast & File
  toastContainer: document.getElementById('toastContainer'),
  hiddenFileInput: document.getElementById('hiddenFileInput'),
  downloadTranscriptBtn: document.getElementById('downloadTranscriptBtn')
};

// Play pleasant synthesizer chime sound
function playChimeSound(type = 'chime') {
  if (!state.settings.soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    console.log('Audio error:', e);
  }
}

// Show Toast Notification
function showToast(message, icon = '✨') {
  const container = elements.toastContainer;
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

// ⚡ Socket.io Realtime & Backend Sync Engine
let socket = null;
let typingDebounceTimer = null;

function updateLiveStatus(status) {
  if (!elements.liveDot || !elements.liveText) return;
  elements.liveDot.className = 'status-live-dot';

  if (status === 'online') {
    elements.liveText.textContent = 'Realtime';
    elements.liveDot.title = 'Đã kết nối Socket.io máy chủ thời gian thực';
  } else if (status === 'connecting') {
    elements.liveDot.classList.add('connecting');
    elements.liveText.textContent = 'Đang kết nối...';
    elements.liveDot.title = 'Đang kết nối lại tới máy chủ...';
  } else {
    elements.liveDot.classList.add('offline');
    elements.liveText.textContent = 'Offline';
    elements.liveDot.title = 'Chế độ ngoại tuyến cục bộ';
  }
}

function enforceMessageLimits(chatId) {
  if (!state.chats[chatId] || !Array.isArray(state.chats[chatId].messages)) return;
  const limit = chatId === 'chat-world-class' ? 180 : 36;
  if (state.chats[chatId].messages.length > limit) {
    state.chats[chatId].messages = state.chats[chatId].messages.slice(-limit);
  }
}

function showTypingIndicator(userName) {
  if (!elements.typingIndicator) return;
  elements.typingIndicator.classList.remove('hidden');
  if (elements.streamingStatusText) {
    elements.streamingStatusText.textContent = `${userName || 'Một thành viên'} đang soạn tin...`;
  }
}

function hideTypingIndicator() {
  if (!elements.typingIndicator) return;
  elements.typingIndicator.classList.add('hidden');
}

function handleIncomingRealtimeMessage(chatId, message) {
  if (!chatId || !message) return;

  if (!state.chats[chatId]) {
    state.chats[chatId] = {
      title: chatId === 'chat-world-class' ? 'World Class 🌍' : message.author,
      type: chatId === 'chat-world-class' ? 'global_channel' : 'direct',
      members: [state.currentUser.name, message.author],
      membersCount: 'Trực tuyến',
      unread: 0,
      messages: []
    };
  }

  const chat = state.chats[chatId];
  const exists = chat.messages.some(m => m.id === message.id);
  if (!exists) {
    chat.messages.push(message);
    enforceMessageLimits(chatId);
    saveState();

    if (state.currentChatId === chatId) {
      renderCurrentChat();
    } else {
      chat.unread = (chat.unread || 0) + 1;
    }

    renderSidebarChats();

    if (message.author === state.currentUser.name) {
      playChimeSound('send');
    } else {
      playChimeSound('receive');
    }
  }
}

function handleMessagesPruned(chatId, prunedCount, retentionLimit) {
  if (state.chats[chatId]) {
    enforceMessageLimits(chatId);
    saveState();
    if (state.currentChatId === chatId) {
      renderCurrentChat();
    }
  }
}

async function uploadFileToServer(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (e) {
    console.warn('Upload API failed, fallback to local base64/url:', e);
    return null;
  }
}

function initSocket() {
  if (typeof io === 'undefined') {
    console.warn('Socket.io library not loaded, using local storage mode.');
    updateLiveStatus('offline');
    return;
  }

  try {
    socket = io({
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('🟢 Đã kết nối Socket.io Realtime:', socket.id);
      updateLiveStatus('online');

      socket.emit('register_user', {
        userId: state.currentUser.id || 'u_shiina',
        userName: state.currentUser.name
      });

      // Join current rooms
      Object.keys(state.chats).forEach(chatId => {
        socket.emit('join_chat', { chatId });
      });
    });

    socket.on('connect_error', () => {
      updateLiveStatus('connecting');
    });

    socket.on('disconnect', () => {
      updateLiveStatus('offline');
    });

    socket.on('new_message', ({ chatId, message }) => {
      handleIncomingRealtimeMessage(chatId, message);
    });

    socket.on('messages_pruned', ({ chatId, prunedCount, retentionLimit }) => {
      handleMessagesPruned(chatId, prunedCount, retentionLimit);
    });

    socket.on('user_typing', ({ chatId, userName }) => {
      if (state.currentChatId === chatId && userName !== state.currentUser.name) {
        showTypingIndicator(userName);
      }
    });

    socket.on('user_stopped_typing', ({ chatId }) => {
      if (state.currentChatId === chatId) {
        hideTypingIndicator();
      }
    });

    socket.on('member_updated', ({ chatId, action, memberName, members }) => {
      if (state.chats[chatId]) {
        if (members) state.chats[chatId].members = members;
        renderSidebarChats();
        if (state.currentChatId === chatId) renderCurrentChat();
      }
    });

    socket.on('chat_renamed', ({ chatId, newTitle }) => {
      if (state.chats[chatId]) {
        state.chats[chatId].title = newTitle;
        if (state.currentChatId === chatId && elements.activeChatTitle) {
          elements.activeChatTitle.textContent = newTitle;
        }
        renderSidebarChats();
      }
    });

    socket.on('new_chat_created', (newChat) => {
      if (newChat && newChat.id && !state.chats[newChat.id]) {
        state.chats[newChat.id] = {
          title: newChat.title,
          type: newChat.type,
          members: newChat.members || [],
          membersCount: newChat.membersCount || `${(newChat.members || []).length} thành viên`,
          unread: 0,
          messages: []
        };
        if (socket && socket.connected) {
          socket.emit('join_chat', { chatId: newChat.id });
        }
        renderSidebarChats();
      }
    });
  } catch (err) {
    console.error('Socket init error:', err);
    updateLiveStatus('offline');
  }
}

async function syncDataFromServer() {
  try {
    const [chatsRes, usersRes] = await Promise.all([
      fetch('/api/chats').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/users').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    if (usersRes && usersRes.success && Array.isArray(usersRes.data)) {
      usersRes.data.forEach(u => {
        const existing = CONTACTS_DIRECTORY.find(c => c.name.toLowerCase() === u.displayName.toLowerCase());
        if (!existing) {
          CONTACTS_DIRECTORY.push({
            name: u.displayName,
            role: u.role,
            status: 'Online',
            avatar: u.displayName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
          });
        }
      });
      updateHeroDropdownItems();
    }

    if (chatsRes && chatsRes.success && Array.isArray(chatsRes.data)) {
      for (const c of chatsRes.data) {
        if (!state.chats[c.id]) {
          state.chats[c.id] = {
            title: c.title,
            type: c.type,
            members: c.members || [],
            membersCount: c.membersCount,
            unread: 0,
            messages: []
          };
        } else {
          state.chats[c.id].title = c.title;
          state.chats[c.id].members = c.members || state.chats[c.id].members;
          state.chats[c.id].membersCount = c.membersCount;
        }

        // Fetch messages for each chat from backend
        fetch(`/api/chats/${c.id}/messages`).then(r => r.ok ? r.json() : null).then(msgRes => {
          if (msgRes && msgRes.success && Array.isArray(msgRes.data)) {
            state.chats[c.id].messages = msgRes.data;
            saveState();
            if (state.currentChatId === c.id) {
              renderCurrentChat();
            }
          }
        }).catch(() => {});
      }

      saveState();
      renderSidebarChats();
      renderProjectsGrid();
    }
  } catch (e) {
    console.warn('Backend sync failed, continuing with local state:', e);
  }
}

// ================= AUTH PORTAL & SESSION LOGIC ================= //

function showAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('hidden');
    clearAuthAlert();
    document.getElementById('loginUsername')?.focus();
  }
}

function hideAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

function showAuthAlert(msg, type = 'error') {
  const alertEl = document.getElementById('authAlert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.className = type;
  alertEl.classList.remove('hidden');
}

function clearAuthAlert() {
  const alertEl = document.getElementById('authAlert');
  if (alertEl) alertEl.classList.add('hidden');
}

function updateUserProfileUI() {
  const currentUserNameEl = document.getElementById('currentUserName');
  const currentUserAvatarEl = document.getElementById('currentUserAvatar');
  const headerAuthBtn = document.getElementById('headerAuthBtn');
  const headerUserControls = document.getElementById('headerUserControls');
  const headerUserNameDisplay = document.getElementById('headerUserNameDisplay');

  if (state.currentUser && state.authToken) {
    if (currentUserNameEl) currentUserNameEl.textContent = state.currentUser.name;
    if (currentUserAvatarEl) currentUserAvatarEl.textContent = state.currentUser.name.charAt(0).toUpperCase();

    if (headerAuthBtn) headerAuthBtn.classList.add('hidden');
    if (headerUserControls) headerUserControls.classList.remove('hidden');
    if (headerUserNameDisplay) headerUserNameDisplay.textContent = `👤 ${state.currentUser.name}`;

    const nameText = document.getElementById('profileDisplayNameText');
    const usernameText = document.getElementById('profileUsernameText');
    const avatarDisplay = document.getElementById('profileAvatarDisplay');
    if (nameText) nameText.textContent = state.currentUser.name;
    if (usernameText) usernameText.textContent = '@' + (state.currentUser.username || state.currentUser.name.toLowerCase().replace(/\s+/g, ''));
    if (avatarDisplay) avatarDisplay.textContent = state.currentUser.name.charAt(0).toUpperCase();
  } else {
    if (currentUserNameEl) currentUserNameEl.textContent = 'Khách (Chưa đăng nhập)';
    if (currentUserAvatarEl) currentUserAvatarEl.textContent = '👤';

    if (headerAuthBtn) headerAuthBtn.classList.remove('hidden');
    if (headerUserControls) headerUserControls.classList.add('hidden');
    if (headerUserNameDisplay) headerUserNameDisplay.textContent = '';
  }
}

async function handleLogin(username, password) {
  const btn = document.getElementById('loginSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      showAuthAlert(result.message || 'Sai tên đăng nhập hoặc mật khẩu', 'error');
      return;
    }

    const { token, user } = result.data;
    state.authToken = token;
    state.currentUser = {
      id: user.id,
      name: user.displayName,
      username: user.username,
      role: user.role,
      avatar: user.avatarUrl || ''
    };

    localStorage.setItem('pingping_token', token);
    localStorage.setItem('pingping_user', JSON.stringify(state.currentUser));

    updateUserProfileUI();
    hideAuthModal();
    initSocket();
    syncDataFromServer();
    startPollingSync();
    showToast(`Chào mừng ${state.currentUser.name} đã đăng nhập! 👋`);
  } catch (err) {
    showAuthAlert('Không thể kết nối đến máy chủ, vui lòng thử lại', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập vào PingPing';
    }
  }
}

async function handleRegister(username, displayName, role, password, confirmPassword) {
  if (password !== confirmPassword) {
    showAuthAlert('Xác nhận mật khẩu không khớp!', 'error');
    return;
  }
  if (password.length < 6) {
    showAuthAlert('Mật khẩu phải có tối thiểu 6 ký tự!', 'error');
    return;
  }

  const btn = document.getElementById('regSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang tạo tài khoản...';
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName, role, password })
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      showAuthAlert(result.message || 'Đăng ký không thành công', 'error');
      return;
    }

    const { token, user } = result.data;
    state.authToken = token;
    state.currentUser = {
      id: user.id,
      name: user.displayName,
      username: user.username,
      role: user.role,
      avatar: user.avatarUrl || ''
    };

    localStorage.setItem('pingping_token', token);
    localStorage.setItem('pingping_user', JSON.stringify(state.currentUser));

    updateUserProfileUI();
    hideAuthModal();
    initSocket();
    syncDataFromServer();
    startPollingSync();
    showToast(`Tạo tài khoản thành công! Chào mừng ${state.currentUser.name} 🎉`);
  } catch (err) {
    showAuthAlert('Không thể kết nối đến máy chủ, vui lòng thử lại', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tạo tài khoản & Tham gia ngay';
    }
  }
}

function handleLogout() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
    localStorage.removeItem('pingping_token');
    localStorage.removeItem('pingping_user');
    state.authToken = null;
    state.currentUser = null;
    if (socket && socket.connected) {
      socket.disconnect();
    }
    stopPollingSync();
    closeAllModals();
    showAuthModal();
    showToast('Đã đăng xuất thành công.');
  }
}

async function checkAuthSession() {
  const token = localStorage.getItem('pingping_token');
  const savedUser = localStorage.getItem('pingping_user');

  if (!token || !savedUser) {
    updateUserProfileUI();
    initSocket();
    syncDataFromServer();
    startPollingSync();
    showAuthModal();
    return;
  }

  try {
    state.currentUser = JSON.parse(savedUser);
    state.authToken = token;
    updateUserProfileUI();

    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        state.currentUser = {
          id: data.data.id,
          name: data.data.displayName || data.data.username,
          username: data.data.username,
          role: data.data.role || 'Thành viên',
          avatar: data.data.avatarUrl || ''
        };
        localStorage.setItem('pingping_user', JSON.stringify(state.currentUser));
        updateUserProfileUI();
        hideAuthModal();
        initSocket();
        syncDataFromServer();
        startPollingSync();
        return;
      }
    }
  } catch (e) {
    hideAuthModal();
    initSocket();
    syncDataFromServer();
    startPollingSync();
    return;
  }

  localStorage.removeItem('pingping_token');
  localStorage.removeItem('pingping_user');
  state.authToken = null;
  state.currentUser = null;
  showAuthModal();
}

// Smart Polling Sync for real-time messages & chats
let pollingInterval = null;
let pollTick = 0;
function startPollingSync() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    pollTick++;
    
    // 1. Sync messages for current active chat
    if (state.currentChatId) {
      try {
        const headers = {};
        if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;
        const res = await fetch(`/api/chats/${state.currentChatId}/messages?limit=50`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const chat = state.chats[state.currentChatId];
            if (chat) {
              const currentMsgIds = new Set((chat.messages || []).map(m => m.id));
              let hasNew = false;
              let isFromOther = false;

              json.data.forEach(m => {
                if (!currentMsgIds.has(m.id)) {
                  chat.messages.push(m);
                  hasNew = true;
                  if (m.author !== (state.currentUser?.name || 'Shiina')) {
                    isFromOther = true;
                  }
                }
              });

              if (hasNew) {
                enforceMessageLimits(state.currentChatId);
                saveState();
                renderCurrentChat();
                renderSidebarChats();
                if (isFromOther) {
                  playChimeSound('receive');
                }
              }
            }
          }
        }
      } catch (e) {}
    }

    // 2. Periodic sync for room list every ~10 seconds
    if (pollTick % 3 === 0) {
      try {
        const cRes = await fetch('/api/chats');
        if (cRes.ok) {
          const cJson = await cRes.json();
          if (cJson.success && Array.isArray(cJson.data)) {
            let chatsUpdated = false;
            cJson.data.forEach(c => {
              if (!state.chats[c.id]) {
                state.chats[c.id] = {
                  title: c.title,
                  type: c.type,
                  members: c.members || [],
                  membersCount: c.membersCount,
                  unread: 0,
                  messages: []
                };
                chatsUpdated = true;
              } else {
                if (state.chats[c.id].title !== c.title) {
                  state.chats[c.id].title = c.title;
                  chatsUpdated = true;
                }
              }
            });
            if (chatsUpdated) {
              saveState();
              renderSidebarChats();
              renderProjectsGrid();
            }
          }
        }
      } catch (e) {}
    }

    // 3. Maintain Cloud Sync status if socket is in fallback mode
    if (!socket || !socket.connected) {
      updateLiveStatus('cloud');
    }
  }, 3500);
}

function stopPollingSync() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// New Chat & Member Directory Helper
async function openNewChatModal() {
  const friendSelect = document.getElementById('quickFriendSelect');
  const groupMemberList = document.querySelector('.member-checkbox-list');
  const existingGroupSelect = document.getElementById('existingGroupSelect');

  if (existingGroupSelect) {
    existingGroupSelect.innerHTML = '';
    Object.keys(state.chats).forEach(chatId => {
      const c = state.chats[chatId];
      if (c.type === 'channel' || c.type === 'group' || c.type === 'global_channel') {
        const opt = document.createElement('option');
        opt.value = chatId;
        opt.textContent = `${c.title} (${(c.members && c.members.length) || ''} thành viên)`;
        existingGroupSelect.appendChild(opt);
      }
    });
  }

  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const otherUsers = json.data.filter(u => !state.currentUser || u.id !== state.currentUser.id);

        if (friendSelect) {
          friendSelect.innerHTML = '';
          otherUsers.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.displayName || u.username;
            opt.dataset.userId = u.id;
            opt.dataset.username = u.username;
            opt.textContent = `👤 ${u.displayName} (${u.role || 'Thành viên'})`;
            friendSelect.appendChild(opt);
          });
        }

        if (groupMemberList) {
          groupMemberList.innerHTML = '';
          otherUsers.forEach(u => {
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `<input type="checkbox" value="${u.displayName}"> <span>👤 ${u.displayName}</span>`;
            groupMemberList.appendChild(label);
          });
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch user list:', e);
  }

  openModal(document.getElementById('newChatModal'));
}

async function handleSubmitNewChat() {
  const activeTab = document.querySelector('.new-modal-tabs .segment-btn.active')?.dataset.type || 'direct';
  const initialMsg = document.getElementById('newInitialMsgInput')?.value.trim();

  if (activeTab === 'direct') {
    const friendSelect = document.getElementById('quickFriendSelect');
    const customName = document.getElementById('newDirectRecipientInput')?.value.trim();
    const selectedOption = friendSelect?.options[friendSelect.selectedIndex];

    const targetUserId = selectedOption?.dataset?.userId;
    const targetUsername = selectedOption?.dataset?.username;
    const targetName = customName || selectedOption?.value;

    if (!targetName) {
      showToast('Vui lòng chọn hoặc nhập người nhận!');
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;
      const res = await fetch('/api/chats/direct', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetUserId,
          targetUsername,
          currentUserId: state.currentUser?.id
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newChat = json.data;
        state.chats[newChat.id] = {
          ...newChat,
          messages: state.chats[newChat.id]?.messages || []
        };
        saveState();
        renderSidebarChats();
        showChatView(newChat.id);

        if (initialMsg) {
          elements.activeChatInput.value = initialMsg;
          handleActiveChatSend();
        }

        closeModal(document.getElementById('newChatModal'));
        showToast(`Đã mở trò chuyện với ${targetName}! 💬`);
        return;
      }
    } catch (e) {
      console.error('Error starting direct chat:', e);
    }
  } else if (activeTab === 'existing-group') {
    const groupId = document.getElementById('existingGroupSelect')?.value;
    if (groupId) {
      closeModal(document.getElementById('newChatModal'));
      showChatView(groupId);
      if (initialMsg) {
        elements.activeChatInput.value = initialMsg;
        handleActiveChatSend();
      }
    }
  } else if (activeTab === 'create-group') {
    const groupName = document.getElementById('newGroupNameInput')?.value.trim();
    if (!groupName) {
      showToast('Vui lòng nhập tên nhóm mới!');
      return;
    }

    const checkedMembers = Array.from(document.querySelectorAll('.member-checkbox-list input:checked')).map(i => i.value);
    if (!checkedMembers.includes(state.currentUser?.name)) {
      checkedMembers.push(state.currentUser?.name || 'Shiina');
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: groupName,
          type: 'group',
          createdBy: state.currentUser?.id,
          members: checkedMembers
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newGroup = json.data;
        state.chats[newGroup.id] = {
          ...newGroup,
          messages: []
        };
        saveState();
        renderSidebarChats();
        showChatView(newGroup.id);

        if (initialMsg) {
          elements.activeChatInput.value = initialMsg;
          handleActiveChatSend();
        }

        closeModal(document.getElementById('newChatModal'));
        showToast(`Đã tạo nhóm "${groupName}" thành công! 🎉`);
      }
    } catch (e) {
      console.error('Error creating group:', e);
    }
  }
}

// Initialize Application
function init() {
  applyTheme(state.settings.theme);
  updateGreeting();
  setupEventListeners();

  // Clean legacy farm mock data from client localStorage if present
  if (state.chats && state.chats['chat-1'] && state.chats['chat-1'].title.includes('bò')) {
    state.chats['chat-1'].title = 'Dự Án Chung 🚀';
    saveState();
  }

  renderSidebarChats();
  updateHeroDropdownItems();
  showHeroView();
  closeArtifacts();
  autoResizeTextarea(elements.heroChatInput);
  autoResizeTextarea(elements.activeChatInput);

  checkAuthSession();
}

// Switch Views
function showHeroView(isCreatingGroup = false) {
  state.currentChatId = null;
  state.isCreatingNewGroup = isCreatingGroup;

  elements.heroView?.classList.remove('hidden');
  elements.chatView?.classList.add('hidden');
  elements.projectsView?.classList.add('hidden');
  
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
  
  if (elements.sessionDropdownBtn) elements.sessionDropdownBtn.style.display = 'none';
  if (elements.sessionQuickMenu) elements.sessionQuickMenu.classList.add('hidden');

  const banner = document.getElementById('heroHelperBanner');
  if (isCreatingGroup) {
    state.heroMode = 'cowork';
    state.heroSelectedRecipient = '✨ Nhóm mới';
    elements.modeCoworkBtn?.classList.add('active');
    elements.modeChatBtn?.classList.remove('active');
    banner?.classList.remove('hidden');
    if (elements.heroChatInput) {
      elements.heroChatInput.placeholder = 'Nhập tin nhắn khởi tạo... (Dùng @Tên để thêm bạn bè vào nhóm)';
      elements.heroChatInput.value = '';
      elements.heroChatInput.focus();
    }
  } else {
    banner?.classList.add('hidden');
    if (elements.heroChatInput) {
      elements.heroChatInput.placeholder = 'How can I help you today? Nhập tin nhắn gửi đến bạn bè hoặc nhóm...';
      elements.heroChatInput.value = '';
      elements.heroChatInput.focus();
    }
  }

  updateHeroDropdownItems();
}

function showNewGroupHeroView() {
  showHeroView(true);
}

function showChatView(chatId) {
  if (!state.chats[chatId]) return;
  state.currentChatId = chatId;
  
  state.chats[chatId].unread = 0;
  saveState();

  elements.heroView?.classList.add('hidden');
  elements.projectsView?.classList.add('hidden');
  elements.chatView?.classList.remove('hidden');
  
  if (elements.sessionDropdownBtn) elements.sessionDropdownBtn.style.display = 'flex';
  if (elements.sessionQuickMenu) elements.sessionQuickMenu.classList.add('hidden');

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-id') === chatId);
  });

  const chat = state.chats[chatId];
  if (chat && elements.activeChatTitle) {
    elements.activeChatTitle.textContent = chat.title;
  }

  renderCurrentChat();
  renderSidebarChats();
  if (elements.activeChatInput) elements.activeChatInput.focus();
}

function showProjectsView() {
  elements.heroView?.classList.add('hidden');
  elements.chatView?.classList.add('hidden');
  elements.projectsView?.classList.remove('hidden');

  if (elements.sessionDropdownBtn) elements.sessionDropdownBtn.style.display = 'none';
  if (elements.sessionQuickMenu) elements.sessionQuickMenu.classList.add('hidden');

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
  elements.navProjects?.classList.add('active');
  document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));

  renderProjectsGrid('all');
}

// Render Sidebar Chats List with Rename and Delete Actions
function renderSidebarChats() {
  if (!elements.sidebarChatsList) return;
  elements.sidebarChatsList.innerHTML = '';

  Object.keys(state.chats).forEach(chatId => {
    const chat = state.chats[chatId];
    const item = document.createElement('div');
    item.className = 'chat-item' + (state.currentChatId === chatId ? ' active' : '');
    item.setAttribute('data-id', chatId);

    const isGroup = chat.type === 'channel' || chat.type === 'group';

    item.innerHTML = `
      <span class="chat-item-bullet">${isGroup ? '·' : '·'}</span>
      <span class="chat-item-title" id="title_${chatId}" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</span>
      ${!isGroup ? '<span class="online-indicator" title="Online"></span>' : ''}
      <div class="chat-item-actions" onclick="event.stopPropagation()">
        <button class="chat-action-btn rename-btn" title="Đổi tên session">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="chat-action-btn delete-btn" title="Xóa session">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Click item to view chat
    item.addEventListener('click', () => {
      showChatView(chatId);
    });

    // Rename Button Action
    const renameBtn = item.querySelector('.rename-btn');
    const titleEl = item.querySelector('.chat-item-title');
    
    const startRename = () => {
      const currentName = chat.title;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'chat-rename-input';
      input.value = currentName;
      
      titleEl.replaceWith(input);
      input.focus();
      input.select();

      const finishRename = () => {
        const newName = input.value.trim() || currentName;
        state.chats[chatId].title = newName;
        saveState();
        if (state.currentChatId === chatId && elements.activeChatTitle) {
          elements.activeChatTitle.textContent = newName;
        }
        renderSidebarChats();
        showToast(`Đã đổi tên thành "${newName}"!`, '✏️');
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finishRename();
        } else if (e.key === 'Escape') {
          renderSidebarChats();
        }
      });

      input.addEventListener('blur', finishRename);
    };

    renameBtn?.addEventListener('click', startRename);
    titleEl?.addEventListener('dblclick', startRename);

    // Delete Button Action
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn?.addEventListener('click', () => {
      if (confirm(`Bạn có chắc chắn muốn xóa cuộc trò chuyện "${chat.title}" không?`)) {
        delete state.chats[chatId];
        saveState();
        if (state.currentChatId === chatId) {
          showHeroView();
        }
        renderSidebarChats();
        showToast(`Đã xóa "${chat.title}"!`, '🗑️');
      }
    });

    elements.sidebarChatsList.appendChild(item);
  });
}

// Update Hero Dropdown Items based on Mode (Chat vs Cowork)
function updateHeroDropdownItems() {
  const menu = elements.modelDropdownMenu;
  const label = elements.selectedModelLabel;
  if (!menu || !label) return;

  menu.innerHTML = '';

  if (state.heroMode === 'chat') {
    // Chat Mode -> Select a Person to Direct Message
    const catHeader = document.createElement('div');
    catHeader.className = 'dropdown-category';
    catHeader.textContent = 'Gửi tin nhắn trực tiếp đến:';
    menu.appendChild(catHeader);

    CONTACTS_DIRECTORY.forEach(contact => {
      const item = document.createElement('div');
      item.className = 'dropdown-item' + (state.heroSelectedRecipient === contact.name ? ' selected' : '');
      item.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <span>👤 ${escapeHtml(contact.name)}</span>
          <span style="font-size: 11px; opacity: 0.6;">${contact.role}</span>
        </div>
      `;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        state.heroSelectedRecipient = contact.name;
        label.textContent = contact.name;
        menu.classList.remove('show');
      });
      menu.appendChild(item);
    });

    // Custom person entry
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    divider.style.borderTop = '1px solid var(--border-subtle)';
    divider.style.margin = '4px 0';
    menu.appendChild(divider);

    const customItem = document.createElement('div');
    customItem.className = 'dropdown-item';
    customItem.innerHTML = `<span>➕ Nhập tên / ID người mới...</span>`;
    customItem.addEventListener('click', (e) => {
      e.stopPropagation();
      const customName = prompt('Nhập tên hoặc mã ID người bạn muốn nhắn tin:');
      if (customName && customName.trim()) {
        state.heroSelectedRecipient = customName.trim();
        label.textContent = customName.trim();
      }
      menu.classList.remove('show');
    });
    menu.appendChild(customItem);

    label.textContent = state.heroSelectedRecipient || 'Lương Thanh Hậu';

  } else {
    // Cowork Mode -> Select an existing group OR create a new group
    const catHeader = document.createElement('div');
    catHeader.className = 'dropdown-category';
    catHeader.textContent = 'Chọn nhóm hoặc tạo nhóm mới:';
    menu.appendChild(catHeader);

    // Existing groups
    Object.keys(state.chats).forEach(id => {
      const c = state.chats[id];
      if (c.type === 'channel' || c.type === 'group') {
        const item = document.createElement('div');
        item.className = 'dropdown-item' + (state.heroSelectedRecipient === c.title ? ' selected' : '');
        item.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span>🏠 ${escapeHtml(c.title)}</span>
            <span style="font-size: 11px; opacity: 0.6;">${c.membersCount || ''}</span>
          </div>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          state.heroSelectedRecipient = c.title;
          label.textContent = c.title;
          menu.classList.remove('show');
        });
        menu.appendChild(item);
      }
    });

    // Create New Group Action
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    divider.style.borderTop = '1px solid var(--border-subtle)';
    divider.style.margin = '4px 0';
    menu.appendChild(divider);

    const newGroupItem = document.createElement('div');
    newGroupItem.className = 'dropdown-item';
    newGroupItem.style.color = 'var(--accent-coral)';
    newGroupItem.style.fontWeight = '600';
    newGroupItem.innerHTML = `<span>✨ + Tạo nhóm chat mới...</span>`;
    newGroupItem.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.remove('show');
      showNewGroupHeroView();
    });
    menu.appendChild(newGroupItem);

    label.textContent = state.heroSelectedRecipient || 'Dự Án Chung 🚀';
  }
}

// Function to Switch to New Chat Hero view with Group Tag prompt
function createNewGroupDirect() {
  showNewGroupHeroView();
}

// Render Active Chat Messages Stream
function renderCurrentChat() {
  if (!state.currentChatId || !state.chats[state.currentChatId]) return;
  const chat = state.chats[state.currentChatId];
  const container = elements.chatMessagesContainer;
  if (!container) return;

  const isGroup = chat.type === 'channel' || chat.type === 'group';
  container.innerHTML = '';

  // If chat is empty
  if (chat.messages.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.textAlign = 'center';
    emptyState.style.padding = '80px 20px';
    emptyState.style.color = 'var(--text-muted)';
    emptyState.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
      <div style="font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">Bắt đầu cuộc trò chuyện trong ${escapeHtml(chat.title)}</div>
      <div style="font-size: 13px;">${isGroup ? 'Gõ tin nhắn hoặc dùng @Tên để thêm thành viên tham gia nhóm.' : 'Nhập tin nhắn bên dưới để gửi.'}</div>
    `;
    container.appendChild(emptyState);
    return;
  }

  chat.messages.forEach(msg => {
    if (msg.isSystem) {
      const sysRow = document.createElement('div');
      sysRow.className = `system-event-pill ${msg.eventType || 'info'}`;
      sysRow.innerHTML = `<span>⚙️</span> <span>${escapeHtml(msg.content)}</span>`;
      container.appendChild(sysRow);
      return;
    }

    const isSelf = msg.author === state.currentUser.name;
    const row = document.createElement('div');
    row.className = `message-row ${isSelf ? 'is-self' : 'is-other'}`;

    // 1. Build Media Attachment HTML (Image, Video, File, Voice, Code Artifact)
    let mediaHtml = '';

    if (msg.image) {
      mediaHtml += `
        <div class="msg-image-card" onclick="openLightbox('${msg.image}', '${escapeHtml(msg.imageCaption || msg.content || 'Hình ảnh đính kèm')}')">
          <img src="${msg.image}" alt="Attached Image" class="msg-image-thumb" onerror="this.parentElement.style.display='none';">
          ${msg.imageCaption ? `<div style="padding: 6px 12px; font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.2);">${escapeHtml(msg.imageCaption)}</div>` : ''}
        </div>
      `;
    }

    if (msg.video) {
      mediaHtml += `
        <div class="msg-video-card">
          <video src="${msg.video}" controls class="msg-video-player" poster="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop&q=80"></video>
          ${msg.videoCaption ? `<div style="padding: 6px 12px; font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.4);">${escapeHtml(msg.videoCaption)}</div>` : ''}
        </div>
      `;
    }

    if (msg.file) {
      const fileIcon = msg.file.type === 'pdf' ? '📕' : (msg.file.name.endsWith('.bin') ? '💾' : '📄');
      mediaHtml += `
        <div class="msg-file-card">
          <div class="msg-file-info">
            <span class="msg-file-icon">${fileIcon}</span>
            <div class="msg-file-details">
              <span class="msg-file-name" title="${escapeHtml(msg.file.name)}">${escapeHtml(msg.file.name)}</span>
              <span class="msg-file-size">${escapeHtml(msg.file.size || 'Tài liệu')}</span>
            </div>
          </div>
          <button class="msg-file-download-btn" onclick="downloadSampleFile('${escapeHtml(msg.file.name)}')" title="Tải xuống tệp tin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      `;
    }

    if (msg.voice) {
      mediaHtml += `
        <div class="msg-voice-card">
          <button class="voice-play-btn" onclick="toggleVoicePlay(this)" title="Phát tin nhắn thoại">▶</button>
          <div class="voice-waveform">
            <span class="waveform-bar" style="height: 10px;"></span>
            <span class="waveform-bar" style="height: 16px;"></span>
            <span class="waveform-bar" style="height: 8px;"></span>
            <span class="waveform-bar" style="height: 14px;"></span>
            <span class="waveform-bar" style="height: 12px;"></span>
            <span class="waveform-bar" style="height: 18px;"></span>
            <span class="waveform-bar" style="height: 7px;"></span>
          </div>
          <span class="voice-duration">${msg.voice.duration || '0:15'}</span>
        </div>
      `;
    }

    if (msg.hasArtifact) {
      mediaHtml += `
        <div class="code-card">
          <div class="code-card-header">
            <div class="code-card-header-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <span>${escapeHtml(msg.artifactTitle || 'Code Snippet')}</span>
            </div>
            <button class="code-card-btn" onclick="openArtifact('${escapeHtml(msg.artifactTitle)}', \`${encodeURIComponent(msg.artifactCode)}\`)" title="Sao chép toàn bộ mã nguồn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Sao chép mã</span>
            </button>
          </div>
          <pre class="code-card-body"><code>${escapeHtml(msg.artifactCode || '')}</code></pre>
        </div>
      `;
    }

    let bodyHtml = '';

    if (isSelf) {
      bodyHtml = `
        <div class="user-bubble-wrapper">
          ${msg.content ? formatMessageContent(msg.content) : ''}
          ${mediaHtml}
        </div>
      `;
    } else {
      let groupNameHtml = '';
      if (isGroup && msg.author) {
        groupNameHtml = `<div class="group-sender-name">${escapeHtml(msg.author)}</div>`;
      }

      let thoughtHtml = '';
      if (msg.thought) {
        thoughtHtml = `
          <div class="thought-summary-badge" title="Chi tiết luồng suy nghĩ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
            <span>${escapeHtml(msg.thought)}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        `;
      }

      bodyHtml = `
        ${groupNameHtml}
        ${thoughtHtml}
        <div class="partner-content-wrapper">
          ${msg.content ? formatMessageContent(msg.content) : ''}
          ${mediaHtml}
        </div>
      `;
    }

    row.innerHTML = bodyHtml;
    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

// Process Mention and Removal Commands (@ and @rm-)
function processGroupCommands(chat, text) {
  if (!chat || (chat.type !== 'channel' && chat.type !== 'group')) return;
  if (!chat.members) chat.members = [state.currentUser.name];

  // 1. Process @rm- commands (e.g. @rm-Hậu, @rm-Nguyễn Quang Tùng)
  const rmRegex = /@rm-([a-zA-Z0-9_\u00C0-\u1EF9\s]+)/gi;
  let rmMatch;
  while ((rmMatch = rmRegex.exec(text)) !== null) {
    const targetName = rmMatch[1].trim();
    const foundMember = chat.members.find(m => m.toLowerCase().includes(targetName.toLowerCase()));
    if (foundMember && foundMember !== state.currentUser.name) {
      chat.members = chat.members.filter(m => m !== foundMember);
      chat.membersCount = `${chat.members.length} thành viên`;
      chat.messages.push({
        id: 'sys_' + Date.now(),
        isSystem: true,
        eventType: 'danger',
        content: `🚫 ${foundMember} đã được mời rời khỏi nhóm chat.`
      });
      showToast(`Đã xóa ${foundMember} khỏi nhóm.`, '🚫');
    }
  }

  // 2. Process @ Mentions to add new members
  const mentionRegex = /@([a-zA-Z0-9_\u00C0-\u1EF9\s]+)/gi;
  let mentionMatch;
  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    const rawName = mentionMatch[1].trim();
    if (rawName.startsWith('rm-')) continue;

    const matchedContact = CONTACTS_DIRECTORY.find(c => c.name.toLowerCase().includes(rawName.toLowerCase()) || rawName.toLowerCase().includes(c.name.toLowerCase()));
    const memberName = matchedContact ? matchedContact.name : rawName;

    if (memberName && !chat.members.includes(memberName)) {
      chat.members.push(memberName);
      chat.membersCount = `${chat.members.length} thành viên`;
      chat.messages.push({
        id: 'sys_' + Date.now(),
        isSystem: true,
        eventType: 'success',
        content: `👥 ${memberName} đã được thêm vào nhóm chat qua thẻ @tag.`
      });
      showToast(`Đã thêm ${memberName} vào nhóm!`, '👥');
    }
  }
}

// Autocomplete Popup Handlers for @ in Textarea
function setupMentionAutocomplete(textarea, popupEl, itemsEl) {
  if (!textarea || !popupEl || !itemsEl) return;

  let selectedIndex = 0;

  const updateSelection = (items) => {
    items.forEach((it, idx) => {
      if (idx === selectedIndex) {
        it.classList.add('selected');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('selected');
      }
    });
  };

  const handleInput = () => {
    const val = textarea.value;
    const cursor = textarea.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    
    // Match last word before cursor starting with @ or @rm-
    const match = textBeforeCursor.match(/(@rm-[a-zA-Z0-9_\u00C0-\u1EF9]*|@[a-zA-Z0-9_\u00C0-\u1EF9]*)$/i);
    
    if (!match) {
      popupEl.classList.add('hidden');
      return;
    }

    const lastWord = match[0];

    if (lastWord.startsWith('@rm-')) {
      const currentChat = state.chats[state.currentChatId];
      if (!currentChat || !currentChat.members) {
        popupEl.classList.add('hidden');
        return;
      }
      const query = lastWord.slice(4).toLowerCase();
      const removable = currentChat.members.filter(m => m !== state.currentUser.name && m.toLowerCase().includes(query));

      if (removable.length === 0) {
        popupEl.classList.add('hidden');
        return;
      }

      itemsEl.innerHTML = '';
      selectedIndex = 0;

      removable.forEach((name, idx) => {
        const item = document.createElement('div');
        item.className = 'mention-item' + (idx === 0 ? ' selected' : '');
        item.innerHTML = `
          <div class="mention-item-avatar" style="background: rgba(245, 101, 101, 0.2); color: #f87171;">✕</div>
          <span class="mention-item-name" style="color: #f87171;">Xóa @${escapeHtml(name)}</span>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          insertMention(textarea, lastWord, `@rm-${name} `);
          popupEl.classList.add('hidden');
        });
        itemsEl.appendChild(item);
      });
      popupEl.classList.remove('hidden');

    } else if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const matches = CONTACTS_DIRECTORY.filter(c => c.name.toLowerCase().includes(query) || c.role.toLowerCase().includes(query));

      if (matches.length === 0) {
        popupEl.classList.add('hidden');
        return;
      }

      itemsEl.innerHTML = '';
      selectedIndex = 0;

      matches.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'mention-item' + (idx === 0 ? ' selected' : '');
        const initials = c.name.split(' ').map(n => n[0]).slice(-2).join('');
        item.innerHTML = `
          <div class="mention-item-avatar">${initials}</div>
          <span class="mention-item-name">${escapeHtml(c.name)}</span>
          <span class="mention-item-role">${escapeHtml(c.role)}</span>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          insertMention(textarea, lastWord, `@${c.name} `);
          popupEl.classList.add('hidden');
        });
        itemsEl.appendChild(item);
      });
      popupEl.classList.remove('hidden');
    } else {
      popupEl.classList.add('hidden');
    }
  };

  textarea.addEventListener('input', handleInput);
  textarea.addEventListener('keyup', (e) => {
    if (e.key === '@') handleInput();
  });
  textarea.addEventListener('focus', handleInput);

  // Keyboard navigation inside autocomplete popup
  textarea.addEventListener('keydown', (e) => {
    if (popupEl.classList.contains('hidden')) return;

    const items = itemsEl.querySelectorAll('.mention-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateSelection(items);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        e.preventDefault();
        items[selectedIndex].click();
      }
    } else if (e.key === 'Escape') {
      popupEl.classList.add('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (!popupEl.contains(e.target) && e.target !== textarea) {
      popupEl.classList.add('hidden');
    }
  });
}

function insertMention(textarea, lastWord, replacement) {
  const val = textarea.value;
  const cursor = textarea.selectionStart || val.length;
  const before = val.slice(0, cursor - lastWord.length);
  const after = val.slice(cursor);
  textarea.value = before + replacement + after;
  const newPos = before.length + replacement.length;
  textarea.setSelectionRange(newPos, newPos);
  textarea.focus();
}

// Media Attachment Staging Renderer
function renderStagedAttachments() {
  if (!state.stagedAttachments) state.stagedAttachments = [];
  const heroStrip = document.getElementById('heroAttachmentStaging');
  const activeStrip = document.getElementById('activeAttachmentStaging');
  
  [heroStrip, activeStrip].forEach(strip => {
    if (!strip) return;
    if (state.stagedAttachments.length === 0) {
      strip.classList.add('hidden');
      strip.innerHTML = '';
      return;
    }
    strip.classList.remove('hidden');
    strip.innerHTML = '';
    state.stagedAttachments.forEach((att, idx) => {
      const badge = document.createElement('div');
      badge.className = 'staged-media-badge';
      let iconOrThumb = att.type === 'image' ? `<img src="${att.url}" class="staged-thumb-img">` : (att.type === 'video' ? '🎬' : (att.type === 'file' ? '📄' : '🎙️'));
      badge.innerHTML = `
        ${iconOrThumb}
        <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(att.name || att.type)}</span>
        <span class="staged-remove-btn" onclick="removeStagedAttachment(${idx})" title="Gỡ bỏ">✕</span>
      `;
      strip.appendChild(badge);
    });
  });
}

window.removeStagedAttachment = function(idx) {
  if (state.stagedAttachments) {
    state.stagedAttachments.splice(idx, 1);
    renderStagedAttachments();
  }
};

// Handle Hero Input Send (Smart Tag @ Routing: Tag 1 person -> 1-1 DM, Tag 2+ -> Group Chat)
function handleHeroSend() {
  const text = elements.heroChatInput?.value.trim() || '';
  const hasStaged = state.stagedAttachments && state.stagedAttachments.length > 0;
  if (!text && !hasStaged) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  let targetChatId = null;

  // Build message payload
  const newMsg = {
    id: 'm_' + Date.now(),
    author: state.currentUser.name,
    role: state.currentUser.role || '',
    time: timeStr,
    content: text
  };

  // Attach staged media
  if (hasStaged) {
    state.stagedAttachments.forEach(att => {
      if (att.type === 'image') {
        newMsg.image = att.url;
        newMsg.imageCaption = att.caption || att.name;
      } else if (att.type === 'video') {
        newMsg.video = att.url;
        newMsg.videoCaption = att.caption || att.name;
      } else if (att.type === 'file') {
        newMsg.file = { name: att.name, size: att.size, type: att.fileType, url: att.url || '#' };
      } else if (att.type === 'voice') {
        newMsg.voice = { duration: att.duration, url: att.url || 'sample' };
      }
    });
    state.stagedAttachments = [];
    renderStagedAttachments();
  }

  // 1. Extract all @mentions from input text
  const mentionRegex = /@([a-zA-Z0-9_\u00C0-\u1EF9\s]+)/gi;
  const taggedUsers = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (raw.startsWith('rm-')) continue;
    const foundContact = CONTACTS_DIRECTORY.find(c => c.name.toLowerCase().includes(raw.toLowerCase()) || raw.toLowerCase().includes(c.name.toLowerCase()));
    const finalName = foundContact ? foundContact.name : raw;
    if (finalName && !taggedUsers.includes(finalName)) {
      taggedUsers.push(finalName);
    }
  }

  if (taggedUsers.length === 1) {
    // ==========================================
    // CASE 1: TAG @ 1 PERSON -> 1-1 DIRECT CHAT
    // ==========================================
    const recipient = taggedUsers[0];
    const existingId = Object.keys(state.chats).find(id => state.chats[id].title.toLowerCase() === recipient.toLowerCase() && state.chats[id].type === 'direct');

    if (existingId) {
      targetChatId = existingId;
    } else {
      targetChatId = 'chat_' + Date.now();
      state.chats[targetChatId] = {
        title: recipient,
        type: 'direct',
        members: [state.currentUser.name, recipient],
        membersCount: 'Đang trực tuyến',
        unread: 0,
        messages: []
      };
    }

    state.chats[targetChatId].messages.push(newMsg);
    showToast(`👤 Tin nhắn trực tiếp tới ${recipient}!`, '💬');

  } else if (taggedUsers.length > 1) {
    // ==========================================
    // CASE 2: TAG @ NHIỀU NGƯỜI -> GROUP CHAT
    // ==========================================
    const groupTitle = `Nhóm ${taggedUsers.slice(0, 2).join(', ')}${taggedUsers.length > 2 ? ` +${taggedUsers.length - 2}` : ''}`;
    targetChatId = 'chat_' + Date.now();
    state.chats[targetChatId] = {
      title: groupTitle,
      type: 'group',
      members: [state.currentUser.name, ...taggedUsers],
      membersCount: `${taggedUsers.length + 1} thành viên`,
      unread: 0,
      messages: [
        {
          id: 'sys_' + Date.now(),
          isSystem: true,
          type: 'system',
          content: `Nhóm "${groupTitle}" đã được tạo với các thành viên: ${taggedUsers.join(', ')}.`
        },
        newMsg
      ]
    };
    showToast(`👥 Đã tạo nhóm chat với ${taggedUsers.length} người bạn!`, '👥');

  } else {
    // ==========================================
    // CASE 3: KHÔNG TAG AI (FALLBACK THEO CHẾ ĐỘ)
    // ==========================================
    if (state.heroMode === 'chat') {
      const recipient = state.heroSelectedRecipient || 'Lương Thanh Hậu';
      const existingId = Object.keys(state.chats).find(id => state.chats[id].title.toLowerCase() === recipient.toLowerCase() && state.chats[id].type === 'direct');

      if (existingId) {
        targetChatId = existingId;
      } else {
        targetChatId = 'chat_' + Date.now();
        state.chats[targetChatId] = {
          title: recipient,
          type: 'direct',
          members: [state.currentUser.name, recipient],
          membersCount: 'Đang trực tuyến',
          unread: 0,
          messages: []
        };
      }

      state.chats[targetChatId].messages.push(newMsg);

    } else {
      const groupTarget = state.heroSelectedRecipient || 'Dự Án Chung 🚀';
      const existingId = Object.keys(state.chats).find(id => state.chats[id].title.toLowerCase() === groupTarget.toLowerCase() && (state.chats[id].type === 'channel' || state.chats[id].type === 'group' || state.chats[id].type === 'global_channel'));

      if (existingId) {
        targetChatId = existingId;
      } else {
        targetChatId = 'chat_' + Date.now();
        state.chats[targetChatId] = {
          title: groupTarget,
          type: 'group',
          members: [state.currentUser.name],
          membersCount: '1 thành viên',
          unread: 0,
          messages: []
        };
      }

      state.chats[targetChatId].messages.push(newMsg);
    }
  }

  enforceMessageLimits(targetChatId);
  saveState();

  // Send to Realtime WebSocket or REST fallback
  if (socket && socket.connected) {
    socket.emit('join_chat', { chatId: targetChatId });
    socket.emit('send_message', {
      ...newMsg,
      chatId: targetChatId
    });
  } else {
    const headers = { 'Content-Type': 'application/json' };
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;
    fetch(`/api/chats/${targetChatId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newMsg)
    }).catch(() => {});
  }

  elements.heroChatInput.value = '';
  autoResizeTextarea(elements.heroChatInput);
  elements.heroSendBtn?.classList.remove('active');
  document.getElementById('heroHelperBanner')?.classList.add('hidden');
  state.isCreatingNewGroup = false;

  renderSidebarChats();
  showChatView(targetChatId);
  playChimeSound('send');
}

// Handle Active Chat Input Send
function handleActiveChatSend() {
  const text = elements.activeChatInput?.value.trim() || '';
  const hasStaged = state.stagedAttachments && state.stagedAttachments.length > 0;
  if ((!text && !hasStaged) || !state.currentChatId) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentChat = state.chats[state.currentChatId];
  if (!currentChat) return;

  // Process @ and @rm- commands for group chats
  processGroupCommands(currentChat, text);

  const newMsg = {
    id: 'm_' + Date.now(),
    sender_id: state.currentUser?.id,
    author: state.currentUser?.name || 'Thành viên',
    role: state.currentUser?.role || '',
    time: timeStr,
    content: text
  };

  // Attach staged media
  if (hasStaged) {
    state.stagedAttachments.forEach(att => {
      if (att.type === 'image') {
        newMsg.image = att.url;
        newMsg.imageCaption = att.caption || att.name;
      } else if (att.type === 'video') {
        newMsg.video = att.url;
        newMsg.videoCaption = att.caption || att.name;
      } else if (att.type === 'file') {
        newMsg.file = { name: att.name, size: att.size, type: att.fileType, url: att.url || '#' };
      } else if (att.type === 'voice') {
        newMsg.voice = { duration: att.duration, url: att.url || 'sample' };
      }
    });
    state.stagedAttachments = [];
    renderStagedAttachments();
  }

  currentChat.messages.push(newMsg);
  enforceMessageLimits(state.currentChatId);
  saveState();

  // Send via Socket.io Realtime Engine or REST API fallback
  if (socket && socket.connected) {
    socket.emit('send_message', {
      ...newMsg,
      chatId: state.currentChatId
    });
    socket.emit('typing_stop', { chatId: state.currentChatId, userName: state.currentUser.name });
  } else {
    // REST API fallback
    const headers = { 'Content-Type': 'application/json' };
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`;
    fetch(`/api/chats/${state.currentChatId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newMsg)
    }).catch(() => {});
  }

  elements.activeChatInput.value = '';
  autoResizeTextarea(elements.activeChatInput);

  renderCurrentChat();
  renderSidebarChats();
  playChimeSound('send');
}


// Render Projects Grid View (with filter: all, groups, friends)
function renderProjectsGrid(filter = 'all') {
  if (!elements.projectsGrid) return;
  elements.projectsGrid.innerHTML = '';

  const allChatIds = Object.keys(state.chats);
  const groupIds = allChatIds.filter(id => state.chats[id].type === 'channel' || state.chats[id].type === 'group');
  const friendIds = allChatIds.filter(id => state.chats[id].type === 'direct');

  if (elements.allCount) elements.allCount.textContent = allChatIds.length;
  if (elements.groupsCount) elements.groupsCount.textContent = groupIds.length;
  if (elements.friendsCount) elements.friendsCount.textContent = friendIds.length;

  let displayIds = allChatIds;
  if (filter === 'groups') displayIds = groupIds;
  if (filter === 'friends') displayIds = friendIds;

  if (displayIds.length === 0) {
    elements.projectsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        Chưa có mục nào trong danh mục này.
      </div>
    `;
    return;
  }

  displayIds.forEach(chatId => {
    const chat = state.chats[chatId];
    const card = document.createElement('div');
    card.className = 'project-card';

    const isGroup = chat.type === 'channel' || chat.type === 'group';
    const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
    const lastContent = lastMsg ? (lastMsg.content.length > 80 ? lastMsg.content.substring(0, 80) + '...' : lastMsg.content) : 'Chưa có tin nhắn nào';
    const lastTime = lastMsg ? lastMsg.time : 'Hôm nay';

    card.innerHTML = `
      <div class="project-card-top">
        <div class="project-card-title-group">
          <span class="project-card-title">${escapeHtml(chat.title)}</span>
          <span class="project-card-type-tag">${isGroup ? '👥 Nhóm chat' : '🟢 Bạn bè (Online)'}</span>
        </div>
      </div>
      <div class="project-card-snippet">${escapeHtml(lastContent)}</div>
      <div class="project-card-footer">
        <span>⏱ ${lastTime} · ${chat.membersCount || ''}</span>
        <span style="color: var(--accent-coral); font-weight: 500;">${isGroup ? 'Vào nhóm →' : 'Nhắn tin →'}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      showChatView(chatId);
    });

    elements.projectsGrid.appendChild(card);
  });
}

// Populate Quick Session Switcher Dropdown
function populateQuickSessionMenu() {
  const list = elements.sessionQuickItems;
  if (!list) return;
  list.innerHTML = '';

  Object.keys(state.chats).forEach(chatId => {
    const chat = state.chats[chatId];
    const isGroup = chat.type === 'channel' || chat.type === 'group';
    const item = document.createElement('div');
    item.className = 'dropdown-item' + (state.currentChatId === chatId ? ' selected' : '');
    item.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span>${isGroup ? '👥 ' : '👤 '}${escapeHtml(chat.title)}</span>
        <span style="font-size: 11px; opacity: 0.6;">${chat.membersCount || ''}</span>
      </div>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.sessionQuickMenu?.classList.add('hidden');
      showChatView(chatId);
    });
    list.appendChild(item);
  });
}

// Setup All Event Listeners
function setupEventListeners() {
  // Sidebar Toggles
  elements.collapseSidebarBtn?.addEventListener('click', toggleSidebar);
  elements.openSidebarBtn?.addEventListener('click', toggleSidebar);
  elements.mobileSidebarToggle?.addEventListener('click', toggleSidebar);

  // Keyboard shortcut: Ctrl + \ to toggle sidebar, Ctrl + K for search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openModal(elements.searchModal);
      elements.globalSearchInput?.focus();
    }
  });

  // Sidebar Brand Logo -> Return to Hero View
  elements.brandLogo?.addEventListener('click', showHeroView);

  // New Chat Button -> DIRECTLY Return to Clean Empty Hero View like Claude!
  elements.newChatBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showHeroView();
  });

  // Mode Toggle (Chat vs Cowork)
  elements.modeChatBtn?.addEventListener('click', () => {
    state.heroMode = 'chat';
    elements.modeChatBtn?.classList.add('active');
    elements.modeCoworkBtn?.classList.remove('active');
    state.heroSelectedRecipient = 'Lương Thanh Hậu';
    updateHeroDropdownItems();
  });

  elements.modeCoworkBtn?.addEventListener('click', () => {
    state.heroMode = 'cowork';
    elements.modeCoworkBtn?.classList.add('active');
    elements.modeChatBtn?.classList.remove('active');
    state.heroSelectedRecipient = 'Dự Án Chung 🚀';
    updateHeroDropdownItems();
  });

  // Model Dropdown Toggle
  elements.modelDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.modelDropdownMenu?.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    elements.modelDropdownMenu?.classList.remove('show');
  });

  // Setup Autocomplete for @ in Hero and Active Chat Textareas
  setupMentionAutocomplete(elements.activeChatInput, elements.activeMentionAutocomplete, elements.activeMentionItems);
  setupMentionAutocomplete(elements.heroChatInput, document.getElementById('mentionAutocomplete'), document.getElementById('mentionItems'));

  // Close Helper Banner Button
  document.getElementById('closeHelperBannerBtn')?.addEventListener('click', () => {
    document.getElementById('heroHelperBanner')?.classList.add('hidden');
    state.isCreatingNewGroup = false;
  });

  // Sidebar Navigation Items
  elements.navProjects?.addEventListener('click', (e) => {
    e.preventDefault();
    showProjectsView();
  });

  elements.navConnect?.addEventListener('click', (e) => {
    e.preventDefault();
    openNewChatModal();
  });

  elements.navCustomize?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(elements.customizeModal);
  });

  // Projects View Buttons
  elements.projectCreateNewBtn?.addEventListener('click', () => {
    createNewGroupDirect();
  });

  elements.projectConnectBtn?.addEventListener('click', () => {
    openModal(elements.connectModal);
  });

  // Top Header Session Dropdown Quick Menu
  elements.sessionDropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    populateQuickSessionMenu();
    elements.sessionQuickMenu?.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    elements.sessionQuickMenu?.classList.add('hidden');
  });

  elements.menuCreateNewSession?.addEventListener('click', () => {
    elements.sessionQuickMenu?.classList.add('hidden');
    showHeroView();
  });

  // Plan Banner Close & Upgrade
  elements.closePlanBannerBtn?.addEventListener('click', () => {
    if (elements.topPlanBanner) elements.topPlanBanner.style.display = 'none';
  });

  elements.planUpgradeLink?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Bạn đang sử dụng phiên bản P2P Miễn phí đầy đủ tính năng!', '🚀');
  });

  // Filter Tabs in Projects View
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter') || 'all';
      renderProjectsGrid(filter);
    });
  });

  // Attachment Popovers Toggle
  const heroAttachBtn = document.getElementById('heroAttachBtn');
  const heroAttachMenu = document.getElementById('heroAttachMenu');
  const activeAttachBtn = document.getElementById('activeAttachBtn');
  const activeAttachMenu = document.getElementById('activeAttachMenu');
  const hiddenFileInput = document.getElementById('hiddenFileInput');

  heroAttachBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    heroAttachMenu?.classList.toggle('hidden');
  });

  activeAttachBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    activeAttachMenu?.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    heroAttachMenu?.classList.add('hidden');
    activeAttachMenu?.classList.add('hidden');
  });

  // Handle Attachment Menu Item Clicks
  document.querySelectorAll('.attachment-popover-menu .attach-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      heroAttachMenu?.classList.add('hidden');
      activeAttachMenu?.classList.add('hidden');
      const type = item.getAttribute('data-type');

      if (type === 'image') {
        if (hiddenFileInput) {
          hiddenFileInput.accept = 'image/*';
          hiddenFileInput.setAttribute('data-target-type', 'image');
          hiddenFileInput.click();
        }
      } else if (type === 'video') {
        if (hiddenFileInput) {
          hiddenFileInput.accept = 'video/*';
          hiddenFileInput.setAttribute('data-target-type', 'video');
          hiddenFileInput.click();
        }
      } else if (type === 'file') {
        if (hiddenFileInput) {
          hiddenFileInput.accept = '.pdf,.doc,.docx,.txt,.json,.py,.zip';
          hiddenFileInput.setAttribute('data-target-type', 'file');
          hiddenFileInput.click();
        }
      } else if (type === 'voice') {
        state.stagedAttachments.push({
          type: 'voice',
          name: 'Voice note (0:18)',
          duration: '0:18'
        });
        renderStagedAttachments();
        showToast('Đã đính kèm ghi âm giọng nói!', '🎙️');
      }
    });
  });

  // Hidden File Input Change Handler
  hiddenFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const targetType = hiddenFileInput.getAttribute('data-target-type') || 'file';
    
    // Upload to server if available
    const uploadResult = await uploadFileToServer(file);
    const serverUrl = uploadResult ? uploadResult.url : null;

    if (targetType === 'image') {
      const reader = new FileReader();
      reader.onload = (re) => {
        state.stagedAttachments.push({
          type: 'image',
          name: file.name,
          url: serverUrl || re.target.result,
          caption: file.name
        });
        renderStagedAttachments();
        showToast(`Đã đính kèm ảnh "${file.name}"!`, '🖼️');
      };
      reader.readAsDataURL(file);
    } else if (targetType === 'video') {
      const reader = new FileReader();
      reader.onload = (re) => {
        state.stagedAttachments.push({
          type: 'video',
          name: file.name,
          url: serverUrl || re.target.result,
          caption: file.name
        });
        renderStagedAttachments();
        showToast(`Đã đính kèm video "${file.name}"!`, '🎬');
      };
      reader.readAsDataURL(file);
    } else {
      const sizeStr = uploadResult ? uploadResult.fileSize : ((file.size / (1024 * 1024)).toFixed(1) + ' MB');
      state.stagedAttachments.push({
        type: 'file',
        name: file.name,
        size: sizeStr,
        fileType: file.name.split('.').pop(),
        url: serverUrl || '#'
      });
      renderStagedAttachments();
      showToast(`Đã đính kèm tài liệu "${file.name}"!`, '📄');
    }

    hiddenFileInput.value = '';
  });

  // Lightbox Close
  document.getElementById('closeLightboxBtn')?.addEventListener('click', () => {
    document.getElementById('imageLightboxModal')?.classList.add('hidden');
  });

  document.getElementById('imageLightboxModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'imageLightboxModal') {
      document.getElementById('imageLightboxModal')?.classList.add('hidden');
    }
  });

  // Clipboard Image Paste (Ctrl + V)
  document.addEventListener('paste', async (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const uploadResult = await uploadFileToServer(blob);
        const serverUrl = uploadResult ? uploadResult.url : null;

        const reader = new FileReader();
        reader.onload = (re) => {
          state.stagedAttachments.push({
            type: 'image',
            name: `Pasted_Image_${Date.now()}.png`,
            url: serverUrl || re.target.result,
            caption: 'Ảnh dán từ clipboard'
          });
          renderStagedAttachments();
          showToast('Đã dán ảnh từ clipboard vào tin nhắn!', '📋');
        };
        reader.readAsDataURL(blob);
      }
    }
  });

  // Modal Closures
  elements.closeConnectModalBtn?.addEventListener('click', () => closeModal(elements.connectModal));
  elements.doneConnectBtn?.addEventListener('click', () => closeModal(elements.connectModal));
  elements.closeCustomizeModalBtn?.addEventListener('click', () => closeModal(elements.customizeModal));
  elements.closeCustomizeModalBtn2?.addEventListener('click', () => closeModal(elements.customizeModal));
  elements.saveCustomizeBtn?.addEventListener('click', handleSaveCustomize);
  elements.closeAuthModalBtn?.addEventListener('click', hideAuthModal);
  elements.guestContinueBtn?.addEventListener('click', hideAuthModal);
  elements.downloadTranscriptBtn?.addEventListener('click', handleDownloadTranscript);

  // Search Modal
  elements.searchChatsBtn?.addEventListener('click', () => {
    openModal(elements.searchModal);
    elements.globalSearchInput?.focus();
  });
  elements.closeSearchModalBtn?.addEventListener('click', () => closeModal(elements.searchModal));
  elements.globalSearchInput?.addEventListener('input', handleGlobalSearch);

  // Profile Modal & Real Account Info
  elements.userProfileBtn?.addEventListener('click', () => {
    if (state.currentUser && state.authToken) {
      const nameText = document.getElementById('profileDisplayNameText');
      const usernameText = document.getElementById('profileUsernameText');
      const avatarDisplay = document.getElementById('profileAvatarDisplay');
      if (nameText) nameText.textContent = state.currentUser.name;
      if (usernameText) usernameText.textContent = '@' + (state.currentUser.username || state.currentUser.name.toLowerCase().replace(/\s+/g, ''));
      if (avatarDisplay) avatarDisplay.textContent = state.currentUser.name.charAt(0).toUpperCase();

      if (elements.profileNameInput) elements.profileNameInput.value = state.currentUser.name;
      if (elements.profileRoleInput) elements.profileRoleInput.value = state.currentUser.role;
      if (elements.profileIdInput) elements.profileIdInput.value = state.currentUser.id || '';
      openModal(elements.profileModal);
    } else {
      showAuthModal();
    }
  });
  elements.closeProfileModalBtn?.addEventListener('click', () => closeModal(elements.profileModal));
  elements.cancelProfileBtn?.addEventListener('click', () => closeModal(elements.profileModal));
  elements.saveProfileBtn?.addEventListener('click', handleSaveProfile);

  // Logout & Auth Buttons
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('headerLogoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('headerAuthBtn')?.addEventListener('click', showAuthModal);

  // Auth Tabs (Login vs Register)
  document.getElementById('authTabLogin')?.addEventListener('click', () => {
    document.getElementById('authTabLogin')?.classList.add('active');
    document.getElementById('authTabRegister')?.classList.remove('active');
    document.getElementById('loginForm')?.classList.remove('hidden');
    document.getElementById('registerForm')?.classList.add('hidden');
    clearAuthAlert();
    document.getElementById('loginUsername')?.focus();
  });

  document.getElementById('authTabRegister')?.addEventListener('click', () => {
    document.getElementById('authTabRegister')?.classList.add('active');
    document.getElementById('authTabLogin')?.classList.remove('active');
    document.getElementById('registerForm')?.classList.remove('hidden');
    document.getElementById('loginForm')?.classList.add('hidden');
    clearAuthAlert();
    document.getElementById('regUsername')?.focus();
  });

  // Auth Form Submissions
  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername')?.value.trim();
    const p = document.getElementById('loginPassword')?.value;
    if (u && p) handleLogin(u, p);
  });

  document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('regUsername')?.value.trim();
    const d = document.getElementById('regDisplayName')?.value.trim();
    const r = document.getElementById('regRole')?.value.trim() || 'Thành viên';
    const p = document.getElementById('regPassword')?.value;
    const cp = document.getElementById('regConfirmPassword')?.value;
    if (u && d && p) handleRegister(u, d, r, p, cp);
  });

  // New Chat Modal Tabs & Submission
  document.querySelectorAll('.new-modal-tabs .segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.new-modal-tabs .segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      document.getElementById('formDirectSection')?.classList.toggle('hidden', type !== 'direct');
      document.getElementById('formExistingGroupSection')?.classList.toggle('hidden', type !== 'existing-group');
      document.getElementById('formCreateGroupSection')?.classList.toggle('hidden', type !== 'create-group');
    });
  });

  document.getElementById('closeNewChatModalBtn')?.addEventListener('click', () => closeModal(document.getElementById('newChatModal')));
  document.getElementById('cancelNewChatBtn')?.addEventListener('click', () => closeModal(document.getElementById('newChatModal')));
  document.getElementById('submitNewChatBtn')?.addEventListener('click', handleSubmitNewChat);

  // Modal Backdrop click to close
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Copy My ID
  elements.copyMyIdBtn?.addEventListener('click', () => {
    const id = elements.myIdCode?.textContent || 'shiina-p2p-7014';
    navigator.clipboard?.writeText(id);
    showToast('Đã sao chép mã P2P ID vào clipboard!', '📋');
    const btnSpan = elements.copyMyIdBtn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Copied!';
    setTimeout(() => { if (btnSpan) btnSpan.textContent = 'Copy'; }, 1500);
  });

  // Connect target ID
  elements.connectTargetBtn?.addEventListener('click', handleConnectTarget);

  // Test Sound Button
  elements.testSoundBtn?.addEventListener('click', () => {
    playChimeSound('chime');
  });

  // Theme selector radio options in Customize Modal
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const theme = opt.getAttribute('data-theme');
      applyTheme(theme);
      state.settings.theme = theme;
    });
  });

  // Hero Chat Input Actions
  elements.heroChatInput?.addEventListener('input', () => {
    autoResizeTextarea(elements.heroChatInput);
    if (elements.heroChatInput.value.trim().length > 0) {
      elements.heroSendBtn?.classList.add('active');
    } else {
      elements.heroSendBtn?.classList.remove('active');
    }
  });

  elements.heroChatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleHeroSend();
    }
  });

  elements.heroSendBtn?.addEventListener('click', handleHeroSend);

  // Active Chat Input Actions
  elements.activeChatInput?.addEventListener('input', () => {
    autoResizeTextarea(elements.activeChatInput);
    if (socket && socket.connected && state.currentChatId) {
      socket.emit('typing_start', { chatId: state.currentChatId, userName: state.currentUser.name });
      clearTimeout(typingDebounceTimer);
      typingDebounceTimer = setTimeout(() => {
        socket.emit('typing_stop', { chatId: state.currentChatId, userName: state.currentUser.name });
      }, 1500);
    }
  });

  elements.activeChatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleActiveChatSend();
    }
  });

  elements.activeSendBtn?.addEventListener('click', handleActiveChatSend);

  // Quick Action Chips on Hero screen
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (elements.heroChatInput) {
        elements.heroChatInput.value = prompt;
        autoResizeTextarea(elements.heroChatInput);
        elements.heroChatInput.focus();
        elements.heroSendBtn?.classList.add('active');
      }
    });
  });

  // Artifacts Panel Controls
  elements.closeArtifactBtn?.addEventListener('click', closeArtifacts);
  elements.copyArtifactBtn?.addEventListener('click', () => {
    const code = elements.artifactCodeBlock?.textContent || '';
    navigator.clipboard?.writeText(code);
    showToast('Đã sao chép mã nguồn vào clipboard!', '📋');
  });

  elements.tabCode?.addEventListener('click', () => switchArtifactTab('code'));
  elements.tabPreview?.addEventListener('click', () => switchArtifactTab('preview'));
  elements.tabHistory?.addEventListener('click', () => switchArtifactTab('history'));

  // Download Transcript Button
  elements.downloadTranscriptBtn?.addEventListener('click', handleDownloadTranscript);
}

// Handle Connect Target ID
function handleConnectTarget() {
  const targetId = elements.targetIdInput?.value.trim();
  if (!targetId) return;

  const newChatKey = 'chat_' + Date.now();
  state.chats[newChatKey] = {
    title: targetId,
    type: 'direct',
    members: [state.currentUser.name, targetId],
    membersCount: 'Đã kết nối P2P',
    unread: 0,
    messages: [
      {
        id: 'm_' + Date.now(),
        author: targetId,
        time: 'Vừa xong',
        content: `Đã thiết lập kênh kết nối P2P trực tiếp với ID [${targetId}]. Mọi tin nhắn đều được mã hóa an toàn.`
      }
    ]
  };

  saveState();
  closeModal(elements.connectModal);
  if (elements.targetIdInput) elements.targetIdInput.value = '';
  renderSidebarChats();
  showChatView(newChatKey);
  showToast(`Đã kết nối P2P thành công với ${targetId}!`, '🔗');
}

// Handle Save Customization
function handleSaveCustomize() {
  state.settings.soundEnabled = elements.soundToggle?.checked ?? true;
  state.settings.notificationsEnabled = elements.notifToggle?.checked ?? true;
  saveState();
  closeModal(elements.customizeModal);
  showToast('Đã lưu cài đặt giao diện & âm thanh!', '⚙️');
}

// Handle Save Profile
function handleSaveProfile() {
  const name = elements.profileNameInput?.value.trim() || 'Shiina';
  const role = elements.profileRoleInput?.value.trim() || 'Quản trị viên';
  state.currentUser.name = name;
  state.currentUser.role = role;
  state.currentUser.initials = name.charAt(0).toUpperCase();

  const currentUserNameEl = document.querySelector('.user-name');
  const currentUserAvatarEl = document.querySelector('.user-avatar');
  if (currentUserNameEl) currentUserNameEl.textContent = name;
  if (currentUserAvatarEl) currentUserAvatarEl.textContent = state.currentUser.initials;

  closeModal(elements.profileModal);
  showToast('Đã cập nhật thông tin hồ sơ!', '👤');
}

// Handle Global Search
function handleGlobalSearch() {
  const query = elements.globalSearchInput?.value.trim().toLowerCase();
  const list = elements.searchResultsList;
  if (!list) return;

  if (!query) {
    list.innerHTML = `
      <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">
        Nhập từ khóa để tìm nhanh tin nhắn hoặc bạn bè
      </div>
    `;
    return;
  }

  const results = [];
  Object.keys(state.chats).forEach(chatId => {
    const chat = state.chats[chatId];
    if (chat.title.toLowerCase().includes(query)) {
      results.push({
        chatId: chatId,
        title: chat.title,
        snippet: `Hội thoại: ${chat.type === 'channel' || chat.type === 'group' ? 'Nhóm chat' : 'Bạn bè'}`,
        time: 'Tên phòng'
      });
    }
    chat.messages.forEach(m => {
      if (m.content && m.content.toLowerCase().includes(query)) {
        results.push({
          chatId: chatId,
          title: chat.title,
          snippet: `[${m.author}]: ${m.content}`,
          time: m.time || 'Hôm nay'
        });
      }
    });
  });

  if (results.length === 0) {
    list.innerHTML = `
      <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">
        Không tìm thấy kết quả phù hợp với "${escapeHtml(query)}"
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  results.forEach(res => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
      <div class="search-res-title">
        <span>${escapeHtml(res.title)}</span>
        <span style="font-size: 11px; color: var(--text-dim);">${escapeHtml(res.time)}</span>
      </div>
      <div class="search-res-snippet">${escapeHtml(res.snippet)}</div>
    `;
    item.addEventListener('click', () => {
      closeModal(elements.searchModal);
      showChatView(res.chatId);
    });
    list.appendChild(item);
  });
}

// Download Transcript as Markdown file
function handleDownloadTranscript() {
  if (!state.currentChatId || !state.chats[state.currentChatId]) {
    showToast('Vui lòng chọn một cuộc trò chuyện để tải nhật ký!', '⚠️');
    return;
  }
  const chat = state.chats[state.currentChatId];
  let md = `# Nhật ký trò chuyện: ${chat.title}\n`;
  md += `Loại: ${chat.type} | Thành viên: ${chat.membersCount || ''} | Xuất lúc: ${new Date().toLocaleString('vi-VN')}\n\n---\n\n`;

  chat.messages.forEach(m => {
    if (m.isSystem) {
      md += `*-- Hệ thống: ${m.content} --*\n\n`;
      return;
    }
    md += `### ${m.author} (${m.time})\n`;
    if (m.thought) md += `> *${m.thought}*\n\n`;
    md += `${m.content}\n\n`;
    if (m.hasArtifact && m.artifactCode) {
      md += `\`\`\`python\n${m.artifactCode}\n\`\`\`\n\n`;
    }
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript_${chat.title.replace(/\s+/g, '_')}_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã tải xuống nhật ký tin nhắn!', '📥');
}

// Toggle Sidebar
function toggleSidebar() {
  state.isSidebarCollapsed = !state.isSidebarCollapsed;
  elements.sidebar?.classList.toggle('collapsed', state.isSidebarCollapsed);
  elements.sidebar?.classList.toggle('open', !state.isSidebarCollapsed);
  document.body.classList.toggle('sidebar-is-collapsed', state.isSidebarCollapsed);
}

// Modal Helpers
function openModal(modal) {
  if (!modal) return;
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
}

// Apply Theme
function applyTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-sepia');
  if (theme === 'light') {
    document.body.classList.add('theme-light');
  } else if (theme === 'sepia') {
    document.body.classList.add('theme-sepia');
  }
}

// Direct Code Artifact Copy Function
window.openArtifact = function(title, encodedCode) {
  try {
    const code = decodeURIComponent(encodedCode);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        showToast(`Đã sao chép mã nguồn "${title}"!`, '📋');
      }).catch(() => {
        fallbackCopyText(code, title);
      });
    } else {
      fallbackCopyText(code, title);
    }
  } catch (e) {
    showToast('Sao chép thất bại', '⚠️');
  }
};

function fallbackCopyText(text, title) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(`Đã sao chép mã nguồn "${title}"!`, '📋');
  } catch (err) {
    showToast('Không thể sao chép!', '⚠️');
  }
  document.body.removeChild(ta);
}

function closeArtifacts() {
  state.isArtifactsOpen = false;
}

function switchArtifactTab(tab) {
  [elements.tabCode, elements.tabPreview, elements.tabHistory].forEach(t => t?.classList.remove('active'));
  
  if (tab === 'code') {
    elements.tabCode?.classList.add('active');
    if (elements.artifactsContent) {
      elements.artifactsContent.innerHTML = `<pre class="code-viewer"><code id="artifactCodeBlock">${escapeHtml(elements.artifactCodeBlock?.textContent || '')}</code></pre>`;
    }
  } else if (tab === 'preview') {
    elements.tabPreview?.classList.add('active');
    if (elements.artifactsContent) {
      elements.artifactsContent.innerHTML = `
        <div style="background: #23221f; border: 1px solid #34332e; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--accent-coral); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 12px auto; font-size: 20px;">💬</div>
          <h3 style="margin-bottom: 4px; color: #ecebe8; font-family: var(--font-sans);">PingPing Network Hub</h3>
          <p style="color: #10b981; font-size: 13px;">🟢 Đang kết nối WebSockets thời gian thực</p>
          <div style="margin-top: 14px; padding: 12px; background: rgba(255,255,255,0.04); border-radius: 6px; font-size: 13px; color: #a3a19b; text-align: left; line-height: 1.6;">
            <div>⚡ Độ trễ mạng: <strong style="color: #fff;">< 30ms</strong></div>
            <div>🔒 Xác thực bảo mật: <strong style="color: #fff;">PBKDF2 + JWT</strong></div>
            <div>👥 Trạng thái hệ thống: <strong style="color: #10b981;">Trực tuyến 100%</strong></div>
          </div>
        </div>
      `;
    }
  } else if (tab === 'history') {
    elements.tabHistory?.classList.add('active');
    if (elements.artifactsContent) {
      elements.artifactsContent.innerHTML = `
        <div style="color: #a3a19b; font-size: 13px; display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 10px; background: #201f1d; border-radius: 6px; border: 1px solid #2f2e29;">
            <div style="font-weight: 600; color: #ecebe8;">Version 2 (Mạng xã hội thời gian thực)</div>
            <div style="font-size: 11.5px; color: #6e6c66; margin-top: 2px;">Tích hợp Auth JWT, PBKDF2 và Socket.io 24/7</div>
          </div>
          <div style="padding: 10px; background: #1a1917; border-radius: 6px; border: 1px solid #282723;">
            <div style="font-weight: 600; color: #a3a19b;">Version 1 (Prototype)</div>
            <div style="font-size: 11.5px; color: #6e6c66; margin-top: 2px;">Giao diện thử nghiệm ban đầu</div>
          </div>
        </div>
      `;
    }
  }
}

// Dynamic Greeting based on time
function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Hello, night owl';
  
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Good afternoon';
  } else if (hour >= 18 && hour < 22) {
    greeting = 'Good evening';
  }

  const el = document.getElementById('greetingText');
  if (el) el.textContent = greeting;
}

// Textarea auto-resize
function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  const newHeight = Math.min(textarea.scrollHeight, 180);
  textarea.style.height = (newHeight > 28 ? newHeight : 28) + 'px';
}

// Helper: Generate Open Graph Link Preview Card
function generateOgCardHtml(url) {
  let domain = 'WEBSITE';
  let title = 'Xem liên kết đính kèm';
  let desc = 'Bấm vào để mở và xem chi tiết trang web được chia sẻ.';
  let thumb = 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&auto=format&fit=crop&q=80';

  try {
    const parsed = new URL(url);
    domain = parsed.hostname.replace('www.', '').toUpperCase();
  } catch (e) {}

  if (url.includes('github.com')) {
    title = 'shiina613/pingping - Nền tảng Chat Realtime Full-stack';
    desc = 'Mạng xã hội trò chuyện thời gian thực Node.js, WebSockets, SQLite bảo mật.';
    thumb = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
  }

  return `
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="og-preview-card">
      <img src="${thumb}" alt="Link Preview" class="og-image-thumb">
      <div class="og-meta-content">
        <div class="og-domain">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>${escapeHtml(domain)}</span>
        </div>
        <div class="og-title">${escapeHtml(title)}</div>
        <div class="og-description">${escapeHtml(desc)}</div>
      </div>
    </a>
  `;
}

function formatMessageContent(content) {
  if (!content) return '';
  
  const paragraphs = content.split(/\n\s*\n/);
  
  const parsed = paragraphs.map(p => {
    let text = escapeHtml(p.trim());
    if (!text) return '';

    // Bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="msg-bold">$1</strong>');
    
    // Italic *text*
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    
    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, '<code class="msg-inline-code">$1</code>');
    
    // Highlight @mentions in text (e.g. @Shiina, @Lương Thanh Hậu, @tung_nq)
    const knownNames = (typeof CONTACTS_DIRECTORY !== 'undefined' && Array.isArray(CONTACTS_DIRECTORY))
      ? CONTACTS_DIRECTORY.map(c => c.name).sort((a, b) => b.length - a.length)
      : ['Shiina', 'Lương Thanh Hậu', 'Nguyễn Quang Tùng', 'Nguyễn Lâm Tùng', 'Alex Rivers', 'Phạm Thu Trang', 'Trần Văn Mạnh', 'Elena Rostova'];
    
    for (const name of knownNames) {
      if (!name) continue;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(`(^|\\s)@${escaped}(?=\\s|$|[.,!?])`, 'gi');
      text = text.replace(reg, (m, prefix) => `${prefix}<span class="mention-tag">@${name}</span>`);
    }
    // Generic username/handle @mentions (e.g. @tung_nl, @alex)
    text = text.replace(/(^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[.,!?])/g, (m, prefix, uname) => `${prefix}<span class="mention-tag">@${uname}</span>`);

    // Detect and highlight URLs
    let detectedUrl = null;
    text = text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
      detectedUrl = match;
      return `<a href="${match}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-coral); text-decoration: underline; word-break: break-all;">${match}</a>`;
    });

    // Line breaks inside paragraph
    text = text.replace(/\n/g, '<br>');

    let ogCardHtml = detectedUrl ? generateOgCardHtml(detectedUrl) : '';

    return `<p class="msg-paragraph">${text}</p>${ogCardHtml}`;
  }).filter(Boolean);

  return parsed.join('');
}

// Lightbox Modal Controller
window.openLightbox = function(src, caption) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImg');
  const title = document.getElementById('lightboxTitle');
  const downloadBtn = document.getElementById('lightboxDownloadBtn');
  
  if (!modal || !img) return;

  img.src = src;
  if (title) title.textContent = caption || 'Xem hình ảnh';
  modal.classList.remove('hidden');

  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = src;
      a.download = `photo_${Date.now()}.jpg`;
      a.target = '_blank';
      a.click();
      showToast('Đang tải hình ảnh xuống...', '📥');
    };
  }
};

// Download Sample File
window.downloadSampleFile = function(fileName) {
  const dummyContent = `# File: ${fileName}\nExported from Claude P2P Chat\nDate: ${new Date().toISOString()}\nStatus: Verified`;
  const blob = new Blob([dummyContent], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Đã tải xuống ${fileName}!`, '📥');
};

// Voice Note Player Simulation
window.toggleVoicePlay = function(btn) {
  const isPlaying = btn.textContent === '⏸';
  const waveform = btn.parentElement.querySelector('.voice-waveform');
  const bars = waveform ? waveform.querySelectorAll('.waveform-bar') : [];

  if (isPlaying) {
    btn.textContent = '▶';
    bars.forEach(b => b.style.height = '10px');
  } else {
    btn.textContent = '⏸';
    playChimeSound('chime');
    let count = 0;
    const interval = setInterval(() => {
      bars.forEach(b => {
        b.style.height = (Math.floor(Math.random() * 14) + 6) + 'px';
      });
      count++;
      if (count > 15) {
        clearInterval(interval);
        btn.textContent = '▶';
        bars.forEach(b => b.style.height = '10px');
      }
    }, 200);
  }
};

// Start application
document.addEventListener('DOMContentLoaded', init);
