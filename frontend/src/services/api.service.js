import { API_BASE_URL } from '../config/api.config';
import { authService } from './auth.service';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async handleResponse(response) {
    if (response.status === 401) {
      // Token không hợp lệ hoặc hết hạn
      authService.logout();
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    
    if (!response.ok) {
        return response.json().then(err => {
            throw err;
        });
    }
    return response.json();
  }

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async post(endpoint, data, requiresAuth = true) {
    try {
      const headers = {};

      // Chỉ kiểm tra token nếu endpoint yêu cầu xác thực
      if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Chưa đăng nhập');
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Nếu data không phải là FormData, thêm Content-Type
      if (!(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        data = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Có lỗi xảy ra');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async put(endpoint, body) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateUserStatus(userId, status) {
    return await this.put(`/api/admin/users/${userId}/status?status=${status}`);
  }
}

export const apiService = new ApiService();