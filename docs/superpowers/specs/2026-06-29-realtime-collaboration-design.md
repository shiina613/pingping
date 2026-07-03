# PingPing Realtime Collaboration

## Mục tiêu

Biến portal hiện tại thành không gian cộng tác đơn giản cho 7 thành viên. Ai có link đều xem được; thành viên nhập mã cá nhân để sửa dữ liệu, trò chuyện và gửi file. Hệ thống dùng các gói miễn phí của Vercel và Supabase.

Đây là công cụ trao đổi tạm thời, không dùng cho dữ liệu nhạy cảm. Theo yêu cầu, mã đăng nhập được lưu trực tiếp, không băm.

## Phạm vi

- Dữ liệu thành viên, đội hình và Kanban được chia sẻ giữa mọi trình duyệt.
- Thay đổi được cập nhật realtime.
- Có một phòng chat chung và một phòng cho mỗi cuộc thi.
- Tin nhắn chỉ gồm văn bản hoặc một file đính kèm.
- Không có reply, reaction, sửa/xóa tin nhắn hoặc lịch sử hoạt động.
- Cả 7 thành viên có quyền như nhau; không có quản trị viên.

## Kiến trúc

Giữ frontend HTML, CSS và JavaScript hiện tại trên Vercel Hobby. Supabase Free cung cấp Postgres, Realtime và Storage. Vercel Functions cung cấp API đăng nhập, đổi mã và các thao tác ghi cần phiên đăng nhập.

Supabase là nguồn dữ liệu chính. `localStorage` chỉ giữ theme và session trên thiết bị; cơ chế đồng bộ một JSON lớn hiện tại được loại bỏ.

## Đăng nhập

- Mỗi thành viên hiện có được cấp một mã riêng ban đầu.
- Nhập đúng mã sẽ nhận diện thành viên và tạo session đơn giản.
- Session được lưu trên thiết bị cho tới khi đăng xuất.
- Thành viên có thể đổi mã của chính mình.
- Không có luồng quên mã hoặc khôi phục tự động.
- Ai có link được đọc dữ liệu; đăng nhập mới được sửa, chat hoặc tải file.

Mã và session được lưu dạng raw theo yêu cầu. Không đưa khóa quản trị Supabase vào frontend.

## Mô hình dữ liệu

- `members`: hồ sơ và mã đăng nhập.
- `sessions`: phiên đăng nhập trên thiết bị.
- `allocations`: thành viên được phân vào từng cuộc thi/đội.
- `tasks`: thẻ Kanban và trạng thái.
- `messages`: nội dung, người gửi, phòng và thời gian gửi.
- `attachments`: tên, loại, kích thước và URL file.

Dữ liệu mẫu trong frontend được seed một lần. Mỗi bản ghi được cập nhật riêng. Nếu hai người sửa cùng một bản ghi, lần ghi sau cùng thắng.

## Realtime

Frontend đăng ký Supabase Realtime cho `members`, `allocations`, `tasks` và `messages`. Khi có thay đổi, giao diện cập nhật bản ghi liên quan. Khi kết nối lại sau gián đoạn, frontend tải lại trạng thái mới nhất.

## Trò chuyện và file

Thêm tab `Trò chuyện` với các phòng:

1. Trò chuyện chung
2. OneVoice
3. AI Thực Chiến
4. Vietnam AI Innovation
5. Build@HUB
6. Viettel AI Race

Tin nhắn hiển thị tên/avatar, thời gian và nội dung. Mỗi tin có tối đa một file. Cho phép ảnh, PDF, tài liệu Office và ZIP, tối đa 25 MB. File lưu trong Supabase Storage và mở/tải qua URL công khai.

Giao diện chỉ cần trạng thái đang gửi, gửi thất bại và nút thử lại. Không bổ sung tính năng chat nâng cao.

## Xử lý lỗi

- Mất mạng: báo mất kết nối và không báo lưu thành công.
- Session không hợp lệ hoặc mã đã đổi: đăng xuất và yêu cầu đăng nhập lại.
- File sai loại hoặc quá 25 MB: chặn trước khi upload.
- Realtime ngắt: tự kết nối lại và tải lại dữ liệu.
- Backend không khả dụng: hiển thị lỗi rõ ràng, giữ giao diện đọc được khi có dữ liệu đã tải.

## Kiểm thử và hoàn tất

- Kiểm thử đăng nhập, lưu session, đổi mã và đăng xuất.
- Kiểm thử CRUD dữ liệu hiện có qua hai phiên trình duyệt.
- Kiểm thử tin nhắn realtime ở phòng chung và phòng cuộc thi.
- Kiểm thử upload hợp lệ, giới hạn loại file và 25 MB.
- Kiểm thử mất kết nối và session không hợp lệ.
- Deploy production lên Vercel và xác minh luồng chính trên trình duyệt.

## Giới hạn vận hành

Mục tiêu là nằm trong Supabase Free và Vercel Hobby. Supabase Free có thể tạm dừng project sau một tuần không hoạt động. Tổng file cần giữ dưới hạn mức 1 GB; nếu gần đầy, file cũ sẽ được dọn thủ công trong Supabase Dashboard.
