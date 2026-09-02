const http = require('http');
const path = require('path');
const fs = require('fs');
const ioClient = require('socket.io-client');
const app = require('../server');
const db = require('../database');

let server;
let baseUrl;
let port;
let authToken = '';
let testUsername = '';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting PingPing Full-Stack Automated Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // Setup Server on random available port with Socket.io attached
  await new Promise((resolve) => {
    server = app.server;
    server.listen(0, '127.0.0.1', async () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      await db.initDatabase();
      resolve();
    });
  });

  console.log(`🚀 Test Server running at ${baseUrl}\n`);

  // --- SUITE 1: System Health & Static Assets ---
  console.log('--- Suite 1: System Health & Static Assets ---');

  await test('GET /health returns healthy status and system metrics', async () => {
    const res = await fetch(`${baseUrl}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== 'healthy') throw new Error(`Unexpected status: ${body.status}`);
    if (!body.memory || !body.uptime) throw new Error('Missing metrics');
  });

  await test('GET /style.css serves valid CSS with no-cache headers', async () => {
    const res = await fetch(`${baseUrl}/style.css`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ctype = res.headers.get('content-type') || '';
    if (!ctype.includes('text/css')) throw new Error(`Invalid content-type: ${ctype}`);
    const css = await res.text();
    if (!css.includes('--claude-bg') && !css.includes('.app-container')) {
      throw new Error('CSS content incomplete');
    }
  });

  await test('GET /app.js serves valid JavaScript bundle', async () => {
    const res = await fetch(`${baseUrl}/app.js`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ctype = res.headers.get('content-type') || '';
    if (!ctype.includes('javascript')) throw new Error(`Invalid content-type: ${ctype}`);
    const js = await res.text();
    if (!js.includes('DEFAULT_CHATS') || !js.includes('renderSidebarChats')) {
      throw new Error('JS bundle content incomplete');
    }
  });

  await test('GET / serves index.html with correct title and tags', async () => {
    const res = await fetch(`${baseUrl}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('PingPing') || !html.includes('id="app"')) {
      throw new Error('index.html structure mismatch');
    }
  });

  // --- SUITE 2: Authentication & User Accounts ---
  console.log('\n--- Suite 2: Authentication & User Accounts ---');

  testUsername = `tester_${Date.now()}`;

  await test('POST /api/auth/register registers new user with PBKDF2 hash and JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'securePassword123',
        displayName: 'Đậu Đậu Tester',
        role: 'Senior QA'
      })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const json = await res.json();
    if (!json.success || !json.data.token || !json.data.user) {
      throw new Error('Missing token or user object');
    }
    authToken = json.data.token;
  });

  await test('POST /api/auth/register rejects duplicate username (409 Conflict)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'securePassword123',
        displayName: 'Trùng Tên',
        role: 'Thành viên'
      })
    });
    if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
    const json = await res.json();
    if (json.success !== false) throw new Error('Expected failure response');
  });

  await test('POST /api/auth/login authenticates with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'securePassword123'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || !json.data.token) throw new Error('Login failed');
    authToken = json.data.token;
  });

  await test('POST /api/auth/login rejects incorrect password (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        password: 'WrongPassword999'
      })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test('GET /api/auth/me returns current verified user from JWT', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.username !== testUsername) {
      throw new Error('User identity verification failed');
    }
  });

  await test('PUT /api/auth/profile updates user display name and role', async () => {
    const res = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        displayName: 'Đậu Đậu Pro',
        role: 'Lead Architect'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.displayName !== 'Đậu Đậu Pro') {
      throw new Error('Profile update failed');
    }
  });

  await test('GET /api/users returns all registered users', async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length < 5) {
      throw new Error('User list incomplete');
    }
  });

  // --- SUITE 3: Chats & Sessions Management ---
  console.log('\n--- Suite 3: Chats & Sessions Management ---');

  let testChatId = `chat_test_${Date.now()}`;

  await test('POST /api/chats creates a new group chat session', async () => {
    const res = await fetch(`${baseUrl}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        id: testChatId,
        title: 'Nhóm Thử Nghiệm Alpha 🔬',
        type: 'group',
        members: ['Đậu Đậu Pro', 'Shiina', 'Lương Thanh Hậu']
      })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.id !== testChatId) throw new Error('Failed to create chat');
  });

  await test('GET /api/chats/:id returns chat details and members', async () => {
    const res = await fetch(`${baseUrl}/api/chats/${testChatId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.title !== 'Nhóm Thử Nghiệm Alpha 🔬') {
      throw new Error('Chat details mismatch');
    }
    if (!json.data.members.includes('Shiina')) {
      throw new Error('Members list incomplete');
    }
  });

  await test('PATCH /api/chats/:id renames the chat session', async () => {
    const res = await fetch(`${baseUrl}/api/chats/${testChatId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ title: 'Nhóm Thử Nghiệm Beta ⚡' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.title !== 'Nhóm Thử Nghiệm Beta ⚡') {
      throw new Error('Chat rename failed');
    }
  });

  await test('POST /api/chats/direct creates or retrieves direct 1-1 chat between users', async () => {
    const res = await fetch(`${baseUrl}/api/chats/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ targetUsername: 'shiina' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.type !== 'direct') {
      throw new Error('Direct chat creation failed');
    }
  });

  // --- SUITE 4: Messages & Multimedia Storage ---
  console.log('\n--- Suite 4: Messages & Multimedia Storage ---');

  await test('POST /api/chats/:id/messages saves text message with auth binding', async () => {
    const res = await fetch(`${baseUrl}/api/chats/${testChatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: 'Tin nhắn kiểm thử từ phòng thí nghiệm tự động! 🌟',
        thought: 'Phân tích dữ liệu phản hồi trong 1.5s',
        thoughtTime: '1.5s'
      })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.author !== 'Đậu Đậu Pro') {
      throw new Error('Author not mapped correctly from token');
    }
  });

  await test('POST /api/chats/:id/messages supports multimedia (images, videos, files)', async () => {
    const res = await fetch(`${baseUrl}/api/chats/${testChatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        content: 'Bản vẽ kỹ thuật chi tiết',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        imageCaption: 'Sơ đồ luồng dữ liệu kiến trúc',
        file: {
          name: 'benchmark_report.pdf',
          size: '1.2 MB',
          type: 'pdf',
          url: '#'
        }
      })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const json = await res.json();
    if (!json.success || !json.data.image || !json.data.file) {
      throw new Error('Multimedia fields not saved correctly');
    }
  });

  await test('GET /api/chats/:id/messages returns saved messages chronologically', async () => {
    const res = await fetch(`${baseUrl}/api/chats/${testChatId}/messages`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length < 2) {
      throw new Error('Message list incomplete');
    }
  });

  await test('FIFO retention pruning keeps only latest 36 messages in regular groups', async () => {
    // Insert 40 messages
    for (let i = 1; i <= 40; i++) {
      db.saveMessage({
        id: `overflow_msg_${i}`,
        chat_id: testChatId,
        author: 'Đậu Đậu Pro',
        content: `Tin nhắn tuần tự số #${i}`
      });
    }
    const msgs = db.getChatMessages(testChatId);
    if (msgs.length > 36) {
      throw new Error(`Expected max 36 messages, but found ${msgs.length}`);
    }
    // Verify latest message is present
    const latest = msgs[msgs.length - 1];
    if (latest.content !== 'Tin nhắn tuần tự số #40') {
      throw new Error('Newest message was pruned incorrectly');
    }
  });

  // --- SUITE 5: Realtime Socket.io Engine ---
  console.log('\n--- Suite 5: Realtime Socket.io Engine ---');

  await test('Socket.io connects and receives broadcasted messages in real time', async () => {
    const socket = ioClient(baseUrl, { transports: ['websocket', 'polling'] });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connect timeout')), 4000);
      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.on('connect_error', reject);
    });

    socket.emit('register_user', { userId: 'u_tester', userName: 'Đậu Đậu Pro' });
    socket.emit('join_chat', { chatId: 'chat-world-class' });

    const receivedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Real-time message receive timeout')), 4000);
      socket.on('new_message', (data) => {
        if (data.chatId === 'chat-world-class' && data.message.content.includes('Socket Realtime Broadcast')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    socket.emit('send_message', {
      chatId: 'chat-world-class',
      author: 'Đậu Đậu Pro',
      content: 'Socket Realtime Broadcast Test Message'
    });

    await receivedPromise;
    socket.disconnect();
  });

  // --- SUITE 6: Cleanup & Deletion ---
  console.log('\n--- Suite 6: Cleanup & Deletion ---');

  await test('DELETE /api/chats/:id removes chat and its associated messages', async () => {
    const res = await fetch(`${baseUrl}/api/chats/${testChatId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const checkRes = await fetch(`${baseUrl}/api/chats/${testChatId}`);
    if (checkRes.status !== 404) throw new Error('Chat was not deleted');
  });

  // Summary
  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  server.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  if (server) server.close();
  process.exit(1);
});
