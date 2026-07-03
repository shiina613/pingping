# PingPing Portal

**PingPing Portal** là hệ thống quản lý toàn diện dành cho chuỗi 5 Cuộc thi AI & Tech năm 2026. Nền tảng được xây dựng với mục tiêu cung cấp một không gian làm việc tập trung, tích hợp đầy đủ các công cụ cần thiết giúp các thành viên Ban tổ chức dễ dàng theo dõi, điều phối và cộng tác trong suốt quá trình diễn ra sự kiện.

## 🌟 Tính năng Nổi bật

### 1. Quản trị & Điều hành (Core Features)
- **Bảng điều khiển (Dashboard)**: Cung cấp cái nhìn tổng quan về tiến độ, số liệu thống kê và các hoạt động quan trọng đang diễn ra.
- **Quản lý Cuộc thi (Competitions)**: Theo dõi thông tin chi tiết, trạng thái và tiến độ của từng cuộc thi trong chuỗi sự kiện.
- **Lập kế hoạch (Planner)**: Lên lịch trình, quản lý task và điều phối công việc hiệu quả giữa các bộ phận.

### 2. Tương tác & Cộng tác Thời gian thực (Realtime & Collaboration)
- **Cộng tác Thời gian thực (Realtime Collaboration)**: Hỗ trợ làm việc chung trên cùng một luồng công việc, đồng bộ trạng thái ngay lập tức.
- **Hệ thống Chat kiểu Messenger (Messenger-Style Chat)**: Nền tảng trò chuyện mượt mà, hỗ trợ render tin nhắn từng phần (Incremental Rendering) và xem trước file đính kèm/media (Media Preview).
- **Quản lý & Lưu trữ Chat (Chat Moderation & Retention)**: Hỗ trợ kiểm duyệt nội dung, lưu trữ và tự động dọn dẹp các tệp đính kèm theo chính sách của hệ thống.
- **Thông báo Thông minh (Relevant Notifications)**: Gửi thông báo chính xác và kịp thời cho các hoạt động và thay đổi quan trọng thông qua hệ thống index được tối ưu hóa.

## 🚀 Công nghệ Sử dụng

Nền tảng được xây dựng dựa trên kiến trúc hiện đại, tập trung vào hiệu năng và khả năng mở rộng:

- **Frontend**: HTML5, CSS3, JavaScript (Vite)
- **Backend & Cơ sở dữ liệu**: Supabase (PostgreSQL, Supabase Realtime, Supabase Storage, Edge Functions)
- **Testing**: Node.js Test Runner, Bash scripts cho kiểm thử contract frontend

## 🛠 Hướng dẫn Cài đặt & Chạy Dự án

### Yêu cầu cấu hình
- Node.js (phiên bản mới nhất được khuyến nghị)
- Môi trường npm hoặc yarn

### Cài đặt
1. Clone repository về máy.
2. Cài đặt các gói phụ thuộc (dependencies):
   ```bash
   npm install
   ```

### Chạy môi trường Development
Khởi chạy máy chủ phát triển (Vite):
```bash
npx vite
```
Hệ thống sẽ chạy trên localhost tại cổng do Vite cung cấp (thường là http://localhost:5173/).

### Chạy Test
Dự án bao gồm các bộ kiểm thử tự động cho cả code JS và giao diện:
```bash
npm run test
```

## 🔐 Cơ chế Đăng nhập
Mỗi thành viên trong ban tổ chức được cấp một mã đăng nhập (Login Code) riêng biệt. Hệ thống ghi nhận mã gốc dạng văn bản thô (raw) trong lần đầu thiết lập. Sau khi đăng nhập thành công vào hệ thống, người dùng có quyền chủ động đổi mã truy cập để tăng cường bảo mật cho cá nhân.

---
*PingPing Portal - Xây dựng nền tảng vững chắc cho sự thành công của sự kiện AI & Tech 2026.*