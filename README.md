# PingPing Portal

Portal nội bộ dành cho nhóm 7 thành viên cùng theo dõi và phối hợp tham gia 3 cuộc thi AI & Tech năm 2026. Ứng dụng tập trung thông tin cuộc thi, đội hình, lịch trình, công việc và trao đổi realtime trong một giao diện duy nhất.

## Cập nhật nổi bật

Đợt cập nhật hiện tại nâng cấp toàn bộ portal, không chỉ bổ sung tính năng thách đấu X-O:

- **Dữ liệu cuộc thi:** tập trung portal vào 3 cuộc thi đang hoạt động, đồng bộ lại phòng chat, đội hình, Kanban và thông báo liên quan.
- **Cộng tác realtime:** giữ trạng thái online ổn định, tách trạng thái đang nhập, làm mới giao diện ngay khi đăng nhập/đăng xuất và đồng bộ dữ liệu giữa các thành viên.
- **Chat:** hỗ trợ dán ảnh trực tiếp từ clipboard, trả lời, reaction, mention, preview media/liên kết và nhóm tin nhắn theo người gửi.
- **Hiệu năng và lưu trữ:** thêm index truy vấn tin nhắn, giới hạn lịch sử từng phòng và cron tự động dọn dữ liệu chat cũ.
- **Giao diện:** theme bầu trời sao, hiệu ứng chuyển động nhẹ hơn và thanh điều hướng responsive.
- **Sòng X-O:** bàn cờ caro mở rộng, thách đấu BO1, cược, rating, ví điểm Công dân, điểm danh hằng ngày và bảng xếp hạng realtime.
- **Chất lượng:** bổ sung unit test, schema test và frontend contract test cho các luồng mới.

## Tính năng

- **Dashboard:** tổng quan cuộc thi, đội hình, khối lượng công việc, hạn chót và các mốc sắp tới.
- **Cuộc thi & lịch trình:** thông tin từng cuộc thi, chủ đề, giải thưởng, liên kết đăng ký và bộ đếm ngược.
- **Phân chia đội hình:** gán thành viên vào từng nhóm và cảnh báo khi số lượng không đúng điều lệ.
- **Kanban:** tạo, cập nhật, phân công và theo dõi trạng thái công việc.
- **Thành viên:** danh bạ, kỹ năng, trạng thái online và chỉnh sửa hồ sơ cá nhân.
- **Chat realtime:** phòng chat, trả lời tin nhắn, reaction, mention, xem trước liên kết và gửi ảnh/video/tệp đính kèm.
- **Thông báo:** badge chưa đọc, trung tâm thông báo và thông báo trình duyệt.
- **Sòng X-O:** thách đấu cờ caro, bảng xếp hạng, điểm Công dân, điểm danh hằng ngày và đặt cược trong nhóm.
- **Đăng nhập bằng mã thành viên:** mỗi thành viên dùng mã riêng và có thể đổi mã sau khi đăng nhập.

## Công nghệ

- HTML, CSS và JavaScript ES modules
- [Vite](https://vite.dev/) cho development server và production build
- [Supabase](https://supabase.com/) cho PostgreSQL, Realtime, Storage và Edge Functions
- Node.js Test Runner và Bash cho kiểm thử

## Yêu cầu

- Node.js `20.19+` hoặc `22.12+`
- npm
- Một project Supabase nếu cần chạy đầy đủ tính năng cộng tác realtime

## Chạy local

```bash
git clone https://github.com/shiina613/pingping.git
cd pingping
npm install
npm run dev
```

Vite sẽ in địa chỉ local trong terminal, mặc định là `http://localhost:5173`.

## Cấu hình Supabase

Frontend đọc cấu hình từ [`config.js`](./config.js):

```js
window.PINGPING_CONFIG = Object.freeze({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-publishable-key',
  xoArenaEnabled: true,
  xoArenaTesterIds: []
});
```

- `supabaseUrl`: URL của project Supabase.
- `supabaseKey`: publishable/anon key dùng ở frontend; không đặt service-role key tại đây.
- `xoArenaEnabled`: bật hoặc tắt tab Sòng X-O.
- `xoArenaTesterIds`: giới hạn Sòng X-O cho các ID thành viên chỉ định; để mảng rỗng cho phép mọi thành viên.

Các bảng, policy, RPC và lịch dọn dẹp chat nằm trong [`supabase/migrations`](./supabase/migrations). Với Supabase CLI đã liên kết project:

```bash
npx supabase db push
npx supabase functions deploy cleanup-chat-attachments
```

## Lệnh thường dùng

```bash
npm run dev       # chạy development server
npm test          # chạy toàn bộ test
npm run build     # tạo production build trong dist/
npm run preview   # xem thử production build
```

## Cấu trúc chính

```text
.
├── index.html                    # giao diện và các tab chính
├── index.css                     # theme và responsive styles
├── app.js                        # điều phối giao diện và trạng thái portal
├── collaboration-controller.js   # đăng nhập, realtime, chat và thông báo
├── collaboration.js              # helper/validation cho cộng tác
├── config.js                     # cấu hình Supabase và feature flags
├── src/                          # dữ liệu, countdown, Supabase client và logic X-O
├── supabase/                     # migrations và Edge Functions
└── tests/                        # unit, schema và frontend contract tests
```

## Lưu ý bảo mật

Ứng dụng hiện phục vụ một nhóm nội bộ và xác thực bằng mã thành viên. Khi triển khai cho phạm vi rộng hơn, nên chuyển sang Supabase Auth, siết Row Level Security theo từng người dùng và quản lý secrets của Edge Functions ở phía server.

## License

Repository chưa khai báo giấy phép mã nguồn mở.
