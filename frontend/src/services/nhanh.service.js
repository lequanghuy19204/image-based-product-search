import { apiService } from './api.service';
import { appConfigService } from './app-config.service';
import { cacheService } from './cache.service';

// Định nghĩa các hàm (không export trực tiếp)
async function getOrderSources() {
  try {
    // Kiểm tra cache trước
    const cachedSources = cacheService.get('order_sources');
    if (cachedSources) {
      return cachedSources;
    }

    // Nếu không có cache, gọi API
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails?.company_id) {
      throw new Error('Không tìm thấy thông tin công ty');
    }
    
    const config = await appConfigService.getAppConfig(userDetails.company_id);
    if (!config) {
      throw new Error('Không tìm thấy cấu hình Nhanh.vn');
    }
    
    const response = await apiService.post('/api/nhanh/order-sources', {
      version: config.version || '',
      appId: config.appId || '',
      businessId: config.businessId || '',
      accessToken: config.accessToken || ''
    });
    
    if (!response || !response.data || !response.data.sources) {
      throw new Error('Không nhận được dữ liệu nguồn đơn hàng');
    }
    
    // Lưu vào cache
    cacheService.set('order_sources', response.data.sources);
    return response.data.sources;
  } catch (error) {
    console.error('Lỗi khi lấy nguồn đơn hàng:', error);
    throw error;
  }
}

async function createOrderFromConversation(conversationLink, sourceNames = []) {
  try {
    if (!conversationLink) {
      throw new Error('Vui lòng nhập Link hội thoại');
    }

    // Lấy thông tin công ty từ localStorage
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails?.company_id) {
      throw new Error('Không tìm thấy thông tin công ty');
    }

    // Lấy access_token từ app config
    const config = await appConfigService.getAppConfig(userDetails.company_id);
    if (!config || !config.access_token) {
      throw new Error('Không tìm thấy access token trong cấu hình');
    }

    // Lấy webhook URL từ biến môi trường
    const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
    const webhookData = [{
      conversation_link: conversationLink,
      access_token: config.access_token,
      source_names: sourceNames // Thêm danh sách tên nguồn đơn hàng
    }];

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Lỗi từ webhook: ${errorData}`);
    }

    const data = await response.json();
    console.log('Response from create order from conversation:', data);
    return data;

  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng từ hội thoại:', error);
    throw error.message || 'Có lỗi xảy ra khi gọi webhook';
  }
}

async function getLocations(type, parentId = null) {
  try {
    // Tạo cache key dựa trên type và parentId
    const cacheKey = `locations_${type}_${parentId || 'null'}`;
    
    // Kiểm tra cache trước
    const cachedLocations = cacheService.get(cacheKey);
    if (cachedLocations) {
      return cachedLocations;
    }

    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails?.company_id) {
      throw new Error('Không tìm thấy thông tin công ty');
    }
    
    const config = await appConfigService.getAppConfig(userDetails.company_id);
    if (!config) {
      throw new Error('Không tìm thấy cấu hình Nhanh.vn');
    }

    const response = await apiService.post('/api/nhanh/locations', {
      version: config.version || '',
      appId: config.appId || '',
      businessId: config.businessId || '',
      accessToken: config.accessToken || '',
      type,
      parentId
    });

    // Lưu vào cache
    cacheService.set(cacheKey, response.data);
    return response.data;

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu địa chỉ:', error);
    throw error;
  }
}

async function searchProducts(searchTerm) {
  try {
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails?.company_id) {
      throw new Error('Không tìm thấy thông tin công ty');
    }
    
    const config = await appConfigService.getAppConfig(userDetails.company_id);
    if (!config) {
      throw new Error('Không tìm thấy cấu hình Nhanh.vn');
    }

    const response = await apiService.post('/api/nhanh/products/search', {
      version: config.version || '',
      appId: config.appId || '',
      businessId: config.businessId || '',
      accessToken: config.accessToken || '',
      name: searchTerm
    });

    console.log('Response from search products:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi chi tiết khi tìm kiếm sản phẩm:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw error;
  }
}

async function getUsers() {
  try {
    // Kiểm tra cache trước
    const cachedUsers = cacheService.get('users_list');
    if (cachedUsers) {
      return cachedUsers;
    }

    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails?.company_id) {
      throw new Error('Không tìm thấy thông tin công ty');
    }
    
    const config = await appConfigService.getAppConfig(userDetails.company_id);
    if (!config) {
      throw new Error('Không tìm thấy cấu hình Nhanh.vn');
    }

    const response = await apiService.post('/api/nhanh/users', {
      version: config.version || '',
      appId: config.appId || '',
      businessId: config.businessId || '',
      accessToken: config.accessToken || '',
      itemsPerPage: 50
    });

    if (response?.data?.users) {
      // Lưu vào cache
      cacheService.set('users_list', response.data);
      return response.data;
    } else {
      throw new Error('Không nhận được dữ liệu nhân viên');
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân viên:', error);
    throw error;
  }
}

async function createOrder(orderData) {
  try {
    
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails?.company_id) {
      throw new Error('Không tìm thấy thông tin công ty');
    }
    
    const config = await appConfigService.getAppConfig(userDetails.company_id);
    
    if (!config) {
      throw new Error('Không tìm thấy cấu hình Nhanh.vn');
    }

    // Tạo danh sách sản phẩm theo format yêu cầu
    const productList = orderData.products.map(product => ({
      id: Math.floor(10000000 + Math.random() * 90000000).toString(),
      idNhanh: product.idNhanh,
      quantity: product.quantity,
      name: product.name,
      price: product.price
    }));

    // Xác định carrierId dựa vào phương thức vận chuyển
    const carrierId = orderData.selfShipping ? 12 : 8; // 12 cho tự vận chuyển, 8 cho GHTK

    const requestData = {
      version: config.version || '',
      appId: config.appId || '',
      businessId: config.businessId || '',
      accessToken: config.accessToken || '',
      data: {
        id: Math.floor(10000000 + Math.random() * 90000000).toString(),
        depotId: config.depotId,
        customerName: orderData.customerName,
        customerMobile: orderData.customerMobile,
        customerAddress: orderData.customerAddress,
        customerCityName: orderData.cityName,
        customerDistrictName: orderData.districtName,
        customerWardLocationName: orderData.wardName,
        status: "New",
        trafficSource: orderData.trafficSource,
        moneyTransfer: orderData.moneyTransfer,
        moneyDiscount: orderData.moneyDiscount,
        allowTest: 1,
        saleId: orderData.saleId,
        carrierId: carrierId,
        customerShipFee: orderData.shippingFee,
        description: orderData.description,
        productList: productList,
        sendCarrierType: 2,
        carrierAccountId: 7074,
        carrierServiceCode: "road"
      }
    };

    const response = await apiService.post('/api/nhanh/orders/add', requestData);

    return response.data;
  } catch (error) {
    console.error('Lỗi chi tiết khi tạo đơn hàng:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw error;
  }
}

// Export tất cả các hàm một lần ở cuối file
export {
  getOrderSources,
  createOrderFromConversation,
  getLocations,
  searchProducts,
  getUsers,
  createOrder
};

// Giữ lại nhanhService cho khả năng tương thích ngược
export const nhanhService = {
  getOrderSources,
  createOrderFromConversation,
  getLocations,
  searchProducts,
  getUsers,
  createOrder
}; 