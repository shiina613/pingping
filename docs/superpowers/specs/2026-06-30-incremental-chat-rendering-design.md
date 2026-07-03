# Incremental Chat Rendering Design

## Mục tiêu

Sửa lỗi avatar ảnh bị render thành chuỗi Data URL làm vỡ bố cục chat, đồng thời loại bỏ việc tải và dựng lại toàn bộ lịch sử mỗi khi có tin nhắn mới.

## Phạm vi

- Khi mở một phòng, chỉ tải 15 tin nhắn gần nhất.
- Hiển thị 15 tin theo thứ tự thời gian từ cũ đến mới.
- Tin nhắn mới được nối vào danh sách hiện tại, không xóa hay dựng lại các tin đã có.
- Không thêm phân trang hoặc chức năng tải lịch sử cũ hơn trong thay đổi này.

## Luồng dữ liệu

### Mở phòng

Client truy vấn 15 tin gần nhất theo thời gian giảm dần, sau đó đảo thứ tự kết quả trước khi render. Danh sách ID đã render được khởi tạo lại cho phòng vừa mở. Trạng thái “có tin mới” của phòng trước được xóa.

### Gửi tin

Sau khi insert thành công, client lấy bản ghi đầy đủ của đúng tin vừa tạo, gồm người gửi và file đính kèm nếu có, rồi append bản ghi đó. Client không gọi lại hàm tải lịch sử phòng.

### Nhận realtime

Khi Supabase phát sự kiện insert cho phòng đang mở, client kiểm tra ID. Nếu ID đã có thì bỏ qua. Nếu payload chưa chứa đủ quan hệ người gửi hoặc file đính kèm, client chỉ truy vấn bản ghi vừa được thêm rồi append; không tải lại cả phòng.

## Render avatar

Một helper duy nhất tạo avatar cho phần tài khoản và tin nhắn:

- Giá trị bắt đầu bằng `data:image/` được render bằng thẻ `img`.
- Giá trị văn bản như emoji được render thành text đã escape.
- Giá trị trống dùng chữ cái đầu của tên người gửi.
- Ảnh luôn bị giới hạn trong khung tròn và dùng `object-fit: cover`, nên nội dung avatar không thể kéo giãn hàng chat.

## Cuộn và thông báo tin mới

Trước khi append, client xác định người dùng có đang ở gần cuối danh sách hay không bằng một ngưỡng nhỏ.

- Nếu đang gần cuối, append xong sẽ tự cuộn xuống cuối.
- Nếu đang đọc phía trên, vị trí cuộn được giữ nguyên và nút “Có tin nhắn mới ↓” xuất hiện.
- Bấm nút sẽ cuộn xuống cuối và ẩn nút.
- Khi người dùng tự cuộn xuống cuối, nút cũng tự ẩn.
- Tin do chính người dùng vừa gửi luôn cuộn xuống cuối vì đây là hành động có chủ đích.

## Chống trùng và cạnh tranh bất đồng bộ

Mỗi tin được nhận diện bằng `message.id`. Cùng một tin có thể đến từ kết quả insert và realtime, nhưng chỉ lần append đầu tiên được chấp nhận. Kết quả tải hoặc fetch thuộc phòng cũ bị bỏ qua nếu người dùng đã chuyển phòng trong lúc request đang chạy.

## Xử lý lỗi

- Lỗi tải lần đầu hiển thị trạng thái lỗi trong danh sách chat.
- Lỗi fetch một tin realtime không xóa nội dung hiện tại; trạng thái kết nối hoặc thông báo lỗi được cập nhật riêng.
- Lỗi gửi giữ nguyên nội dung đang soạn và file đã chọn để người dùng có thể thử lại.

## Kiểm thử

- Truy vấn mở phòng giới hạn đúng 15 tin gần nhất và render theo thứ tự cũ đến mới.
- Data URL được render thành `img`; emoji và fallback vẫn đúng.
- Append không thay thế các DOM message hiện có.
- Hai nguồn cung cấp cùng một ID không tạo tin trùng.
- Đang gần cuối thì tự cuộn; đang đọc phía trên thì giữ vị trí và hiện nút tin mới.
- Chuyển phòng trong lúc request cũ chưa hoàn thành không làm lẫn tin giữa hai phòng.

## Tiêu chí hoàn thành

Khung chat không còn bị vỡ bởi chuỗi avatar, lúc mở phòng chỉ tải 15 tin, và gửi/nhận tin mới không còn xuất hiện trạng thái tải lại hoặc dựng lại toàn bộ đoạn chat.
