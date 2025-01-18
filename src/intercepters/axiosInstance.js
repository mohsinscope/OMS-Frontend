import axios from 'axios';
import BASE_URL from '../store/url';
import useAuthStore from './../store/store';

// Create axios instances with shared config
const createAxiosInstance = () => axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Reduced timeout for faster failure detection
});

const axiosInstance = createAxiosInstance();
const refreshAxios = createAxiosInstance();

// Optimize token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  useAuthStore.getState().logout();
};

// Simplified request interceptor
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    return config;
  },
  error => Promise.reject(error)
);

// Optimized response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Quick returns for common cases
    if (status === 403) {
      navigator?.('/forbidden');
      return Promise.reject(error);
    }

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url === '/api/account/refresh-token') {
      handleLogout();
      return Promise.reject(error);
    }

    // Handle token refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers = { Authorization: `Bearer ${token}` };
        return axiosInstance(originalRequest);
      }).catch(err => Promise.reject(err));
    }

    // Perform token refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const [currentAccessToken, currentRefreshToken] = [
        localStorage.getItem('accessToken'),
        localStorage.getItem('refreshToken')
      ];

      if (!currentAccessToken || !currentRefreshToken) {
        throw new Error('No tokens available');
      }

      const { data: { accessToken: newAccessToken, refreshToken: newRefreshToken } } = 
        await refreshAxios.post('/api/account/refresh-token', {
          AccessToken: currentAccessToken,
          RefreshToken: currentRefreshToken
        });

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Invalid refresh response');
      }

      // Update tokens
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` };
      axiosInstance.defaults.headers = { Authorization: `Bearer ${newAccessToken}` };

      // Process queue and update state
      processQueue(null, newAccessToken);
      isRefreshing = false;

      await useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
      return axiosInstance(originalRequest);

    } catch (error) {
      processQueue(error, null);
      isRefreshing = false;
      handleLogout();
      return Promise.reject(error);
    }
  }
);

export default axiosInstance;