# Messenger-Style Chat Design

## Mục tiêu

Đưa trải nghiệm trò chuyện của PingPing gần với Messenger Web ở mức cốt lõi: khung chat ổn định theo viewport, tin nhắn được gom cụm tự nhiên, composer thân thiện và cập nhật realtime mượt. Giao diện vẫn dùng nhận diện PingPing và không sao chép các tính năng xã hội ngoài phạm vi.

## Phạm vi

Bao gồm:

- Bố cục chat toàn chiều cao còn lại dưới thanh điều hướng.
- Sidebar phòng chat, header hội thoại, danh sách tin và composer theo nhịp Messenger Web.
- Gom các tin liên tiếp của cùng người thành cụm.
- Composer tự tăng chiều cao, Enter gửi và Shift+Enter xuống dòng.
- Giữ tải ban đầu 15 tin và append realtime không reload.
- Responsive cho desktop và mobile.

Không bao gồm reaction, reply, trạng thái đang nhập, đã xem, tìm kiếm, sửa/xóa/ghim tin hoặc tải lịch sử cũ hơn.

## Bố cục

Trên desktop, tab chat chiếm phần chiều cao còn lại của viewport sau global header. `chat-shell` gồm sidebar cố định bên trái và vùng hội thoại bên phải. Body của trang không tăng chiều cao theo lịch sử chat; chỉ `chat-message-list` cuộn.

Header hội thoại luôn nằm trên danh sách và hiển thị avatar đại diện, tên phòng, số thành viên cùng trạng thái kết nối. Composer luôn nằm dưới danh sách nhưng vẫn thuộc luồng grid của `chat-main`, nên không che nội dung.

Trên màn hình dưới 900px, danh sách phòng chuyển thành hàng ngang có thể cuộn. Bubble tin nhắn được phép rộng tối đa khoảng 85% vùng hội thoại.

## Gom cụm tin nhắn

Hai tin liền nhau thuộc cùng cụm khi:

- Có cùng `sender.id`.
- Cùng phòng.
- Khoảng cách thời gian không quá 5 phút.

Mỗi tin nhận một vị trí `single`, `first`, `middle` hoặc `last` dựa trên hàng xóm trước/sau. Quy tắc hiển thị:

- `single`: hiện tên và avatar.
- `first`: hiện tên, ẩn avatar nhưng giữ đúng khoảng trống căn hàng.
- `middle`: ẩn tên và avatar.
- `last`: ẩn tên, hiện avatar.
- Tin của chính người dùng không hiện avatar và tên trong bubble; vẫn dùng các vị trí để điều chỉnh bán kính góc.

Khi append realtime, vị trí của tin cuối đang có và tin mới phải được tính lại. Không render lại toàn bộ lịch sử; chỉ cập nhật class/metadata của tin cuối cũ rồi append tin mới.

## Mốc thời gian

Một separator thời gian xuất hiện trước tin khi đó là tin đầu danh sách hoặc cách tin trước ít nhất 15 phút. Mỗi bubble có `title` hoặc nhãn trợ năng chứa thời gian đầy đủ để xem khi hover/focus mà không làm giao diện thường xuyên bị nhiễu.

## Hình thức tin nhắn

- Tin của mình nằm phải, nền xanh accent PingPing, chữ trắng.
- Tin của người khác nằm trái, nền xám trung tính, chữ theo theme.
- Khoảng cách giữa các tin cùng cụm nhỏ; khoảng cách giữa hai cụm lớn hơn.
- Bán kính bubble thay đổi theo `single/first/middle/last` để tạo hình cụm giống Messenger.
- File đính kèm tiếp tục dùng card riêng nhưng nằm gọn trong bubble và không phá chiều rộng.
- Chuyển động append dùng opacity/translate rất nhẹ và tôn trọng `prefers-reduced-motion`.

## Composer

Composer dùng nền pill, nút đính kèm tròn bên trái và nút gửi tròn bên phải. Textarea tăng chiều cao theo nội dung đến giới hạn 5 dòng, sau đó tự cuộn bên trong. Sau khi gửi thành công, chiều cao trở về một dòng.

Enter gửi tin; Shift+Enter tạo dòng mới. Khi IME đang composition, Enter không gửi. Nút gửi có trạng thái disabled trong request để tránh gửi trùng.

## Dữ liệu và realtime

Luồng tải 15 tin gần nhất và append theo ID hiện tại được giữ nguyên. Trước khi render, client tạo metadata nhóm từ danh sách theo thứ tự thời gian. Khi nhận tin mới, client chỉ so sánh tin mới với tin cuối đã render để quyết định cụm và separator.

Nếu người dùng đang gần cuối, tin mới tự cuộn xuống. Nếu đang đọc phía trên, vị trí được giữ nguyên và nút “Có tin nhắn mới” xuất hiện.

## Trạng thái và lỗi

- Loading lần đầu dùng các skeleton bubble thay vì dòng chữ tải đơn lẻ.
- Empty state giữ ngắn gọn và nằm giữa vùng hội thoại.
- Lỗi tải không phá composer hoặc sidebar.
- Lỗi gửi giữ nguyên nội dung và file để thử lại.
- Mất kết nối được phản ánh ở header hội thoại, không thay đổi lịch sử đang hiển thị.

## Kiểm thử

- Hàm nhóm trả đúng `single/first/middle/last` theo sender và ngưỡng 5 phút.
- Separator xuất hiện ở tin đầu và khoảng cách từ 15 phút trở lên.
- Append chỉ cập nhật tin cuối cũ và thêm tin mới, không thay toàn bộ DOM.
- Tên/avatar hiển thị đúng theo vị trí cụm.
- Enter, Shift+Enter và IME giữ hành vi hiện tại.
- Textarea tự tăng đến 5 dòng và reset sau khi gửi.
- Contract CSS xác nhận khung chat theo viewport, scroll nằm ở message list và responsive dưới 900px.
- Toàn bộ test realtime, chống trùng và giới hạn 15 tin hiện có tiếp tục đạt.

## Tiêu chí hoàn thành

Chat có nhịp nhìn và sử dụng quen thuộc như Messenger Web, không làm trang dài theo lịch sử tin, gom tin liên tiếp chính xác, composer hoạt động tự nhiên, và không làm suy giảm luồng realtime hiện tại.
