import { API_BASE_URL } from '../config/api.config';
import { authService } from './auth.service';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 phút
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async handleResponse(response) {
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      
      // Xử lý lỗi 422 Unprocessable Entity
      if (response.status === 422 && data?.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => `${err.loc[1]}: ${err.msg}`).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.detail);
      }
      
      // Xử lý các lỗi cụ thể
      if (response.status === 403) {
        throw new Error('Bạn không có quyền thực hiện hành động này');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy dữ liệu');
      }
      
      // Xử lý các lỗi khác
      if (data?.detail) {
        throw new Error(data.detail);
      }
      throw new Error('Có lỗi xảy ra');
    }

    return data;
  }

  // Thêm hàm chuyển đổi response từ MongoDB
  transformMongoResponse(item) {
    if (!item) return item;

    const transformed = { ...item };
    
    // Chuyển đổi _id hoặc id thành string
    if (transformed._id) {
      transformed.id = typeof transformed._id === 'string' ? transformed._id : transformed._id.toString();
      delete transformed._id;
    } else if (transformed.id && typeof transformed.id !== 'string') {
      transformed.id = transformed.id.toString();
    }

    // Chuyển đổi company_id thành string nếu tồn tại và không phải string
    if (transformed.company_id && typeof transformed.company_id !== 'string') {
      transformed.company_id = transformed.company_id.toString();
    }

    // Chuyển đổi created_by thành string nếu tồn tại và không phải string
    if (transformed.created_by && typeof transformed.created_by !== 'string') {
      transformed.created_by = transformed.created_by.toString();
    }

    // Chuyển đổi ngày tháng
    if (transformed.created_at) {
      transformed.created_at = new Date(transformed.created_at).toLocaleString('vi-VN');
    }
    if (transformed.updated_at) {
      transformed.updated_at = new Date(transformed.updated_at).toLocaleString('vi-VN');
    }

    return transformed;
  }

  // Thêm các phương thức quản lý cache
  getCacheKey(endpoint, params) {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return `api_cache_${endpoint}_${queryString}`;
  }

  setCacheData(key, data, metadata = null) {
    const cacheData = {
      data,
      metadata,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cache:', error);
      // Xóa bớt cache cũ nếu localStorage đầy
      this.clearOldCache();
    }
  }

  getCacheData(key) {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;

    try {
      const { data, timestamp } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > this.CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      // Thêm thông tin về thời gian cache còn lại
      const remainingTime = this.CACHE_DURATION - (Date.now() - timestamp);
      console.log(`Cache còn hiệu lực trong ${Math.round(remainingTime/1000)} giây`);
      
      return data;
    } catch (error) {
      console.error('Error getting cache:', error);
      localStorage.removeItem(key);
      return null;
    }
  }

  clearCacheByPrefix(prefix) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Thêm phương thức để lấy cache key cho từng trang
  getProductsCacheKey(params) {
    const { page = 1, limit = 10, search = '', company_id = '' } = params || {};
    return `products_${company_id}_page${page}_limit${limit}_search${search}`;
  }

  // Thêm phương thức để lưu metadata của danh sách sản phẩm
  setProductsMetadata(params, metadata) {
    const key = `products_metadata_${params.company_id}`;
    const data = {
      total: metadata.total,
      total_pages: metadata.total_pages,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Thêm phương thức để lấy metadata
  getProductsMetadata(company_id) {
    const key = `products_metadata_${company_id}`;
    const data = localStorage.getItem(key);
    if (!data) return null;

    try {
      const metadata = JSON.parse(data);
      if (Date.now() - metadata.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      return metadata;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  // Thêm phương thức để xóa cache cũ
  clearOldCache() {
    const keys = Object.keys(localStorage);
    const productCacheKeys = keys.filter(key => key.startsWith('products_'));
    
    // Sắp xếp theo thời gian và xóa 50% cache cũ nhất
    const cacheItems = productCacheKeys.map(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        return { key, timestamp: item.timestamp };
      } catch {
        return { key, timestamp: 0 };
      }
    }).sort((a, b) => a.timestamp - b.timestamp);

    const itemsToRemove = Math.floor(cacheItems.length / 2);
    cacheItems.slice(0, itemsToRemove).forEach(item => {
      localStorage.removeItem(item.key);
    });
  }

  // Thêm phương thức để lấy cache hiệu quả hơn
  async get(endpoint, options = {}) {
    try {
        // Đảm bảo endpoint luôn kết thúc bằng /
        let normalizedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
        
        // Tạo URL với params
        let url = `${this.baseURL}${normalizedEndpoint}`;
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
            credentials: 'include',
            mode: 'cors'
        });

        const data = await this.handleResponse(response);
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
  }

  async post(endpoint, data, requiresAuth = true) {
    try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(requiresAuth ? this.getHeaders() : {})
            },
            body: JSON.stringify(data),
            credentials: 'include',
            mode: 'cors'
        });

        const responseData = await this.handleResponse(response);
        return responseData;
    } catch (error) {
        console.error('API request failed:', error);
        if (error.message === 'Failed to fetch') {
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
        }
        throw error;
    }
  }

  // Sửa lại phương thức clearProductsCache
  clearProductsCache(company_id) {
    try {
      // Xóa tất cả cache liên quan đến sản phẩm của company
      const keys = Object.keys(localStorage);
      const productCacheKeys = keys.filter(key => 
        key.startsWith('products_') && key.includes(company_id)
      );
      
      productCacheKeys.forEach(key => localStorage.removeItem(key));
      
      // Xóa metadata cache
      localStorage.removeItem(`products_metadata_${company_id}`);
      
      console.log('Đã xóa cache sản phẩm của company:', company_id);
    } catch (error) {
      console.error('Error clearing product cache:', error);
    }
  }

  // Cập nhật các phương thức mutation để xóa cache
  async postFormData(endpoint, data, requiresAuth = true) {
    try {
      const headers = {
        ...(requiresAuth && { Authorization: `Bearer ${localStorage.getItem('token')}` })
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: data,
        credentials: 'include'
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          authService.logout();
          window.location.href = '/login';
          throw new Error('Phiên đăng nhập đã hết hạn');
        }
        
        if (response.status === 403) {
          throw new Error('Bạn không có quyền thực hiện hành động này');
        }

        throw new Error(responseData.detail || 'Có lỗi xảy ra');
      }

      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateUserStatus(userId, status) {
    try {
      const response = await this.put(`/api/admin/users/${userId}/status`, { status });
      return response;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
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

  // Thêm phương thức kiểm tra quyền
  isAdmin() {
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    return userDetails?.role === 'Admin';
  }

  async createProduct(productData) {
    if (!this.isAdmin()) {
      throw new Error('Bạn không có quyền thêm sản phẩm mới');
    }
    try {
      // Đảm bảo company_id là string
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (!userDetails?.company_id) {
        throw new Error('Không tìm thấy thông tin công ty');
      }

      const formattedData = {
        product_name: productData.product_name,
        product_code: productData.product_code,
        brand: productData.brand || "",
        description: productData.description || "",
        price: parseFloat(productData.price),
        company_id: userDetails.company_id.toString(),
        image_urls: Array.isArray(productData.image_urls) ? productData.image_urls : []
      };

      const response = await this.post('/api/products', formattedData);
      
      // Xóa cache bất đồng bộ
      setTimeout(() => {
        this.clearProductsCache(userDetails.company_id);
      }, 0);
      
      return this.transformMongoResponse(response);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId, productData) {
    if (!this.isAdmin()) {
      throw new Error('Bạn không có quyền cập nhật sản phẩm');
    }
    try {
      // Chuẩn bị dữ liệu theo đúng format
      const updateData = {
        product_name: productData.product_name,
        product_code: productData.product_code,
        brand: productData.brand || "",
        description: productData.description || "",
        price: parseFloat(productData.price),
        image_urls: Array.isArray(productData.image_urls) ? productData.image_urls : []
      };

      const response = await this.put(`/api/products/${productId}`, updateData);
      
      // Clear cache sau khi cập nhật sản phẩm
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (userDetails?.company_id) {
        this.clearProductsCache(userDetails.company_id);
      }
      
      return this.transformMongoResponse(response);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Thêm phương thức getProductsWithCache
  async getProductsWithCache(params) {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (!userDetails?.company_id) {
        throw new Error('Không tìm thấy thông tin công ty');
      }

      const response = await this.get('/api/products', { 
        params: {
          ...params,
          search_field: params.search_field || 'all'
        }
      });

      if (!response?.data) {
        throw new Error('Không có dữ liệu trả về');
      }

      return {
        ...response,
        data: response.data.map(item => this.transformMongoResponse(item))
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Thêm phương thức isCacheExpired
  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.CACHE_DURATION;
  }

  // Thêm phương thức xóa sản phẩm
  async deleteProduct(productId) {
    if (!this.isAdmin()) {
      throw new Error('Bạn không có quyền xóa sản phẩm');
    }
    try {
      const response = await this.delete(`/api/products/${productId}`);
      
      // Xóa cache sau khi xóa thành công
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (userDetails?.company_id) {
        this.clearProductsCache(userDetails.company_id);
        
        // Xóa cache của images collection nếu có
        this.clearCacheByPrefix(`images_${productId}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async searchProducts(params) {
    try {
      const response = await this.get('/api/products', { params });
      return response;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('userDetails'));
        if (!currentUser) {
            throw new Error('Vui lòng đăng nhập lại');
        }

        if (currentUser.role !== 'Admin') {
            throw new Error('Bạn không có quyền truy cập');
        }

        const response = await this.get('/api/admin/users', {
            credentials: 'include',
            mode: 'cors'
        });

        if (!response) {
            throw new Error('Không thể tải danh sách người dùng');
        }

        // Chuyển đổi định dạng ngày tháng và đảm bảo id là string
        return response.map(user => ({
            ...user,
            id: user.id.toString(), // Đảm bảo id là string
            company_id: user.company_id ? user.company_id.toString() : null, // Đảm bảo company_id là string hoặc null
            created_at: new Date(user.created_at).toLocaleString('vi-VN'),
            updated_at: new Date(user.updated_at).toLocaleString('vi-VN')
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
  }

  transformResponse(data) {
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        created_at: new Date(item.created_at).toLocaleString('vi-VN'),
        updated_at: new Date(item.updated_at).toLocaleString('vi-VN')
      }));
    }
    return data;
  }

  async updateUserRole(userId, role) {
    try {
      const response = await this.put(`/api/admin/users/${userId}/role`, { role });
      return response;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async getProductDetails(productId) {
    try {
      const response = await this.get(`/api/products/${productId}`);
      // Chuyển đổi định dạng ngày tháng
      return {
        ...response,
        created_at: new Date(response.created_at).toLocaleString('vi-VN'),
        updated_at: new Date(response.updated_at).toLocaleString('vi-VN')
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
  }
}

// Export apiService instance
export const apiService = new ApiService();