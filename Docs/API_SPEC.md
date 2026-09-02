# 🔌 PingPing — Đặc tả API & WebSocket (API Specification)

Tài liệu này cung cấp đầy đủ các chuẩn giao tiếp HTTP REST API và WebSocket Events phục vụ phát triển Backend và tích hợp Client.

---

## 1. Chuẩn REST API

Tất cả các phản hồi từ API đều tuân theo định dạng JSON tiêu chuẩn:
```json
{
  "success": true,
  "data": { ... },
  "message": "Thông báo nếu có"
}
```

---

### 1.1. Xác thực & Người dùng (Authentication & User)

#### `POST /api/auth/register` — Đăng ký tài khoản
- **Request Body:**
  ```json
  {
    "username": "shiina",
    "password": "password123",
    "displayName": "Shiina",
    "role": "Team Lead"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token_here",
      "user": {
        "id": "u_1",
        "username": "shiina",
        "displayName": "Shiina",
        "role": "Team Lead"
      }
    }
  }
  ```

#### `POST /api/auth/login` — Đăng nhập
- **Request Body:**
  ```json
  {
    "username": "shiina",
    "password": "password123"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token_here",
      "user": {
        "id": "u_1",
        "username": "shiina",
        "displayName": "Shiina",
        "role": "Team Lead"
      }
    }
  }
  ```

#### `GET /api/auth/me` — Lấy thông tin user hiện tại
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** Thông tin profile của người dùng hiện tại.

#### `GET /api/users` — Lấy danh sách bạn bè / danh bạ
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      { "id": "u_2", "displayName": "Lương Thanh Hậu", "role": "Quản lý", "isOnline": true },
      { "id": "u_3", "displayName": "Nguyễn Quang Tùng", "role": "Kỹ thuật viên", "isOnline": true }
    ]
  }
  ```

---

### 1.2. Cuộc trò chuyện & Sessions (Chats & Sessions)

#### `GET /api/chats` — Lấy danh sách các session chat của user
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "chat-1",
        "title": "Dự Án Chung 🚀",
        "type": "group",
        "members": ["Shiina", "Lương Thanh Hậu", "Nguyễn Quang Tùng"],
        "membersCount": "3 thành viên",
        "lastMessage": {
          "content": "Tiến độ dự án PingPing tuần này rất tốt",
          "time": "22:41",
          "author": "Lương Thanh Hậu"
        }
      }
    ]
  }
  ```

#### `POST /api/chats` — Tạo cuộc trò chuyện / nhóm mới
- **Request Body:**
  ```json
  {
    "title": "Nhóm Triển Khai App",
    "type": "group",
    "memberIds": ["u_1", "u_2", "u_3"]
  }
  ```

#### `PATCH /api/chats/:id` — Đổi tên session / nhóm
- **Request Body:**
  ```json
  {
    "title": "Tên nhóm mới cập nhật"
  }
  ```

#### `DELETE /api/chats/:id` — Xóa cuộc trò chuyện
- **Response `200 OK`:** Xóa cuộc trò chuyện khỏi danh sách của user.

---

### 1.3. Tin nhắn & Tệp đính kèm (Messages & Uploads)

#### `GET /api/chats/:id/messages` — Lấy lịch sử tin nhắn của một phòng
- **Mô tả**: Trả về danh sách tin nhắn hiện có theo hạn mức lưu trữ xoay vòng:
  - Session thông thường: Tối đa **36 tin nhắn** gần nhất.
  - Kênh "World Class": Tối đa **180 tin nhắn** gần nhất.
- **Response `200 OK`:** Mảng các đối tượng tin nhắn, sắp xếp theo thời gian tăng dần.

#### `POST /api/upload` — Tải lên hình ảnh, video, tài liệu
- **Content-Type:** `multipart/form-data`
- **Body Form:** `file: <binary_data>`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "url": "/uploads/photo_178810755.jpg",
      "fileName": "photo_kiem_tra.jpg",
      "fileSize": "2.4 MB",
      "mimeType": "image/jpeg"
    }
  }
  ```

---

## 2. Kênh toàn cầu cố định (`chat-world-class`)

- **Chat ID**: `chat-world-class`
- **Tên hiển thị**: `World Class 🌍`
- **Loại**: `global_channel`
- **Chính sách**: Mọi người dùng khi tạo tài khoản đều tự động có mặt trong kênh này để giao lưu.
- **Hạn mức lưu**: Tự động giữ 180 tin nhắn mới nhất và xóa xoay vòng tin cũ.

---

## 3. Đặc tả WebSocket (Socket.io Events)

### 3.1. Client $\rightarrow$ Server (Emitters)

| Tên Event | Dữ liệu gửi lên | Mô tả |
| :--- | :--- | :--- |
| `join_chat` | `{ chatId }` | Gia nhập room chat để nhận tin nhắn trực tiếp |
| `send_message` | `{ chatId, content, image, video, file, voice }` | Gửi tin nhắn mới |
| `typing_start` | `{ chatId }` | Báo cho đối phương biết mình đang gõ phím |
| `typing_stop` | `{ chatId }` | Báo ngừng gõ phím |
| `member_add` | `{ chatId, memberName }` | Lệnh `@` thêm thành viên vào nhóm |
| `member_remove` | `{ chatId, memberName }` | Lệnh `@rm-` xóa thành viên khỏi nhóm |

### 3.2. Server $\rightarrow$ Client (Listeners)

| Tên Event | Dữ liệu trả về | Mô tả |
| :--- | :--- | :--- |
| `new_message` | `MessageObject` | Nhận tin nhắn mới trong phòng chat |
| `messages_pruned` | `{ chatId, prunedCount, remainingCount }` | Thông báo xóa xoay vòng tin nhắn cũ khi vượt quá ngưỡng (36/180) |
| `user_typing` | `{ chatId, userName }` | Kích hoạt hiệu ứng quay vòng Asterisk (*Sifting...*) |
| `user_stopped_typing`| `{ chatId, userName }` | Tắt hiệu ứng quay vòng |
| `member_updated` | `{ chatId, members, action, targetUser }` | Nhận thông báo cập nhật thành viên nhóm |
| `chat_renamed` | `{ chatId, newTitle }` | Cập nhật tên phòng trên sidebar và tiêu đề |
