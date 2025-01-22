import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

class AuthService {
  async login(email, password) {
    const data = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async register(userData) {
    // Xử lý dữ liệu trước khi gửi
    const registerData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      company_code: userData.company_code,
      company_name: userData.company_name
    };

    const data = await apiService.post(API_ENDPOINTS.AUTH.REGISTER, registerData);
    
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Decode token để kiểm tra thời hạn
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Chuyển sang milliseconds
      
      if (Date.now() >= exp) {
        // Token hết hạn, xóa khỏi localStorage
        this.logout();
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async generateCompanyCode() {
    try {
      const response = await apiService.get(API_ENDPOINTS.AUTH.GENERATE_COMPANY_CODE);
      if (response.company_code) {
        return response;
      }
      throw new Error('Không nhận được mã công ty từ server');
    } catch (error) {
      console.error('Generate company code error:', error);
      throw new Error('Không thể tạo mã công ty. Vui lòng thử lại.');
    }
  }
}

export const authService = new AuthService();