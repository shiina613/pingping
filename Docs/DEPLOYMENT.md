# 🚀 PingPing — Hướng dẫn triển khai & Tối ưu hiệu năng (Production & Reliability Guide)

Tài liệu này cung cấp toàn bộ các tiêu chuẩn kỹ thuật để đảm bảo **Chất lượng cao**, **Độ trễ siêu thấp (< 50ms)** và **Độ ổn định 24/7** cho ứng dụng **PingPing**.

---

## 1. Kiến trúc tối ưu: Chất lượng — Độ trễ — Độ ổn định

```
                ┌──────────────────────────────────────────────┐
                │          Cloudflare CDN / SSL Cache          │
                └──────────────────────┬───────────────────────┘
                                       │ HTTP/2 + WSS (Websocket Secure)
                                       ▼
                ┌──────────────────────────────────────────────┐
                │       Nginx Reverse Proxy (Gzip/Brotli)      │
                │  - Connection Buffering & Rate Limiting      │
                │  - WebSocket Upgrade Handshake               │
                └──────────────────────┬───────────────────────┘
                                       │ Unix Socket / Port 8080
                                       ▼
                ┌──────────────────────────────────────────────┐
                │          Node.js Engine (PM2 Worker)         │
                │  - Socket.io (Low-latency WebSocket engine)  │
                │  - Express REST API & Payload Sanitizer      │
                │  - Heartbeat Ping-Pong (25s timeout)         │
                └──────────────────────┬───────────────────────┘
                                       │ In-Process C++ Bindings (< 0.5ms)
                                       ▼
                ┌──────────────────────────────────────────────┐
                │      SQLite with WAL Mode (Zero Lock)        │
                │  - PRAGMA journal_mode = WAL                 │
                │  - PRAGMA synchronous = NORMAL               │
                │  - Concurrent Reads & Writes                 │
                └──────────────────────────────────────────────┘
```

---

## 2. Bí quyết đạt độ trễ siêu thấp (< 50ms)

### 2.1. Cấu hình SQLite WAL Mode (Write-Ahead Logging)
Mặc định SQLite khóa toàn bộ file khi ghi. Bật chế độ WAL cho phép **vừa đọc vừa ghi đồng thời** mà không bao giờ bị nghẽn (Zero Database Lock):

```javascript
// server/database.js
const Database = require('better-sqlite3');
const db = new Database('database/pingping.db', { timeout: 5000 });

// Kích hoạt WAL mode và tối ưu bộ nhớ đệm
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');
db.pragma('cache_size = -64000'); // 64MB memory cache
db.pragma('busy_timeout = 5000'); // Tránh lỗi SQLITE_BUSY khi tải cao
```

### 2.2. Tối ưu WebSocket Engine (Socket.io)
- Bật trực tiếp cơ chế **WebSocket First** (bỏ qua bước polling HTTP dài dòng):
```javascript
const io = require('socket.io')(server, {
  cors: { origin: '*' },
  transports: ['websocket'], // Ưu tiên trực tiếp WebSocket thuần
  pingInterval: 10000,       // Gửi ping mỗi 10 giây
  pingTimeout: 5000          // Phát hiện rớt mạng sau 5 giây
});
```

---

## 3. Đảm bảo độ ổn định & Khả năng tự phục hồi (High Availability)

### 3.1. Phía Client: Tự động kết nối lại (Auto-Reconnect & Offline Buffer)
Khi người dùng mất mạng (đổi Wi-Fi, 4G chập chờn), Client tự động giữ hàng đợi tin nhắn và kết nối lại ngay khi có mạng:

```javascript
const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5
});

socket.on('connect', () => {
  console.log('🟢 Đã kết nối máy chủ PingPing thời gian thực');
  // Tự động gia nhập lại các session hiện có
});

socket.on('disconnect', (reason) => {
  console.warn('🟡 Mất kết nối:', reason);
});
```

### 3.2. Phía Server: Giám sát PM2 & Tự khởi động lại khi gặp sự cố
Sử dụng file cấu hình `ecosystem.config.js` để PM2 tự động quản lý vòng đời ứng dụng:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pingping',
    script: 'server.js',
    instances: 1, // Dùng 1 instance tối ưu cho SQLite local
    autorestart: true,
    max_memory_restart: '500M', // Khởi động lại nếu leak RAM > 500MB
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
};
```

### 3.3. Graceful Shutdown (Tắt ứng dụng an toàn không làm hỏng DB)
```javascript
// Đóng kết nối an toàn khi server restart hoặc nhận lệnh tắt
const shutdown = () => {
  console.log('Đang đóng kết nối an toàn...');
  server.close(() => {
    db.close();
    console.log('Database và Server đã đóng sạch sẽ.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

---

## 4. Bảo vệ chất lượng & Chống quá tải (Quality & Rate Limiting)

1. **Giới hạn tốc độ gửi tin (Rate Limiting)**:
   - Mỗi người dùng chỉ được gửi tối đa **5 tin/giây** để ngăn chặn bot spam hoặc treo client người khác.
2. **Giới hạn kích thước Payload**:
   - Tin nhắn văn bản: Tối đa `5,000` ký tự.
   - Tệp tải lên: Tối đa `50MB` / file.
3. **Endpoint kiểm tra sức khỏe hệ thống (`GET /health`)**:
   - Trả về trạng thái RAM, số kết nối WebSocket đang hoạt động và tình trạng database.

---

## 5. File cấu hình mẫu hoàn chỉnh (Ready-to-Deploy)

### 5.1. File `package.json`
```json
{
  "name": "pingping-messenger",
  "version": "2.0.0",
  "description": "Claude-style Minimalist Messenger",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prod": "pm2 start ecosystem.config.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "express-rate-limit": "^7.1.5",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

### 5.2. File cấu hình Nginx tối ưu Reverse Proxy
```nginx
# /etc/nginx/sites-available/pingping
server {
    listen 80;
    server_name chat.yourdomain.com;

    # Nén Gzip tăng tốc độ tải trang
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # Client IP tracing
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts cho kết nối WebSocket sống dài
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /uploads/ {
        alias /var/www/pingping/uploads/;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 6. Checklist kiểm tra trước khi Go-Live (Pre-Launch Checklist)

- [x] Đã bật SQLite **WAL Mode** (`PRAGMA journal_mode = WAL`).
- [x] Đã thiết lập giới hạn tin nhắn **36 tin (phòng thường)** và **180 tin (World Class)**.
- [x] Đã cấu hình Nginx **WebSocket Upgrade** và timeouts 86400s.
- [x] Đã cài đặt SSL HTTPS/WSS qua **Certbot**.
- [x] Đã chạy ứng dụng qua **PM2** với cơ chế tự khởi động khi reboot máy chủ.
- [x] Đã kiểm tra thời gian phản hồi ping tin nhắn $< 50\text{ms}$.
