# Hướng dẫn Deploy ứng dụng lên Vercel

## 🚀 Các bước deploy lên Vercel

### 1. Chuẩn bị trước khi deploy

Đảm bảo bạn đã có:
- Tài khoản GitHub
- Tài khoản Vercel (đăng ký tại [vercel.com](https://vercel.com))
- Code đã được push lên GitHub repository

### 2. Cài đặt Vercel CLI (Tùy chọn)

```bash
npm install -g vercel
```

### 3. Deploy qua Vercel Dashboard (Khuyến nghị)

#### Bước 1: Đăng nhập Vercel
1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập bằng tài khoản GitHub

#### Bước 2: Import Project
1. Click "New Project"
2. Chọn repository GitHub của bạn
3. Vercel sẽ tự động detect cấu hình từ `vercel.json`

#### Bước 3: Cấu hình Environment Variables (Nếu cần)
1. Trong project settings, vào tab "Environment Variables"
2. Thêm các biến môi trường cần thiết:
   ```
   NODE_ENV=production
   ```

#### Bước 4: Deploy
1. Click "Deploy"
2. Vercel sẽ tự động build và deploy ứng dụng

### 4. Deploy qua Vercel CLI

```bash
# Đăng nhập Vercel
vercel login

# Deploy lần đầu
vercel

# Deploy production
vercel --prod
```

### 5. Cấu trúc Project trên Vercel

Dự án được cấu hình với:
- **Frontend**: React app được build thành static files
- **Backend**: Node.js API server chạy trên Vercel Functions
- **Database**: SQLite (lưu trữ tạm thời, sẽ mất khi restart)

### 6. URLs sau khi deploy

- **Production URL**: `https://your-project-name.vercel.app`
- **API Endpoints**: `https://your-project-name.vercel.app/api/*`

### 7. Cấu hình đã được tối ưu

#### vercel.json
- Frontend build với `@vercel/static-build`
- Backend chạy với `@vercel/node`
- Routes được cấu hình để API calls đi đến backend
- Static files được serve từ frontend build

#### .vercelignore
- Loại trừ node_modules, build files, và các file không cần thiết
- Giảm kích thước deployment

### 8. Lưu ý quan trọng

⚠️ **Database SQLite**: 
- SQLite file sẽ bị mất khi Vercel Function restart
- Để production, nên sử dụng database cloud như:
  - Vercel Postgres
  - PlanetScale
  - Supabase
  - MongoDB Atlas

### 9. Troubleshooting

#### Lỗi Build
- Kiểm tra `package.json` có đúng dependencies
- Đảm bảo Node.js version >= 16.0.0

#### Lỗi API
- Kiểm tra routes trong `vercel.json`
- Đảm bảo backend export đúng cách

#### Lỗi Database
- SQLite chỉ hoạt động trong development
- Cần migrate sang cloud database cho production

### 10. Cập nhật ứng dụng

Mỗi khi push code lên GitHub:
1. Vercel sẽ tự động detect changes
2. Tự động build và deploy
3. Gửi notification qua email

### 11. Custom Domain (Tùy chọn)

1. Vào Project Settings
2. Tab "Domains"
3. Thêm custom domain
4. Cấu hình DNS records

## 🎉 Hoàn thành!

Sau khi deploy thành công, ứng dụng học tiếng Anh của bạn sẽ có thể truy cập từ bất kỳ đâu trên internet!
