# 🎓 Hệ Thống Học Tiếng Anh Thông Minh

Ứng dụng học tiếng Anh với tính năng quản lý từ vựng cá nhân theo người dùng.

## ✨ Tính năng chính

### 🔐 Hệ thống xác thực
- **Đăng ký tài khoản**: Tạo tài khoản cá nhân với tên đăng nhập và mật khẩu
- **Đăng nhập**: Xác thực người dùng với JWT token
- **Đăng xuất**: Thoát khỏi tài khoản hiện tại
- **Tài khoản demo**: admin/admin123

### 📚 Quản lý từ vựng cá nhân
- **Từ vựng riêng**: Mỗi người dùng có bộ từ vựng riêng biệt
- **Thêm từ vựng**: Nhập từ vựng mới với thông tin đầy đủ
- **Nhập hàng loạt**: Import nhiều từ vựng cùng lúc từ file text
- **Xóa từ vựng**: Xóa từng từ hoặc xóa toàn bộ
- **Sắp xếp**: Theo thứ tự mới nhất hoặc ngẫu nhiên

### 🎯 Học tập thông minh
- **Chế độ học**: Chuyển đổi giữa VN→EN và EN→VN
- **Gợi ý thông minh**: Nhận gợi ý dựa trên mức độ khó
- **Kiểm tra đáp án**: So sánh với thuật toán Levenshtein
- **Phát âm**: Nghe phát âm từ vựng
- **Tự động chuyển**: Chuyển từ tiếp theo khi trả lời đúng

### 📊 Thống kê học tập
- **Theo dõi tiến độ**: Số câu đúng, gần đúng, sai
- **Reset thống kê**: Bắt đầu lại từ đầu
- **Lưu trữ**: Dữ liệu được lưu trữ riêng cho mỗi người dùng

## 🚀 Cài đặt và chạy

### Backend (Node.js + MongoDB)

```bash
cd tienganh-be
npm install
# Tạo file .env từ .env.example và cấu hình MongoDB
npm start
```

Server sẽ chạy tại `http://localhost:5000`

### Frontend (React)

```bash
cd tienganh-fe
npm install
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## 🔧 Cấu hình

### Backend
- **JWT Secret**: Cấu hình trong file `.env` hoặc sử dụng giá trị mặc định
- **Database**: MongoDB (local hoặc MongoDB Atlas)
- **CORS**: Đã cấu hình cho localhost và Vercel

### Frontend
- **API URL**: Tự động detect hoặc cấu hình trong `.env`
- **Responsive**: Hỗ trợ mobile và desktop

## 📱 Sử dụng

### 1. Đăng nhập
- Truy cập ứng dụng
- Nhấn "Đăng nhập" hoặc "Đăng ký"
- Nhập thông tin tài khoản
- Sử dụng tài khoản demo: admin/admin123

### 2. Quản lý từ vựng
- **Thêm từ**: Nhấn nút "+" để thêm từ vựng mới
- **Nhập hàng loạt**: Sử dụng modal nhập dữ liệu
- **Xóa từ**: Nhấn nút xóa để xóa từng từ hoặc toàn bộ

### 3. Học tập
- Chọn chế độ học (VN→EN hoặc EN→VN)
- Nhập đáp án và nhấn Enter hoặc "Kiểm tra"
- Sử dụng gợi ý khi gặp khó khăn
- Theo dõi tiến độ trong phần cài đặt

## 🛠️ API Endpoints

### Authentication
- `POST /api/register` - Đăng ký tài khoản
- `POST /api/login` - Đăng nhập
- `GET /api/profile` - Lấy thông tin profile

### Vocabulary Management
- `GET /api/vocabulary` - Lấy danh sách từ vựng của user
- `POST /api/vocabulary` - Thêm từ vựng mới
- `DELETE /api/vocabulary/:id` - Xóa từ vựng theo ID
- `DELETE /api/vocabulary` - Xóa toàn bộ từ vựng

### Learning
- `GET /api/vocabulary/random` - Lấy từ vựng ngẫu nhiên
- `POST /api/check-answer` - Kiểm tra đáp án
- `GET /api/hint/:wordId` - Lấy gợi ý cho từ

### Statistics
- `GET /api/stats` - Lấy thống kê học tập
- `DELETE /api/stats` - Reset thống kê

## 🔒 Bảo mật

- **JWT Authentication**: Tất cả API đều yêu cầu xác thực
- **Password Hashing**: Mật khẩu được hash bằng bcrypt
- **User Isolation**: Dữ liệu của mỗi user được tách biệt hoàn toàn
- **CORS Protection**: Chỉ cho phép truy cập từ domain được cấu hình

## 📊 Cơ sở dữ liệu

### MongoDB Collections

#### Users
- `_id`: ObjectId (Primary key)
- `username`: Tên đăng nhập (unique)
- `password`: Mật khẩu đã hash
- `created_at`: Thời gian tạo

#### Vocabulary
- `_id`: ObjectId (Primary key)
- `user_id`: ObjectId (Reference đến Users)
- `vietnamese`: Từ tiếng Việt
- `english`: Từ tiếng Anh
- `type`: Loại từ (noun, verb, adjective, etc.)
- `pronunciation`: Phiên âm
- `image_url`: URL hình ảnh
- `difficulty`: Mức độ khó (1-3)
- `created_at`: Thời gian tạo

#### UserProgress
- `_id`: ObjectId (Primary key)
- `word_id`: ObjectId (Reference đến Vocabulary)
- `user_id`: ObjectId (Reference đến Users)
- `is_correct`: Đáp án đúng
- `is_nearly_correct`: Đáp án gần đúng
- `attempt_count`: Số lần thử
- `created_at`: Thời gian tạo

## 🎨 Giao diện

- **Responsive Design**: Tối ưu cho mobile và desktop
- **Modern UI**: Sử dụng gradient và shadow effects
- **Intuitive UX**: Giao diện trực quan, dễ sử dụng
- **Loading States**: Hiển thị trạng thái loading
- **Error Handling**: Xử lý lỗi một cách thân thiện

## 🔄 Tính năng nâng cao

- **Auto Advance**: Tự động chuyển từ tiếp theo
- **Sound Support**: Phát âm từ vựng
- **Favorites**: Đánh dấu từ yêu thích
- **Filter**: Lọc từ theo yêu thích
- **Sort**: Sắp xếp theo mới nhất hoặc ngẫu nhiên
- **Bulk Import**: Nhập nhiều từ cùng lúc với nhiều định dạng

## 📝 Ghi chú

- Ứng dụng sử dụng MongoDB để lưu trữ dữ liệu lâu dài
- Có thể sử dụng MongoDB local hoặc MongoDB Atlas cho production
- JWT token có thời hạn 7 ngày (có thể cấu hình trong `.env`)
- Tất cả API đều yêu cầu xác thực trừ register/login

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.