const CACHE_PREFIX = 'nhanh_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 giờ tính bằng milliseconds

export const cacheService = {
  get,
  set,
  isExpired,
  clear
};

function get(key) {
  const cacheKey = CACHE_PREFIX + key;
  const item = localStorage.getItem(cacheKey);
  
  if (!item) return null;
  
  const parsedItem = JSON.parse(item);
  
  if (isExpired(parsedItem.timestamp)) {
    localStorage.removeItem(cacheKey);
    return null;
  }
  
  return parsedItem.data;
}

function set(key, data) {
  const cacheKey = CACHE_PREFIX + key;
  const cacheData = {
    data,
    timestamp: new Date().getTime()
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
}

function isExpired(timestamp) {
  const now = new Date().getTime();
  return now - timestamp > CACHE_EXPIRY;
}

function clear() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
} 