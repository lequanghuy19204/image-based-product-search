import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

class AuthService {
  // Hàm đăng nhập
  async login(email, password, remember = false) {
    try {
      const data = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
        remember
      }, false);
      
      if (data.access_token) {
        // Chuyển đổi _id thành id nếu cần
        const user = {
          ...data.user,
          id: data.user._id
        };
        delete user._id;

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Nếu remember = true, lưu thêm thời gian hết hạn
        if (remember) {
          const expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + 30);
          localStorage.setItem('tokenExpires', expireDate.getTime().toString());
        }
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Hàm đăng ký
  async register(userData) {
    try {
      const registerData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        company_code: userData.company_code,
        company_name: userData.company_name
      };

      const data = await apiService.post(API_ENDPOINTS.AUTH.REGISTER, registerData, false);
      
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Hàm đăng xuất
  logout() {
    // Xóa token và thông tin người dùng khỏi localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpires');
  }

  // Hàm lấy người dùng hiện tại
  getCurrentUser() {
    // Lấy chuỗi người dùng từ localStorage
    const userStr = localStorage.getItem('user');
    // Nếu có chuỗi người dùng, chuyển đổi chuỗi thành đối tượng và trả về
    return userStr ? JSON.parse(userStr) : null;
  }

  // Hàm kiểm tra xem người dùng có đang được xác thực không
  isAuthenticated() {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    // Nếu không có token, trả về false
    if (!token) return false;

    try {
      // Decode token để kiểm tra thời hạn
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Chuyển sang milliseconds
      
      // Kiểm tra xem token có còn hiệu lực không
      if (Date.now() >= exp) {
        // Token hết hạn, xóa khỏi localStorage
        this.logout();
        return false;
      }
      
      // Nếu token chưa hết hạn, trả về true
      return true;
    } catch (e) {
      console.error('Token verification error:', e);
      // Nếu có lỗi trong quá trình decode token, trả về false
      return false;
    }
  }

  // Hàm tạo mã công ty
  async generateCompanyCode() {
    try {
      // Gửi yêu cầu tạo mã công ty đến API
      const response = await apiService.get(API_ENDPOINTS.AUTH.GENERATE_COMPANY_CODE);
      // Nếu có mã công ty trả về, trả về mã công ty
      if (response.company_code) {
        return response;
      }
      // Nếu không có mã công ty trả về, ném lỗi
      throw new Error('Không nhận được mã công ty từ server');
    } catch (error) {
      // Nếu có lỗi trong quá trình tạo mã công ty, ghi lỗi vào console và ném lỗi
      console.error('Generate company code error:', error);
      throw new Error('Không thể tạo mã công ty. Vui lòng thử lại.');
    }
  }
}

export const authService = new AuthService();