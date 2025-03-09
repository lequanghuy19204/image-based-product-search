import { apiService } from './api.service';

export const appConfigService = {
  getAppConfig,
  createAppConfig,
  updateAppConfig,
  deleteAppConfig
};

async function getAppConfig(companyId) {
  try {
    const config = await apiService.get(`/api/app-configs/${companyId}`);
    if (config._id && !config.id) {
      config.id = config._id;
    }
    return config;
  } catch (error) {
    console.error('Lỗi khi lấy cấu hình:', error);
    throw error;
  }
}

async function createAppConfig(configData) {
  try {
    return await apiService.post('/api/app-configs', configData);
  } catch (error) {
    console.error('Lỗi khi tạo cấu hình:', error);
    throw error;
  }
}

async function updateAppConfig(configId, configData) {
  try {
    return await apiService.put(`/api/app-configs/${configId}`, configData);
  } catch (error) {
    console.error('Lỗi khi cập nhật cấu hình:', error);
    throw error;
  }
}

async function deleteAppConfig(configId) {
  try {
    return await apiService.delete(`/api/app-configs/${configId}`);
  } catch (error) {
    console.error('Lỗi khi xóa cấu hình:', error);
    throw error;
  }
} 