import { apiService } from './api.service';
import { appConfigService } from './app-config.service';
import { API_ENDPOINTS } from '../config/api.config';

export const nhanhService = {
  getOrderSources,
  createOrderFromConversation
};

async function getOrderSources() {
  try {
    // Lấy thông tin cấu hình từ database
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (!userDetails?.company_id) {
      throw new Error('Không tìm thấy thông tin công ty');
    }
    
    const config = await appConfigService.getAppConfig(userDetails.company_id);
    
    if (!config) {
      throw new Error('Không tìm thấy cấu hình Nhanh.vn');
    }
    
    // Chuẩn bị FormData để gửi đến Nhanh.vn
    const formData = new FormData();
    formData.append('version', config.version || '');
    formData.append('appId', config.appId || '');
    formData.append('businessId', config.businessId || '');
    formData.append('accessToken', config.accessToken || '');
    
    // Gọi API Nhanh.vn
    const response = await fetch('https://open.nhanh.vn/api/order/source', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (data.code !== 1) {
      throw new Error(data.messages || 'Lỗi khi lấy nguồn đơn hàng');
    }
    
    return data.data;
  } catch (error) {
    console.error('Lỗi khi lấy nguồn đơn hàng:', error);
    throw error;
  }
}

async function createOrderFromConversation(conversationLink) {
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
      access_token: config.access_token
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
    return data;

  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng từ hội thoại:', error);
    throw error.message || 'Có lỗi xảy ra khi gọi webhook';
  }
} 