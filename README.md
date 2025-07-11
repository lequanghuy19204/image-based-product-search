# Smart Image Search System 🔍

Hệ thống tìm kiếm sản phẩm thông minh sử dụng Computer Vision để nhận diện và so sánh sản phẩm dựa trên đặc trưng hình ảnh. Xây dựng với FastAPI, React và MongoDB.

## Tính năng chính

### 🖼️ Tìm kiếm hình ảnh
- **Tìm kiếm sản phẩm bằng ảnh**: Upload ảnh để tìm sản phẩm tương tự
- **ORB Feature Detection**: Trích xuất đặc trưng không đổi theo xoay và tỷ lệ
- **FAISS Binary Search**: Tìm kiếm nhanh với dimension 8192-bit
- **Hamming Distance**: So sánh binary descriptor với độ tương tự 0-100%

### 👥 Quản lý người dùng
- **Xác thực JWT**: Đăng nhập bảo mật với tính năng ghi nhớ
- **Phân quyền theo vai trò**: Admin và User với quyền hạn khác nhau
- **Hỗ trợ đa công ty**: Phân tách theo công ty với mã công ty riêng
- **Quản lý profile**: Cập nhật thông tin và đổi mật khẩu

### 📦 Quản lý sản phẩm
- **CRUD Operations**: Quản lý toàn bộ vòng đời sản phẩm
- **Hỗ trợ đa ảnh**: Nhiều ảnh cho mỗi sản phẩm
- **Tìm kiếm nâng cao**: Lọc theo tên, mã, giá và người tạo
- **Lưu trữ metadata**: Màu sắc, kích cỡ, thương hiệu, mô tả

### 🛒 Quản lý đơn hàng
- **Tích hợp Nhanh.vn**: Tạo đơn hàng trực tiếp qua API
- **Xử lý chat AI**: Trích xuất thông tin đơn hàng từ hội thoại chat bằng n8n
- **Quản lý địa chỉ**: Hỗ trợ tỉnh/thành, quận/huyện, phường/xã
- **Tính phí vận chuyển**: Tích hợp calculator phí ship

### ⚙️ Cấu hình hệ thống
- **Cài đặt API**: Cấu hình token và tham số
- **Template sản phẩm**: Quản lý template (tên, màu, size)
- **Cài đặt công ty**: Tùy chỉnh theo từng công ty

## Tech Stack

### Backend
- **FastAPI** 0.104.1 - REST API framework
- **MongoDB** - NoSQL database with Motor async driver
- **OpenCV** 4.8.1.78 - Computer vision and image processing
- **FAISS** 1.9.0 - Vector similarity search
- **JWT** - Authentication and authorization
- **Cloudinary** - Cloud image storage
- **n8n** - Workflow automation for AI chat processing

### Frontend
- **React** 18.3.1 - UI framework
- **Vite** 6.0.1 - Build tool and dev server
- **Material-UI** 6.3.0 - Component library
- **React Router** 7.1.1 - SPA routing
- **Axios** 1.7.9 - HTTP client

## Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Python 3.11+
- Node.js 22+
- MongoDB 4.4+

### Cài đặt Backend

1. **Cài đặt dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Cấu hình environment variables:**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   MONGODB_DB=images-search
   JWT_SECRET_KEY=your-secret-key
   ALLOWED_ORIGINS=http://localhost:5173
   ```

3. **Chạy server:**
   ```bash
   # Development
   python run.py
   
   # Production
   ./run-backend-prod.sh
   ```

### Cài đặt Frontend

1. **Cài đặt dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Cấu hình environment variables:**
   ```bash
   VITE_API_URL=http://localhost:8000
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   ```

3. **Chạy ứng dụng:**
   ```bash
   # Development
   npm run dev
   
   # Production
   ./run-frontend-prod.sh
   ```
## 📱 Truy cập hệ thống

### 👤 **Tài khoản mặc định**
```
Admin Account:
- Tạo tài khoản Admin đầu tiên qua UI
- System sẽ generate company code tự động

User Account:
- Đăng ký với company code từ Admin
- Role: User với quyền hạn chế
```

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (React.js)    │◄──►│    (FastAPI)     │◄──►│   (MongoDB)     │
│   Port: 5173    │    │   Port: 8000     │    │   Cloud Atlas   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │             ┌──────────────────┐              │
         │             │       n8n        │              │
         │             │  (AI Workflow)   │              │
         │             │  Chat→Order      │              │
         │             └──────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloudinary    │    │   FAISS Index    │    │   Collections   │
│ (Image Storage) │    │ (Search Engine)  │    │ • users         │
│                 │    │                  │    │ • products      │
└─────────────────┘    └──────────────────┘    │ • images        │
                                ▲              │ • companies     │
                                │              │ • app_configs   │
                       ┌─────────────────┐     └─────────────────┘
                       │    Nhanh.vn     │
                       │   (E-commerce   │
                       │    Platform)    │
                       └─────────────────┘
```

## API Endpoints

| Endpoint | Mục đích |
|----------|---------|
| `/api/auth/*` | Xác thực (đăng nhập, đăng ký) |
| `/api/images/search` | Tìm kiếm ảnh với ORB + FAISS |
| `/api/products/*` | CRUD operations sản phẩm |
| `/api/users/*` | Quản lý người dùng |
| `/api/admin/*` | Chức năng admin |
| `/api/nhanh/*` | Tích hợp Nhanh.vn |

## Cách hoạt động của Image Search

1. **Feature Extraction**: ORB detector trích xuất 32 keypoints + binary descriptors
2. **Storage**: 32x32 binary descriptors được lưu thành 1024 bytes trong MongoDB
3. **Indexing**: FAISS IndexBinaryFlat với 8192-bit dimensions
4. **Search**: Hamming distance matching với similarity scoring (0-100%)

