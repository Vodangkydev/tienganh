# 🔧 Hướng dẫn cấu hình MongoDB Atlas

## Kết nối MongoDB Atlas

File `.env` đã được cấu hình với thông tin MongoDB Atlas của bạn.

### Connection String:
```
mongodb+srv://vodangkydev_db_user:EdKuofRKrLMToZLC@cluster0-tienganh.vt2qvjg.mongodb.net/tienganh?retryWrites=true&w=majority
```

### Nội dung file .env:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://vodangkydev_db_user:EdKuofRKrLMToZLC@cluster0-tienganh.vt2qvjg.mongodb.net/tienganh?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://tienganh-fe.vercel.app
```

## ⚠️ Lưu ý bảo mật

1. **Đảm bảo file `.env` đã được thêm vào `.gitignore`** để không commit password lên Git
2. **Thay đổi JWT_SECRET** trong production với một giá trị ngẫu nhiên mạnh
3. **Kiểm tra IP Whitelist** trong MongoDB Atlas để chỉ cho phép IP của server truy cập

## 🚀 Kiểm tra kết nối

Sau khi cấu hình, chạy server:

```bash
cd tienganh-be
npm install
npm start
```

Nếu kết nối thành công, bạn sẽ thấy:
```
MongoDB Connected: cluster0-tienganh-shard-00-00.vt2qvjg.mongodb.net
Server running on port 5000
```

## 🔍 Xử lý lỗi kết nối

Nếu gặp lỗi kết nối:

1. **Kiểm tra Network Access trong MongoDB Atlas:**
   - Vào MongoDB Atlas Dashboard
   - Chọn "Network Access"
   - Thêm IP `0.0.0.0/0` (cho phép tất cả) hoặc IP cụ thể của bạn

2. **Kiểm tra Database User:**
   - Đảm bảo user `vodangkydev_db_user` có quyền đọc/ghi database

3. **Kiểm tra Connection String:**
   - Đảm bảo password không có ký tự đặc biệt cần encode
   - Database name: `tienganh`

