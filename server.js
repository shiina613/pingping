const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('./database');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'pingping_super_secret_jwt_key_2026';

// 📁 Uploads Directory Setup (supports Vercel Serverless /tmp)
const isVercel = !!process.env.VERCEL;
const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB Max
});

// Middlewares
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure DB is initialized before handling requests
app.use(async (req, res, next) => {
  try {
    await db.initDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// Global Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Serve static uploads
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

// Explicit static routes with in-memory caching to guarantee Vercel bundler inclusion and exact MIME types
let styleContent = '';
let appContent = '';

const stylePaths = [path.join(__dirname, 'style.css'), path.join(__dirname, '..', 'style.css')];
for (const sp of stylePaths) {
  if (fs.existsSync(sp)) {
    try { styleContent = fs.readFileSync(sp, 'utf8'); break; } catch (e) {}
  }
}

const appPaths = [path.join(__dirname, 'app.js'), path.join(__dirname, '..', 'app.js')];
for (const ap of appPaths) {
  if (fs.existsSync(ap)) {
    try { appContent = fs.readFileSync(ap, 'utf8'); break; } catch (e) {}
  }
}

app.get('/style.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (styleContent) {
    res.send(styleContent);
  } else {
    res.sendFile(path.join(__dirname, 'style.css'));
  }
});

app.get('/app.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (appContent) {
    res.send(appContent);
  } else {
    res.sendFile(path.join(__dirname, 'app.js'));
  }
});

// Serve frontend static assets
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// ⚡ Socket.io Realtime Engine
const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000
});

// Online Users Set
const onlineUsers = new Map(); // socketId -> { userId, userName }

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // User Identification
  socket.on('register_user', ({ userId, userName }) => {
    onlineUsers.set(socket.id, { userId, userName });
    io.emit('user_status_changed', { userName, status: 'Online' });
  });

  // Join Room
  socket.on('join_chat', ({ chatId }) => {
    if (!chatId) return;
    socket.join(chatId);
  });

  // Leave Room
  socket.on('leave_chat', ({ chatId }) => {
    if (!chatId) return;
    socket.leave(chatId);
  });

  // Send Real-time Message
  socket.on('send_message', (payload, ackCallback) => {
    try {
      const { chatId, author, role, content, image, video, file, voice, thought, thoughtTime } = payload;
      if (!chatId || (!content && !image && !video && !file && !voice)) {
        if (typeof ackCallback === 'function') ackCallback({ success: false, error: 'Invalid payload' });
        return;
      }

      let msgType = 'text';
      if (image) msgType = 'image';
      else if (video) msgType = 'video';
      else if (file) msgType = 'file';
      else if (voice) msgType = 'voice';

      const msgId = payload.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const registered = onlineUsers.get(socket.id);
      const finalAuthor = (registered && registered.userName) || author || 'Thành viên';
      const finalSenderId = (registered && registered.userId) || payload.sender_id || null;

      const messageToSave = {
        id: msgId,
        chat_id: chatId,
        sender_id: finalSenderId,
        author: finalAuthor,
        role: role || (registered && registered.role) || '',
        content: content || '',
        thought: thought || null,
        thought_time: thoughtTime || null,
        image: typeof image === 'string' ? image : (image ? image.url : null),
        image_caption: payload.imageCaption || (image && image.caption) || null,
        video: typeof video === 'string' ? video : (video ? video.url : null),
        video_caption: payload.videoCaption || (video && video.caption) || null,
        file_name: file ? file.name : null,
        file_size: file ? file.size : null,
        file_type: file ? file.type : null,
        file_url: file ? (file.url || '#') : null,
        voice_duration: voice ? voice.duration : null,
        voice_url: voice ? voice.url : null,
        msg_type: msgType,
        created_at: new Date().toISOString()
      };

      const { message, prunedCount } = db.saveMessage(messageToSave);

      // Broadcast to everyone in room
      io.to(chatId).emit('new_message', { chatId, message });

      if (prunedCount > 0) {
        io.to(chatId).emit('messages_pruned', {
          chatId,
          prunedCount,
          retentionLimit: chatId === 'chat-world-class' ? 180 : 36
        });
      }

      // Handle @Tag Member Commands
      handleTagCommands(chatId, author, content);

      if (typeof ackCallback === 'function') {
        ackCallback({ success: true, message });
      }
    } catch (err) {
      console.error('Send message socket error:', err);
      if (typeof ackCallback === 'function') ackCallback({ success: false, error: err.message });
    }
  });

  // Typing Indicators
  socket.on('typing_start', ({ chatId, userName }) => {
    if (!chatId) return;
    socket.to(chatId).emit('user_typing', { chatId, userName: userName || 'Một thành viên' });
  });

  socket.on('typing_stop', ({ chatId, userName }) => {
    if (!chatId) return;
    socket.to(chatId).emit('user_stopped_typing', { chatId, userName: userName || 'Một thành viên' });
  });

  // Member Management Commands
  socket.on('member_add', ({ chatId, memberName }) => {
    if (!chatId || !memberName) return;
    const updated = db.addMemberToChat(chatId, memberName);
    
    // Create system notification message
    const sysMsg = {
      id: `sys_${Date.now()}`,
      chat_id: chatId,
      author: 'Hệ thống',
      content: `Thành viên **${memberName}** đã được thêm vào cuộc trò chuyện.`,
      msg_type: 'system'
    };
    const { message } = db.saveMessage(sysMsg);

    io.to(chatId).emit('member_updated', { chatId, action: 'add', memberName, members: updated.members });
    io.to(chatId).emit('new_message', { chatId, message });
  });

  socket.on('member_remove', ({ chatId, memberName }) => {
    if (!chatId || !memberName) return;
    const updated = db.removeMemberFromChat(chatId, memberName);

    // Create system notification message
    const sysMsg = {
      id: `sys_${Date.now()}`,
      chat_id: chatId,
      author: 'Hệ thống',
      content: `Thành viên **${memberName}** đã rời khỏi cuộc trò chuyện.`,
      msg_type: 'system'
    };
    const { message } = db.saveMessage(sysMsg);

    io.to(chatId).emit('member_updated', { chatId, action: 'remove', memberName, members: updated.members });
    io.to(chatId).emit('new_message', { chatId, message });
  });

  socket.on('chat_rename', ({ chatId, newTitle }) => {
    if (!chatId || !newTitle) return;
    const updated = db.renameChat(chatId, newTitle);
    io.emit('chat_renamed', { chatId, newTitle: updated.title });
  });

  socket.on('disconnect', () => {
    const u = onlineUsers.get(socket.id);
    if (u) {
      onlineUsers.delete(socket.id);
      io.emit('user_status_changed', { userName: u.userName, status: 'Offline' });
    }
  });
});

// Helper for Tag Command Parsing
function handleTagCommands(chatId, author, text) {
  if (!text) return;

  // Detect @rm-<Name>
  const rmMatches = text.match(/@rm-([a-zA-Z0-9_\u00C0-\u1EF9\s]+?)(?=\s|$|[,\.])/g);
  if (rmMatches) {
    rmMatches.forEach(m => {
      const name = m.replace('@rm-', '').trim();
      if (name) {
        db.removeMemberFromChat(chatId, name);
        io.to(chatId).emit('member_updated', { chatId, action: 'remove', memberName: name });
      }
    });
  }

  // Detect @<Name> (excluding @rm-)
  const addMatches = text.match(/@([a-zA-Z0-9_\u00C0-\u1EF9\s]+?)(?=\s|$|[,\.])/g);
  if (addMatches) {
    addMatches.forEach(m => {
      if (m.startsWith('@rm-')) return;
      const name = m.replace('@', '').trim();
      const allUsers = db.getAllUsers();
      const found = allUsers.find(u => u.displayName.toLowerCase() === name.toLowerCase() || u.username.toLowerCase() === name.toLowerCase());
      if (found) {
        db.addMemberToChat(chatId, found.displayName);
        io.to(chatId).emit('member_updated', { chatId, action: 'add', memberName: found.displayName });
      }
    });
  }
}

// ---------------- REST API ENDPOINTS ---------------- //

// 1. Authentication & Users
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ username, password và tên hiển thị' });
    }

    const existing = db.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
    }

    const id = `u_${Date.now()}`;
    const user = db.createUser({ id, username, password, displayName, role });
    const token = jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, JWT_SECRET, { expiresIn: '30d' });

    // Auto-add to World Class chat
    db.addMemberToChat('chat-world-class', user.displayName, user.role);

    res.status(201).json({
      success: true,
      data: { token, user },
      message: 'Đăng ký tài khoản thành công'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    const user = db.getUserByUsername(username);
    if (!user || !db.verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, displayName: user.displayName }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl
        }
      },
      message: 'Đăng nhập thành công'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create or find direct 1-1 chat between two real users
app.post('/api/chats/direct', (req, res) => {
  try {
    const { targetUserId, targetUsername } = req.body;
    let currentUser = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        currentUser = db.getUserById(decoded.id);
      } catch (e) {}
    }

    if (!currentUser && req.body.currentUserId) {
      currentUser = db.getUserById(req.body.currentUserId);
    }
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để tạo phòng chat' });
    }

    const targetUser = targetUserId ? db.getUserById(targetUserId) : db.getUserByUsername(targetUsername);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng đối phương' });
    }

    const chat = db.getOrCreateDirectChat(currentUser, targetUser);
    io.emit('new_chat_created', chat);
    res.status(200).json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
});

app.put('/api/auth/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = 'u_shiina';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    const { displayName, role, avatarUrl } = req.body;
    const updated = db.updateUserProfile(userId, { displayName, role, avatarUrl });
    res.json({ success: true, data: updated, message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Chats Management
app.get('/api/chats', (req, res) => {
  try {
    const chats = db.getAllChats();
    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/chats/:id', (req, res) => {
  try {
    const chat = db.getChatById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên chat' });
    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/chats', (req, res) => {
  try {
    const { id, title, type, createdBy, members } = req.body;
    const chatId = id || `chat-${Date.now()}`;
    const newChat = db.createChat({
      id: chatId,
      title: title || 'Cuộc trò chuyện mới',
      type: type || 'group',
      createdBy: createdBy || 'u_shiina',
      members: members || ['Shiina']
    });

    io.emit('new_chat_created', newChat);
    res.status(201).json({ success: true, data: newChat, message: 'Tạo session thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/chats/:id', (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tiêu đề mới' });
    const updated = db.renameChat(req.params.id, title);
    io.emit('chat_renamed', { chatId: req.params.id, newTitle: updated.title });
    res.json({ success: true, data: updated, message: 'Đổi tên session thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/chats/:id', (req, res) => {
  try {
    db.deleteChat(req.params.id);
    io.emit('chat_deleted', { chatId: req.params.id });
    res.json({ success: true, message: 'Xóa session thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Messages History & Sending
app.get('/api/chats/:id/messages', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
    const messages = db.getChatMessages(req.params.id, limit);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/chats/:id/messages', (req, res) => {
  try {
    const chatId = req.params.id;
    const { author, role, content, image, video, file, voice, thought, thoughtTime } = req.body;

    let finalAuthor = author || 'Thành viên';
    let finalRole = role || '';
    let finalSenderId = req.body.sender_id || null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const verifiedUser = db.getUserById(decoded.id);
        if (verifiedUser) {
          finalAuthor = verifiedUser.displayName;
          finalRole = verifiedUser.role;
          finalSenderId = verifiedUser.id;
        }
      } catch (e) {}
    }

    let msgType = 'text';
    if (image) msgType = 'image';
    else if (video) msgType = 'video';
    else if (file) msgType = 'file';
    else if (voice) msgType = 'voice';

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const { message, prunedCount } = db.saveMessage({
      id: msgId,
      chat_id: chatId,
      sender_id: finalSenderId,
      author: finalAuthor,
      role: finalRole,
      content: content || '',
      thought: thought || null,
      thought_time: thoughtTime || null,
      image: typeof image === 'string' ? image : (image ? image.url : null),
      image_caption: (image && image.caption) || null,
      video: typeof video === 'string' ? video : (video ? video.url : null),
      video_caption: (video && video.caption) || null,
      file_name: file ? file.name : null,
      file_size: file ? file.size : null,
      file_type: file ? file.type : null,
      file_url: file ? (file.url || '#') : null,
      voice_duration: voice ? voice.duration : null,
      voice_url: voice ? voice.url : null,
      msg_type: msgType,
      created_at: new Date().toISOString()
    });

    io.to(chatId).emit('new_message', { chatId, message });

    if (prunedCount > 0) {
      io.to(chatId).emit('messages_pruned', {
        chatId,
        prunedCount,
        retentionLimit: chatId === 'chat-world-class' ? 180 : 36
      });
    }

    handleTagCommands(chatId, author, content);

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. File Upload (Images, Videos, Audio, Documents)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy file tải lên' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(1);
    const sizeLabel = req.file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(req.file.size / 1024)} KB`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        fileName: req.file.originalname,
        fileSize: sizeLabel,
        mimeType: req.file.mimetype,
        storageName: req.file.filename
      },
      message: 'Tải tệp lên thành công'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. System Health Check
app.get('/health', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: 'SQLite 3 (WAL Mode)',
    connections: io.engine.clientsCount,
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`
    }
  });
});
app.get('/api/health', (req, res) => res.redirect('/health'));

// Fallback SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🛡️ Graceful Shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP Server closed.');
    try {
      db.flushSync();
      console.log('SQLite Database changes flushed cleanly.');
    } catch (e) {
      console.error('Error flushing DB:', e);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Initialize DB and Start Server (when running standalone)
if (!process.env.VERCEL && require.main === module) {
  db.initDatabase().then(() => {
    server.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 PingPing Server is running on http://localhost:${PORT}`);
      console.log(`⚡ Engine: Node.js + Express + Socket.io + SQLite DB`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`=================================================\n`);
    });
  }).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.server = server;

