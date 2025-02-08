# ImageSearch Pro 🚀

**ImageSearch Pro** là một hệ thống tìm kiếm sản phẩm bằng hình ảnh thông minh, sử dụng công nghệ AI để nhận diện và so sánh các sản phẩm dựa trên hình ảnh đầu vào. Hệ thống giúp người dùng dễ dàng tìm kiếm thông tin sản phẩm chỉ bằng cách tải lên một bức ảnh.

## Tính năng chính ✨

- **Tìm kiếm sản phẩm bằng hình ảnh**: Tải lên hình ảnh và nhận kết quả sản phẩm tương tự.
- **Quản lý sản phẩm**: Thêm, sửa, xóa sản phẩm với thông tin chi tiết và hình ảnh.
- **Quản lý người dùng**: Phân quyền Admin và User, quản lý thông tin người dùng.
- **Bảo mật**: Xác thực người dùng bằng JWT, phân quyền truy cập.
- **Tích hợp AI**: Sử dụng model EfficientNetB0 để trích xuất đặc trưng hình ảnh.

## Công nghệ sử dụng 🛠️

### Backend

- **Python** với **FastAPI** framework
- **MongoDB** làm cơ sở dữ liệu
- **TensorFlow** và **EfficientNetB0** cho xử lý hình ảnh
- **Motor** cho kết nối MongoDB bất đồng bộ
- **JWT** cho xác thực người dùng

### Frontend

- **React.js** với **Vite** build tool
- **React Router** cho routing
- **Bootstrap** và **Material-UI** cho giao diện
- **Axios** cho gọi API
- **React Images Uploading** cho upload hình ảnh

## Cài đặt và chạy 🚀

### Backend

1. Cài đặt các dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Tạo file `.env` và cấu hình biến môi trường:

   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

3. Chạy server:

   ```bash
   python run.py
   ```

### Frontend

1. Cài đặt các dependencies:

   ```bash
   npm install
   ```

2. Tạo file `.env` và cấu hình biến môi trường:

   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. Chạy ứng dụng:

   ```bash
   npm run dev
   ```
