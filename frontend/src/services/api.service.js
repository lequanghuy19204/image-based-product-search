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
      const { useCache = true, forceFetch = false } = options;
      
      // Nếu forceFetch thì bỏ qua cache
      if (forceFetch) {
        let url = `${this.baseURL}${endpoint}`;
        if (options.params) {
          const params = new URLSearchParams(options.params);
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });
        return this.handleResponse(response);
      }
      
      // Đặc biệt xử lý cho endpoint products
      if (endpoint === '/api/products' && useCache && !forceFetch) {
        const cacheKey = this.getProductsCacheKey(options.params);
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          try {
            const { data, metadata, timestamp } = JSON.parse(cachedData);
            const isExpired = Date.now() - timestamp > this.CACHE_DURATION;

            if (!isExpired) {
              console.log('Đọc dữ liệu từ cache:', cacheKey);
              return {
                data,
                ...metadata,
                fromCache: true
              };
            } else {
              localStorage.removeItem(cacheKey);
            }
          } catch (error) {
            console.error('Error parsing cache:', error);
            localStorage.removeItem(cacheKey);
          }
        }
      }

      // Thêm company_id vào params nếu chưa có
      if (endpoint === '/api/products' && options.params) {
        const userDetails = JSON.parse(localStorage.getItem('userDetails'));
        if (userDetails?.company_id && !options.params.company_id) {
          options.params.company_id = userDetails.company_id;
        }
      }

      // Nếu không có cache hoặc cache hết hạn, gọi API
      let url = `${this.baseURL}${endpoint}`;
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
      const data = await this.handleResponse(response);

      // Cache kết quả mới cho endpoint products
      if (endpoint === '/api/products' && useCache) {
        const cacheKey = this.getProductsCacheKey(options.params);
        const metadata = {
          total: data.total,
          total_pages: Math.ceil(data.total / data.limit),
          page: data.page,
          limit: data.limit
        };
        this.setCacheData(cacheKey, data.data, metadata);
      }

      return data;
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
        if (data.detail) {
          throw new Error(data.detail);
        } else if (Array.isArray(data)) {
          const errorMessages = data.map(err => err.msg || err.message).join(', ');
          throw new Error(errorMessages);
        } else if (typeof data === 'object') {
          throw new Error(JSON.stringify(data));
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

        // Upload ảnh trước
        const imageUrls = [];
        const imageFiles = data.getAll('images');
        if (imageFiles.length > 0) {
            for (let file of imageFiles) {
                const imageFormData = new FormData();
                imageFormData.append('file', file);
                imageFormData.append('company_id', data.get('company_id'));
                
                const uploadResponse = await fetch(`${this.baseURL}/api/products/upload`, {
                    method: 'POST',
                    headers: headers,
                    body: imageFormData
                });

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.detail || 'Lỗi khi upload ảnh');
                }

                const uploadResult = await uploadResponse.json();
                imageUrls.push(uploadResult.url);
            }
        }

        // Tạo FormData mới cho sản phẩm
        const productFormData = new FormData();
        for (let [key, value] of data.entries()) {
            if (key !== 'images') {
                productFormData.append(key, value);
            }
        }
        // Thêm image_urls vào form data
        if (imageUrls.length > 0) {
            productFormData.append('image_urls', JSON.stringify(imageUrls));
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: productFormData
        });

        const responseData = await response.json();

        if (!response.ok) {
            if (typeof responseData === 'object' && responseData.detail) {
                throw new Error(responseData.detail);
            } else if (Array.isArray(responseData)) {
                const errorMessages = responseData.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            } else {
                throw new Error('Có lỗi xảy ra khi xử lý yêu cầu');
            }
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
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      return this.handleResponse(response);
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
      // Thêm thông tin người tạo nếu chưa có
      if (!productData.created_by_name) {
        const userDetails = JSON.parse(localStorage.getItem('userDetails'));
        productData.created_by_name = userDetails.username;
      }

      const response = await this.post('/api/products', productData);
      
      // Xóa cache liên quan đến sản phẩm
      this.clearProductsCache(productData.company_id);
      
      return response;
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
      const response = await this.put(`/api/products/${productId}`, {
        product_name: productData.get('product_name'),
        product_code: productData.get('product_code'),
        brand: productData.get('brand'),
        description: productData.get('description'),
        price: parseFloat(productData.get('price')),
        image_urls: JSON.parse(productData.get('image_urls'))
      });
      
      // Clear cache sau khi cập nhật sản phẩm
      this.clearCacheByPrefix('api_cache_products');
      return response;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Thêm phương thức getProductsWithCache
  async getProductsWithCache(params) {
    const cacheKey = this.getProductsCacheKey(params);
    const cachedData = this.getCacheData(cacheKey);

    // Nếu có cache và chưa hết hạn
    if (cachedData && !this.isCacheExpired(cachedData.timestamp)) {
      return cachedData.data;
    }

    // Gọi API và lưu cache
    const data = await this.get('/api/products', { params });
    this.setCacheData(cacheKey, data);
    return data;
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
      this.clearCacheByPrefix('products_');
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
}

// Export apiService instance
export const apiService = new ApiService();