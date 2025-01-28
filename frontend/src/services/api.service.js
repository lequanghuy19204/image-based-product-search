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

  async get(endpoint, options = {}) {
    try {
      let url = `${this.baseURL}${endpoint}`;
      
      // Thêm query params nếu có
      if (options.params) {
        const params = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
          }
        });
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async post(endpoint, body, requiresAuth = true) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(requiresAuth && { Authorization: `Bearer ${localStorage.getItem('token')}` })
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        // Xử lý lỗi chi tiết hơn
        if (typeof data === 'object' && data.detail) {
          throw new Error(data.detail);
        } else if (Array.isArray(data)) {
          // Nếu là array của lỗi validation
          const errorMessages = data.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessages);
        } else {
          throw new Error('Có lỗi xảy ra khi thêm sản phẩm');
        }
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async postFormData(endpoint, data, requiresAuth = true) {
    try {
      const headers = {
        ...(requiresAuth && { Authorization: `Bearer ${localStorage.getItem('token')}` })
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: data
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Xử lý chi tiết lỗi validation
        if (Array.isArray(responseData)) {
          const errorMessages = responseData.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessages);
        } else if (responseData.detail) {
          throw new Error(responseData.detail);
        } else {
          throw new Error('Có lỗi xảy ra khi thêm sản phẩm');
        }
      }

      return responseData;
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

  async putFormData(endpoint, data) {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: headers,
        body: data
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (Array.isArray(responseData)) {
          const errorMessages = responseData.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessages);
        } else if (responseData.detail) {
          throw new Error(responseData.detail);
        } else {
          throw new Error('Có lỗi xảy ra khi cập nhật sản phẩm');
        }
      }

      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();