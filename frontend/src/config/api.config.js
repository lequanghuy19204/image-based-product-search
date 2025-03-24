export const API_BASE_URL = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    CHECK_EMAIL: '/api/auth/check-email',
    LOGOUT: '/auth/logout',
    GENERATE_COMPANY_CODE: '/api/auth/generate-company-code'
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
  NHANH: {
    ORDER_SOURCES: '/api/nhanh/order-sources'
  }
};