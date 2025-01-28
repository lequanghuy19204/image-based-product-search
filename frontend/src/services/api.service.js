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
}

export const apiService = new ApiService();