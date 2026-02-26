# 🎓 Backend API - Hệ Thống Học Tiếng Anh

Backend API cho ứng dụng học tiếng Anh sử dụng Node.js, Express và MongoDB.

## 🚀 Cài đặt

### Yêu cầu
- Node.js (v14 trở lên)
- MongoDB (local hoặc MongoDB Atlas)

### Cài đặt dependencies

```bash
npm install
```

### Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/tienganh
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### Chạy server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server sẽ chạy tại `http://localhost:5000`

## 📊 Database

### MongoDB Collections

#### Users
- `_id`: ObjectId
- `username`: String (unique)
- `password`: String (hashed)
- `created_at`: Date

#### Vocabulary
- `_id`: ObjectId
- `user_id`: ObjectId (ref: User)
- `vietnamese`: String
- `english`: String
- `type`: String
- `pronunciation`: String
- `image_url`: String
- `difficulty`: Number (1-3)
- `created_at`: Date

#### UserProgress
- `_id`: ObjectId
- `word_id`: ObjectId (ref: Vocabulary)
- `user_id`: ObjectId (ref: User)
- `is_correct`: Boolean
- `is_nearly_correct`: Boolean
- `attempt_count`: Number
- `created_at`: Date

## 🛠️ API Endpoints

### Authentication
- `POST /api/register` - Đăng ký tài khoản
- `POST /api/login` - Đăng nhập
- `GET /api/profile` - Lấy thông tin profile (Protected)

### Vocabulary Management
- `GET /api/vocabulary` - Lấy danh sách từ vựng (Protected)
- `GET /api/vocabulary/random` - Lấy từ vựng ngẫu nhiên (Protected)
- `POST /api/vocabulary` - Thêm từ vựng mới (Protected)
- `DELETE /api/vocabulary/:id` - Xóa từ vựng theo ID (Protected)
- `DELETE /api/vocabulary` - Xóa toàn bộ từ vựng (Protected)
- `GET /api/hint/:wordId` - Lấy gợi ý cho từ (Protected)

### Learning
- `POST /api/check-answer` - Kiểm tra đáp án (Protected)

### Statistics
- `GET /api/stats` - Lấy thống kê học tập (Protected)
- `DELETE /api/stats` - Reset thống kê (Protected)

### Health Check
- `GET /api/health` - Kiểm tra trạng thái server

## 🔒 Bảo mật

- **JWT Authentication**: Tất cả API (trừ register/login) đều yêu cầu token
- **Password Hashing**: Mật khẩu được hash bằng bcrypt
- **User Isolation**: Dữ liệu của mỗi user được tách biệt hoàn toàn
- **CORS Protection**: Chỉ cho phép truy cập từ domain được cấu hình

## 📝 Ghi chú

- JWT token có thời hạn 7 ngày (có thể cấu hình trong `.env`)
- Sử dụng MongoDB để lưu trữ dữ liệu lâu dài
- Có thể sử dụng MongoDB Atlas cho production

