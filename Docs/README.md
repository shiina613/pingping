# 💬 PingPing — Claude-style Minimalist Messenger

> Một ứng dụng nhắn tin thời gian thực đơn giản, hiện đại mang trọn vẹn triết lý giao diện và trải nghiệm (UX/UI) tinh tế của **Claude.ai**.

---

## 🎯 1. Tầm nhìn & Ý tưởng cốt lõi (Vision & Concept)

**PingPing** biến trải nghiệm giao tiếp giữa người với người (Human-to-Human Messaging) trở nên tối giản, tập trung và thanh lịch:

- **Prompt-Driven Communication**: Mọi cuộc trò chuyện đều bắt đầu từ ô nhập liệu trung tâm ở trang New Chat giống như đang tương tác với AI, nhưng phía sau là bạn bè và đồng nghiệp.
- **Điều hướng thông minh bằng `@`**:
  - `@ 1 người` (ví dụ `@Hậu chào bạn`) $\rightarrow$ Tự động mở/tạo phiên chat trực tiếp 1-1 (Direct Message).
  - `@ nhiều người` (ví dụ `@Hậu @Tùng @An họp nhé`) $\rightarrow$ Tự động khởi tạo nhóm cộng tác (Group/Cowork).
  - Quản trị thành viên trong nhóm bằng lệnh tự nhiên (`@Tên` để thêm, `@rm-Tên` để xóa).
- **Session-Based Collaboration**: Mỗi phiên trò chuyện là một "Session/Task" riêng biệt, dễ dàng đổi tên, tìm kiếm hoặc lưu trữ gọn gàng ở Sidebar.
- **Hỗ trợ đa phương tiện đầy đủ**: Gửi ảnh (kèm Lightbox phóng to), video player trực tiếp, file tài liệu, link preview Open Graph, voice notes và code snippet artifacts.
- **Xác thực đơn giản**: Đăng ký / Đăng nhập tài khoản cơ bản, lưu trữ cơ sở dữ liệu trực tiếp, dễ triển khai cho dự án cá nhân/team nội bộ.

---

## 📱 2. Danh sách tính năng (Feature Highlights)

### 2.1. Xác thực & Tài khoản (Auth & Profiles)
- Đăng ký tài khoản (`username`, `password`, `displayName`, `role`).
- Đăng nhập & lưu phiên làm việc (JWT Token / Session Cookie).
- Cập nhật hồ sơ cá nhân, đổi tên hiển thị, chức danh/vai trò.

### 2.2. Khởi tạo hội thoại (New Chat Screen)
- **Màn hình Hero chuẩn Claude**: Dấu hoa thị Asterisk màu cam ấm + lời chào theo thời gian thực (*"Hello, night owl"*).
- **Dual Mode (Chat vs Cowork)**:
  - `Chat`: Nhắn tin 1-1 qua dropdown danh bạ.
  - `Cowork`: Nhắn tin vào nhóm hoặc tạo nhóm mới.
- **Smart Tagging**: Tự động nhận diện số lượng người được tag `@` để tạo phiên chat 1-1 hoặc Nhóm phù hợp.
- **Gợi ý Autocomplete khi gõ `@`**: Danh sách bạn bè kèm avatar, vai trò và trạng thái trực tuyến.

### 2.3. Trải nghiệm luồng chat (Active Chat View)
- **Thiết kế Typography-first**: Giao diện sạch sẽ, loại bỏ khung viền rườm rà.
- **Thanh nhập liệu nổi (Sticky Bottom Input)**: Bo cong hình viên thuốc `26px`, nút gửi linh hoạt, nút đính kèm `+`, nút ghi âm.
- **Lệnh điều khiển nhóm**:
  - Gõ `@<Tên>`: Thêm thành viên vào nhóm chat hiện tại + thông báo hệ thống.
  - Gõ `@rm-<Tên>`: Mời thành viên rời nhóm chat + thông báo hệ thống màu đỏ.
- **Trạng thái đối phương đang nhập (Typing / Sifting indicator)**: Asterisk xoay màu đồng ấm khi bạn bè đang soạn tin nhắn.

### 2.4. Đa phương tiện & Tệp đính kèm (Rich Media)
- **Hình ảnh**: Xem trước thumbnail bo góc `12px` + Lightbox Modal phóng to toàn màn hình + nút Tải xuống.
- **Video clip**: Trình phát video HTML5 tích hợp ngay trong tin nhắn.
- **Tài liệu (PDF, Word, Code, Zip)**: Thẻ tài liệu chuyên nghiệp kèm nút tải về nhanh.
- **Link Highlight & Open Graph Card**: Tự động phát hiện URL và tạo card preview (ảnh, tiêu đề, mô tả, tên miền).
- **Voice Note**: Thẻ tin nhắn thoại kèm waveform animation và thời lượng.
- **Dán ảnh Clipboard (`Ctrl + V`) & Kéo thả (Drag & Drop)**.

### 2.5. Kênh toàn cầu "World Class" & Giới hạn lưu trữ xoay vòng (Retention Limits)
- **Kênh chat chung "World Class 🌍"**: Mặc định luôn có sẵn cho mọi tài khoản để giao lưu tự do, tự động lưu giữ **180 tin nhắn** mới nhất.
- **Session thông thường (1-1 / Nhóm)**: Giới hạn lưu trữ **36 tin nhắn** gần nhất.
- **Cơ chế Atomic FIFO Pruning**: Tự động xóa các tin nhắn cũ hơn khi đạt giới hạn để giữ hệ thống siêu nhẹ, bảo vệ database và triệt tiêu xung đột ghi dữ liệu.

### 2.6. Sidebar & Điều hướng
- Nút đóng/mở Sidebar (`Ctrl + \`), không gian làm việc rộng rãi.
- Quản lý danh sách Session chat: **Đổi tên trực tiếp (`✏️` hoặc double click)**, **Xóa session (`🗑️`)**.
- Tab **Projects**: Xem danh bạ và nhóm chat dạng lưới (Grid card) với bộ lọc thông minh.
- Tab **Customize**: Đổi theme (Dark / Light / Amber Claude), bật/tắt âm thanh, bật/tắt thông báo.
- **Tìm kiếm toàn cục (`Ctrl + K`)**: Tìm nhanh tin nhắn, phiên chat hoặc bạn bè.

---

## 🛠️ 3. Cấu trúc tài liệu dự án

- 📄 [`ARCHITECTURE.md`](ARCHITECTURE.md): Kiến trúc hệ thống, luồng Realtime WebSocket và mô hình dữ liệu (Database Schema).
- 🔌 [`API_SPEC.md`](API_SPEC.md): Đặc tả chi tiết các REST API endpoints và Socket events.
- 🚀 [`DEPLOYMENT.md`](DEPLOYMENT.md): Hướng dẫn cài đặt, chạy local và triển khai lên server (Docker / VPS / Cloud).
