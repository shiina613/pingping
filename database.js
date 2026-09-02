const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// Ensure database directory exists (supports Vercel Serverless /tmp)
const isVercel = !!process.env.VERCEL;
const dbDir = isVercel ? '/tmp' : path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const bundledDbPath = path.join(__dirname, 'database', 'pingping.db');
const dbPath = path.join(dbDir, 'pingping.db');

let db = null;
let isReady = false;
let initPromise = null;

// Debounced Disk Persistence
let saveTimeout = null;
function persistToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function schedulePersist() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistToDisk();
  }, 100);
}

// Flush immediately (e.g., before exit)
function flushSync() {
  if (saveTimeout) clearTimeout(saveTimeout);
  persistToDisk();
}

async function initDatabase() {
  if (isReady && db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let wasmConfig = {};
    const bundledWasm = path.join(__dirname, 'database', 'sql-wasm.wasm');
    const nodeModulesWasm = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    if (fs.existsSync(bundledWasm)) {
      wasmConfig = { wasmBinary: fs.readFileSync(bundledWasm) };
    } else if (fs.existsSync(nodeModulesWasm)) {
      wasmConfig = { wasmBinary: fs.readFileSync(nodeModulesWasm) };
    }
    const SQL = await initSqlJs(wasmConfig);
    
    if (fs.existsSync(dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
        console.log('📂 Loaded existing SQLite database from ' + dbPath);
      } catch (e) {
        console.warn('⚠️ Could not load db file, creating new one:', e.message);
        db = new SQL.Database();
      }
    } else if (fs.existsSync(bundledDbPath)) {
      try {
        const fileBuffer = fs.readFileSync(bundledDbPath);
        db = new SQL.Database(fileBuffer);
        console.log('📂 Loaded bundled SQLite database from ' + bundledDbPath);
      } catch (e) {
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
      console.log('✨ Created new SQLite database instance');
    }

    // Create Tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        created_by TEXT,
        members_count_label TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_members (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT NOT NULL,
        role TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_id, user_name)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        sender_id TEXT,
        author TEXT NOT NULL,
        role TEXT,
        content TEXT NOT NULL,
        thought TEXT,
        thought_time TEXT,
        image TEXT,
        image_caption TEXT,
        video TEXT,
        video_caption TEXT,
        file_name TEXT,
        file_size TEXT,
        file_type TEXT,
        file_url TEXT,
        voice_duration TEXT,
        voice_url TEXT,
        msg_type TEXT DEFAULT 'text',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_messages_chat_time ON messages(chat_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON chat_members(chat_id);
    `);

    seedInitialData();
    isReady = true;
    persistToDisk();
    return db;
  })();

  return initPromise;
}

function seedInitialData() {
  const check = db.exec('SELECT COUNT(*) as cnt FROM users');
  const count = (check.length > 0 && check[0].values.length > 0) ? check[0].values[0][0] : 0;
  if (count > 0) return;

  console.log('🌱 Seeding initial PingPing database records...');

  const initialUsers = [
    { id: 'u_shiina', username: 'shiina', password: 'password123', display_name: 'Shiina', role: 'Quản trị viên', avatar_url: '' },
    { id: 'u_hau', username: 'hau', password: 'password123', display_name: 'Lương Thanh Hậu', role: 'Quản lý', avatar_url: '' },
    { id: 'u_tung_nq', username: 'tung_nq', password: 'password123', display_name: 'Nguyễn Quang Tùng', role: 'Kỹ thuật viên', avatar_url: '' },
    { id: 'u_tung_nl', username: 'tung_nl', password: 'password123', display_name: 'Nguyễn Lâm Tùng', role: 'Giám sát', avatar_url: '' },
    { id: 'u_alex', username: 'alex', password: 'password123', display_name: 'Alex Rivers', role: 'Chuyên gia Thú y', avatar_url: '' },
    { id: 'u_trang', username: 'trang', password: 'password123', display_name: 'Phạm Thu Trang', role: 'Kế toán kho', avatar_url: '' },
    { id: 'u_manh', username: 'manh', password: 'password123', display_name: 'Trần Văn Mạnh', role: 'Vận hành máy', avatar_url: '' },
    { id: 'u_elena', username: 'elena', password: 'password123', display_name: 'Elena Rostova', role: 'Cố vấn Quốc tế', avatar_url: '' }
  ];

  initialUsers.forEach(u => {
    db.run(
      'INSERT INTO users (id, username, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.username, u.password, u.display_name, u.role, u.avatar_url]
    );
  });

  // 1. World Class Channel (180 messages max)
  db.run(
    'INSERT INTO chats (id, title, type, created_by, members_count_label) VALUES (?, ?, ?, ?, ?)',
    ['chat-world-class', 'World Class 🌍', 'global_channel', 'u_shiina', 'Giao lưu toàn cầu · Tối đa 180 tin']
  );

  const wcMembers = ['Tất cả thành viên', 'Shiina', 'Lương Thanh Hậu', 'Nguyễn Quang Tùng', 'Nguyễn Lâm Tùng', 'Alex Rivers', 'Elena Rostova'];
  wcMembers.forEach((m, idx) => {
    db.run(
      'INSERT OR IGNORE INTO chat_members (id, chat_id, user_name, role) VALUES (?, ?, ?, ?)',
      [`cm_wc_${idx}`, 'chat-world-class', m, 'Thành viên']
    );
  });

  const now = Date.now();
  const wcMessages = [
    {
      id: 'wc_1',
      chat_id: 'chat-world-class',
      sender_id: 'u_shiina',
      author: 'Shiina',
      role: 'Quản trị viên',
      content: 'Chào mừng mọi người đến với phòng chat chung **World Class**! 🌍🎉 Đây là nơi tất cả thành viên có thể giao lưu, chia sẻ ý tưởng và trao đổi kinh nghiệm tự do.',
      created_at: new Date(now - 3600000 * 4).toISOString()
    },
    {
      id: 'wc_2',
      chat_id: 'chat-world-class',
      sender_id: 'u_hau',
      author: 'Lương Thanh Hậu',
      role: 'Quản lý',
      content: 'Xin chào cả nhà! Chúc mọi người một ngày làm việc hiệu quả và nhiều niềm vui! 😊',
      created_at: new Date(now - 3600000 * 3).toISOString()
    },
    {
      id: 'wc_3',
      chat_id: 'chat-world-class',
      sender_id: 'u_tung_nq',
      author: 'Nguyễn Quang Tùng',
      role: 'Kỹ thuật viên',
      content: 'Phòng chat này được thiết lập tự động lưu giữ **180 tin nhắn** gần nhất và tự động làm sạch các tin cũ. Mọi người có thể thoải mái gửi hình ảnh, video và liên kết nhé!',
      created_at: new Date(now - 3600000 * 2).toISOString()
    }
  ];

  wcMessages.forEach(m => {
    db.run(
      'INSERT INTO messages (id, chat_id, sender_id, author, role, content, msg_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [m.id, m.chat_id, m.sender_id, m.author, m.role, m.content, 'text', m.created_at]
    );
  });

  // 2. Chat-1: Dự Án Chung 🚀
  db.run(
    'INSERT INTO chats (id, title, type, created_by, members_count_label) VALUES (?, ?, ?, ?, ?)',
    ['chat-1', 'Dự Án Chung 🚀', 'channel', 'u_shiina', '4 thành viên · Tối đa 36 tin']
  );

  ['Shiina', 'Lương Thanh Hậu', 'Nguyễn Quang Tùng', 'Nguyễn Lâm Tùng'].forEach((m, idx) => {
    db.run(
      'INSERT OR IGNORE INTO chat_members (id, chat_id, user_name, role) VALUES (?, ?, ?, ?)',
      [`cm_c1_${idx}`, 'chat-1', m, idx === 0 ? 'Quản trị viên' : (idx === 1 ? 'Quản lý' : 'Kỹ thuật viên')]
    );
  });

  const c1Messages = [
    {
      id: 'm1_1',
      chat_id: 'chat-1',
      sender_id: 'u_shiina',
      author: 'Shiina',
      role: 'Quản trị viên',
      content: 'Xin chào cả đội, tiến độ dự án PingPing tuần này thế nào rồi?',
      msg_type: 'text',
      created_at: new Date(now - 3600000 * 2).toISOString()
    },
    {
      id: 'm1_2',
      chat_id: 'chat-1',
      sender_id: 'u_hau',
      author: 'Lương Thanh Hậu',
      role: 'Quản lý',
      content: 'Hệ thống xác thực tài khoản và Socket.io thời gian thực đã hoàn tất kiểm thử nhé! Em gửi ảnh chụp thực tế:',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      image_caption: 'Giao diện bảng điều khiển PingPing',
      msg_type: 'image',
      created_at: new Date(now - 3600000 * 1.8).toISOString()
    },
    {
      id: 'm1_3',
      chat_id: 'chat-1',
      sender_id: 'u_tung_nl',
      author: 'Nguyễn Lâm Tùng',
      role: 'Giám sát',
      content: 'Em gửi thêm clip kiểm thử thao tác nhắn tin đa phương tiện và đồng bộ trạng thái tức thì:',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      video_caption: 'Video demo tương tác phòng chat PingPing',
      msg_type: 'video',
      created_at: new Date(now - 3600000 * 1.5).toISOString()
    },
    {
      id: 'm1_4',
      chat_id: 'chat-1',
      sender_id: 'u_hau',
      author: 'Lương Thanh Hậu',
      role: 'Quản lý',
      content: 'Mọi người tham khảo tài liệu kỹ thuật tại https://github.com/shiina613/pingping và xem file đính kèm bên dưới:',
      file_name: 'Tai_lieu_kien_truc_he_thong_PingPing.pdf',
      file_size: '2.8 MB',
      file_type: 'pdf',
      file_url: '#',
      msg_type: 'file',
      created_at: new Date(now - 3600000 * 1.2).toISOString()
    }
  ];

  c1Messages.forEach(m => {
    db.run(`
      INSERT INTO messages (
        id, chat_id, sender_id, author, role, content, thought, thought_time,
        image, image_caption, video, video_caption, file_name, file_size, file_type, file_url,
        msg_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      m.id, m.chat_id, m.sender_id, m.author, m.role, m.content, m.thought || null, m.thought_time || null,
      m.image || null, m.image_caption || null, m.video || null, m.video_caption || null,
      m.file_name || null, m.file_size || null, m.file_type || null, m.file_url || null,
      m.msg_type, m.created_at
    ]);
  });

  // 3. Chat-2: Lương Thanh Hậu (Direct)
  db.run('INSERT INTO chats (id, title, type, created_by, members_count_label) VALUES (?, ?, ?, ?, ?)',
    ['chat-2', 'Lương Thanh Hậu', 'direct', 'u_shiina', 'Quản lý - Online']);
  ['Shiina', 'Lương Thanh Hậu'].forEach((m, idx) => {
    db.run('INSERT OR IGNORE INTO chat_members (id, chat_id, user_name, role) VALUES (?, ?, ?, ?)',
      [`cm_c2_${idx}`, 'chat-2', m, idx === 0 ? 'Quản trị viên' : 'Quản lý']);
  });
  db.run('INSERT INTO messages (id, chat_id, sender_id, author, role, content, msg_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['m2_1', 'chat-2', 'u_hau', 'Lương Thanh Hậu', 'Quản lý', 'Anh kiểm tra giúp em báo cáo phân tích hiệu suất hệ thống tháng này với nhé.', 'text', new Date(now - 3600000 * 4).toISOString()]);

  // 4. Chat-3: Nguyễn Quang Tùng (Direct)
  db.run('INSERT INTO chats (id, title, type, created_by, members_count_label) VALUES (?, ?, ?, ?, ?)',
    ['chat-3', 'Nguyễn Quang Tùng', 'direct', 'u_shiina', 'Kỹ thuật viên - Vừa truy cập']);
  ['Shiina', 'Nguyễn Quang Tùng'].forEach((m, idx) => {
    db.run('INSERT OR IGNORE INTO chat_members (id, chat_id, user_name, role) VALUES (?, ?, ?, ?)',
      [`cm_c3_${idx}`, 'chat-3', m, idx === 0 ? 'Quản trị viên' : 'Kỹ thuật viên']);
  });
  db.run(`INSERT INTO messages (id, chat_id, sender_id, author, role, content, voice_duration, voice_url, msg_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['m3_1', 'chat-3', 'u_tung_nq', 'Nguyễn Quang Tùng', 'Kỹ thuật viên', 'Chào anh, em gửi tin nhắn thoại cập nhật nhanh tiến độ tối ưu hóa hiệu năng ứng dụng chiều nay nhé:', '0:24', 'sample', 'voice', new Date(now - 3600000 * 3).toISOString()]);

  // 5. Chat-4: Nguyễn Lâm Tùng (Direct)
  db.run('INSERT INTO chats (id, title, type, created_by, members_count_label) VALUES (?, ?, ?, ?, ?)',
    ['chat-4', 'Nguyễn Lâm Tùng', 'direct', 'u_shiina', 'Giám sát - Online']);
  ['Shiina', 'Nguyễn Lâm Tùng'].forEach((m, idx) => {
    db.run('INSERT OR IGNORE INTO chat_members (id, chat_id, user_name, role) VALUES (?, ?, ?, ?)',
      [`cm_c4_${idx}`, 'chat-4', m, idx === 0 ? 'Quản trị viên' : 'Giám sát']);
  });
  db.run(`INSERT INTO messages (id, chat_id, sender_id, author, role, content, image, image_caption, msg_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['m4_1', 'chat-4', 'u_tung_nl', 'Nguyễn Lâm Tùng', 'Giám sát', 'Ảnh chụp đồng hồ tải điện máy phát 150kVA sau khi kiểm tra:', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', 'Tủ điều khiển tự động ATS và máy phát điện', 'image', new Date(now - 3600000 * 5).toISOString()]);

  console.log('✅ SQLite Initial Seed complete.');
}

// ---------------- Database Helper Methods ---------------- //

function execQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function execRun(sql, params = []) {
  db.run(sql, params);
  schedulePersist();
}

function getAllUsers() {
  return execQuery('SELECT id, username, display_name as displayName, role, avatar_url as avatarUrl, created_at as createdAt FROM users');
}

function getUserById(id) {
  const res = execQuery('SELECT id, username, display_name as displayName, role, avatar_url as avatarUrl FROM users WHERE id = ?', [id]);
  return res.length > 0 ? res[0] : null;
}

const crypto = require('crypto');

function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword) return false;
  // Backward compatibility with initial seeded plain passwords (password123)
  if (!storedPassword.includes(':')) {
    return password === storedPassword;
  }
  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

function getUserByUsername(username) {
  const res = execQuery('SELECT id, username, password, display_name as displayName, role, avatar_url as avatarUrl FROM users WHERE username = ?', [username]);
  return res.length > 0 ? res[0] : null;
}

function createUser({ id, username, password, displayName, role, avatarUrl }) {
  const securePassword = password.includes(':') ? password : hashPassword(password);
  execRun(
    'INSERT INTO users (id, username, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
    [id, username, securePassword, displayName, role || 'Thành viên', avatarUrl || '']
  );
  return getUserById(id);
}

function updateUserProfile(id, { displayName, role, avatarUrl }) {
  execRun(
    'UPDATE users SET display_name = COALESCE(?, display_name), role = COALESCE(?, role), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
    [displayName || null, role || null, avatarUrl || null, id]
  );
  return getUserById(id);
}

function getOrCreateDirectChat(currentUser, targetUser) {
  const allChats = getAllChats();
  const existing = allChats.find(c =>
    c.type === 'direct' &&
    c.members.includes(currentUser.displayName) &&
    c.members.includes(targetUser.displayName)
  );
  if (existing) return existing;

  const id = `chat_dm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  return createChat({
    id,
    title: targetUser.displayName,
    type: 'direct',
    createdBy: currentUser.id,
    members: [currentUser.displayName, targetUser.displayName]
  });
}

function getAllChats() {
  const chats = execQuery('SELECT id, title, type, created_by as createdBy, members_count_label as membersCount, updated_at as updatedAt FROM chats ORDER BY updated_at DESC');

  return chats.map(chat => {
    const memberRows = execQuery('SELECT user_name FROM chat_members WHERE chat_id = ?', [chat.id]);
    const members = memberRows.map(m => m.user_name);
    const lastMsgRows = execQuery('SELECT content, author, created_at as createdAt, image, video, file_name as fileName, voice_duration as voiceDuration FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1', [chat.id]);
    const lastMsg = lastMsgRows.length > 0 ? lastMsgRows[0] : null;

    return {
      ...chat,
      members,
      membersCount: chat.membersCount || `${members.length} thành viên`,
      lastMessage: lastMsg ? {
        content: lastMsg.content,
        author: lastMsg.author,
        time: formatTime(lastMsg.createdAt),
        image: !!lastMsg.image,
        video: !!lastMsg.video,
        file: !!lastMsg.fileName
      } : null,
      unread: 0
    };
  });
}

function getChatById(chatId) {
  const res = execQuery('SELECT id, title, type, created_by as createdBy, members_count_label as membersCount, updated_at as updatedAt FROM chats WHERE id = ?', [chatId]);
  if (res.length === 0) return null;
  const chat = res[0];

  const members = execQuery('SELECT user_name FROM chat_members WHERE chat_id = ?', [chatId]).map(m => m.user_name);
  return {
    ...chat,
    members,
    membersCount: chat.membersCount || `${members.length} thành viên`
  };
}

function createChat({ id, title, type, createdBy, members = [] }) {
  const countLabel = type === 'global_channel'
    ? 'Giao lưu toàn cầu · Tối đa 180 tin'
    : `${members.length} thành viên · Tối đa 36 tin`;

  execRun(
    'INSERT INTO chats (id, title, type, created_by, members_count_label, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [id, title, type || 'group', createdBy || 'u_shiina', countLabel]
  );

  members.forEach((m, idx) => {
    execRun(
      'INSERT OR IGNORE INTO chat_members (id, chat_id, user_name, role) VALUES (?, ?, ?, ?)',
      [`cm_${id}_${idx}_${Date.now()}`, id, m, 'Thành viên']
    );
  });

  return getChatById(id);
}

function renameChat(chatId, newTitle) {
  execRun('UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newTitle, chatId]);
  return getChatById(chatId);
}

function deleteChat(chatId) {
  execRun('DELETE FROM messages WHERE chat_id = ?', [chatId]);
  execRun('DELETE FROM chat_members WHERE chat_id = ?', [chatId]);
  execRun('DELETE FROM chats WHERE id = ?', [chatId]);
  return true;
}

function addMemberToChat(chatId, userName, role = 'Thành viên') {
  const id = `cm_${chatId}_${Date.now()}`;
  execRun('INSERT OR IGNORE INTO chat_members (id, chat_id, user_name, role) VALUES (?, ?, ?, ?)', [id, chatId, userName, role]);
  return getChatById(chatId);
}

function removeMemberFromChat(chatId, userName) {
  execRun('DELETE FROM chat_members WHERE chat_id = ? AND user_name = ?', [chatId, userName]);
  return getChatById(chatId);
}

// ---------------- Messages & Atomic FIFO Pruning ---------------- //

function getChatMessages(chatId, limit = null) {
  const retentionLimit = chatId === 'chat-world-class' ? 180 : 36;
  const actualLimit = limit ? Math.min(limit, retentionLimit) : retentionLimit;

  const rows = execQuery(`
    SELECT * FROM (
      SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?
    ) ORDER BY created_at ASC
  `, [chatId, actualLimit]);

  return rows.map(r => formatMessageRow(r));
}

function saveMessage(msg) {
  const retentionLimit = msg.chat_id === 'chat-world-class' ? 180 : 36;
  const msgId = msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const createdAt = msg.created_at || new Date().toISOString();

  execRun(`
    INSERT INTO messages (
      id, chat_id, sender_id, author, role, content, thought, thought_time,
      image, image_caption, video, video_caption, file_name, file_size, file_type, file_url,
      voice_duration, voice_url, msg_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    msgId, msg.chat_id, msg.sender_id || null, msg.author || 'Shiina', msg.role || '',
    msg.content || '', msg.thought || null, msg.thought_time || null,
    msg.image || null, msg.image_caption || null, msg.video || null, msg.video_caption || null,
    msg.file_name || null, msg.file_size || null, msg.file_type || null, msg.file_url || null,
    msg.voice_duration || null, msg.voice_url || null, msg.msg_type || 'text', createdAt
  ]);

  execRun('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [msg.chat_id]);

  // 🛡️ Atomic FIFO Pruning: Keep only newest N messages
  const countRes = execQuery('SELECT COUNT(*) as cnt FROM messages WHERE chat_id = ?', [msg.chat_id]);
  const totalCount = countRes.length > 0 ? countRes[0].cnt : 0;
  let prunedCount = 0;

  if (totalCount > retentionLimit) {
    prunedCount = totalCount - retentionLimit;
    execRun(`
      DELETE FROM messages
      WHERE chat_id = ?
        AND id NOT IN (
          SELECT id FROM messages
          WHERE chat_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        )
    `, [msg.chat_id, msg.chat_id, retentionLimit]);
  }

  const savedRows = execQuery('SELECT * FROM messages WHERE id = ?', [msgId]);
  const savedRow = savedRows.length > 0 ? savedRows[0] : null;

  return {
    message: formatMessageRow(savedRow),
    prunedCount
  };
}

function formatMessageRow(r) {
  if (!r) return null;
  const timeStr = formatTime(r.created_at);
  const formatted = {
    id: r.id,
    author: r.author,
    role: r.role || '',
    content: r.content,
    time: timeStr,
    createdAt: r.created_at
  };

  if (r.thought) {
    formatted.thought = r.thought;
    formatted.thoughtTime = r.thought_time || '2s';
  }
  if (r.image) {
    formatted.image = r.image;
    formatted.imageCaption = r.image_caption || '';
  }
  if (r.video) {
    formatted.video = r.video;
    formatted.videoCaption = r.video_caption || '';
  }
  if (r.file_name) {
    formatted.file = {
      name: r.file_name,
      size: r.file_size || '1.0 MB',
      type: r.file_type || 'file',
      url: r.file_url || '#'
    };
  }
  if (r.voice_url || r.voice_duration) {
    formatted.voice = {
      duration: r.voice_duration || '0:15',
      url: r.voice_url || 'sample'
    };
  }
  if (r.msg_type === 'system') {
    formatted.isSystem = true;
  }

  return formatted;
}

function formatTime(isoOrStr) {
  try {
    const d = new Date(isoOrStr);
    if (isNaN(d.getTime())) return 'Vừa xong';
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return 'Vừa xong';
  }
}

module.exports = {
  initDatabase,
  flushSync,
  getAllUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUserProfile,
  getAllChats,
  getChatById,
  createChat,
  renameChat,
  deleteChat,
  addMemberToChat,
  removeMemberFromChat,
  getChatMessages,
  saveMessage,
  hashPassword,
  verifyPassword,
  getOrCreateDirectChat
};

