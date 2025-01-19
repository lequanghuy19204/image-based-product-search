export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/auth/logout',
    GENERATE_COMPANY_CODE: '/api/auth/generate-company-code'  // Endpoint này bị thiếu
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
  },
  PRODUCTS: {
    LIST: '/api/products',
    CREATE: '/api/products/create',
    UPDATE: '/api/products/:id',
    DELETE: '/api/products/:id',
  },
  IMAGES: {
    UPLOAD: '/api/images/upload',
    LIST: '/api/images',
    DELETE: '/api/images/:id',
  },
};