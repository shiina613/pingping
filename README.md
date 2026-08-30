# 💬 PingPing — Claude-style Minimalist Realtime Messenger

> Ứng dụng nhắn tin thời gian thực phong cách **Claude.ai** tối giản, thanh lịch, độ trễ siêu thấp (< 50ms) và độ ổn định cao.

![PingPing Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80)

---

## 🎯 1. Tính năng nổi bật (Features)

- 🎨 **Giao diện Claude-first**: Thiết kế tối giản, bảng màu ấm áp, font chữ Instrument Serif + Plus Jakarta Sans + JetBrains Mono.
- ⚡ **Độ trễ siêu thấp (< 50ms)**: Kết hợp **Node.js (Express)**, **Socket.io (WebSocket)** và **SQLite WAL Mode (Write-Ahead Logging)**.
- 💡 **Prompt-Driven & Smart Tagging `@`**:
  - Gõ `@ 1 người` $\rightarrow$ Mở/tạo phiên chat trực tiếp 1-1.
  - Gõ `@ nhiều người` $\rightarrow$ Tự động tạo nhóm cộng tác.
  - Quản trị thành viên bằng lệnh tự nhiên (`@Tên` để thêm, `@rm-Tên` để mời ra khỏi nhóm).
- 🖼️ **Hỗ trợ đa phương tiện (Rich Media)**:
  - Ảnh xem trước + Lightbox Modal phóng to toàn màn hình + nút tải về.
  - Video HTML5 player mượt mà.
  - Đính kèm tài liệu (PDF, Word, Code, Zip) với endpoint tải tệp thực `/uploads/`.
  - Voice Note với Waveform animation.
  - Dán ảnh từ Clipboard (`Ctrl + V`) và kéo thả (Drag & Drop).
- 🌍 **Kênh toàn cầu "World Class" & Cơ chế xoay vòng tin nhắn (Atomic FIFO Pruning)**:
  - Kênh chung `World Class 🌍`: Giữ tối đa **180 tin nhắn** mới nhất.
  - Các phiên chat thường (1-1 / Nhóm): Giữ tối đa **36 tin nhắn** mới nhất.
  - Tự động dọn dẹp tin nhắn cũ để bảo vệ database luôn siêu nhẹ và nhanh.
- 👤 **Chuyển đổi tài khoản nhanh**: Dễ dàng đổi danh tính người dùng trong tích tắc để kiểm thử nhiều bên cùng lúc.

---

## 🚀 2. Hướng dẫn cài đặt & Khởi chạy (Quickstart)

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18, 20 hoặc 22+.
- **NPM**: 9.x trở lên.

### Bước 1: Cài đặt thư viện
```bash
git clone https://github.com/shiina613/pingping.git
cd pingping
npm install
```

### Bước 2: Khởi chạy máy chủ
```bash
# Chế độ chạy thông thường
npm start

# Hoặc chế độ phát triển tự reload (Nodemon)
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:8080`**

---

## 🛡️ 3. Triển khai Production (PM2 & Nginx)

### Quản lý tiến trình bằng PM2
```bash
# Cài đặt PM2 toàn cục (nếu chưa có)
npm install -g pm2

# Khởi chạy ứng dụng qua ecosystem file
npm run prod
# hoặc: pm2 start ecosystem.config.js

# Lưu trạng thái tự khởi động lại khi reboot VPS
pm2 save
pm2 startup
```

### Cấu hình Nginx Reverse Proxy (WebSocket + SSL)
```nginx
server {
    listen 80;
    server_name chat.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    location /uploads/ {
        alias /path/to/pingping/uploads/;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 📁 4. Cấu trúc thư mục (Project Structure)

```
pingping/
├── Docs/                     # Tài liệu thiết kế, API & kiến trúc
│   ├── API_SPEC.md           # Đặc tả REST API & Socket Events
│   ├── ARCHITECTURE.md       # Kiến trúc hệ thống & Database Schema
│   ├── DEPLOYMENT.md         # Hướng dẫn triển khai & Tối ưu hiệu năng
│   └── README.md             # Tóm tắt tầm nhìn sản phẩm
├── database/                 # Thư mục lưu file SQLite (.db)
│   └── pingping.db
├── uploads/                  # Thư mục lưu trữ media & file tải lên
├── server.js                 # Máy chủ Express + Socket.io + REST API
├── database.js               # Động cơ SQLite database & FIFO Pruning
├── ecosystem.config.js       # File cấu hình quản lý PM2
├── index.html                # Giao diện Single Page Application
├── style.css                 # Hệ thống CSS Design System chuẩn Claude
├── app.js                    # Logic client, tương tác & realtime sync
└── package.json              # Khai báo dependencies & scripts
```

---

## 📄 License

Dự án phát hành dưới giấy phép [MIT](LICENSE).
