# Ứng dụng Tự động Chuyển dữ liệu Sản phẩm

## Mô tả
Script này tự động đăng nhập vào hai trang web (bangmachapel.com và frontend.ipasearchimage.id.vn), trích xuất thông tin sản phẩm từ bangmachapel và thêm vào frontend.ipasearchimage.id.vn.

## Cách sử dụng
1. Chạy script bằng lệnh: `python tool_communicate/main.py`
2. Nhập các thông số:
   - Số lượng browser muốn chạy cùng lúc
   - Cho mỗi browser:
     - Trang bắt đầu (từ trang nào ở bangmachapel)
     - Trang kết thúc (đến trang nào ở bangmachapel)
     - Số lượng sản phẩm tối đa cần xử lý

## Các file dữ liệu
- **user_config.json**: Lưu cấu hình người dùng nhập vào và thông tin về lần chạy cuối
- **progress.json**: Lưu tiến trình xử lý (mã sản phẩm cuối cùng, số lượng đã xử lý)
- **products_data.json**: Lưu dữ liệu sản phẩm tạm thời đang xử lý
- **temp_images/**: Thư mục chứa ảnh tạm thời

## Lưu ý
- Script không tự động đóng trình duyệt khi hoàn thành để bạn có thể kiểm tra kết quả
- Nhấn Ctrl+C để thoát khỏi script
- Mỗi browser sẽ xử lý một phạm vi trang khác nhau, giúp xử lý song song và nhanh hơn
