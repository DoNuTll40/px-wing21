const STORAGE_KEY = 'px_daily_report_cache';

export const saveCache = (productsData) => {
  try {
    const cacheData = {
      timestamp: new Date().toISOString(),
      products: productsData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Error saving cache to localStorage:', e);
  }
};

export const getCache = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error reading cache from localStorage:', e);
    return null;
  }
};

export const clearCache = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing cache:', e);
  }
};
