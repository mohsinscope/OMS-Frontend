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

// Add token refresh logic for every request
axiosInstance.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // Refresh token before making any request
    if (!isRefreshing && token && refreshToken) {
      isRefreshing = true;
      try {
        const { data: { accessToken: newAccessToken, refreshToken: newRefreshToken } } = 
          await refreshAxios.post('/api/account/refresh-token', {
            AccessToken: token,
            RefreshToken: refreshToken,
          });

        if (newAccessToken && newRefreshToken) {
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
          await useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
        } else {
          handleLogout();
        }
      } catch (err) {
        handleLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Attach the latest token to the request
    const updatedToken = localStorage.getItem('accessToken');
    if (updatedToken) {
      config.headers.Authorization = `Bearer ${updatedToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Simplified response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;

    if (status === 403) {
      navigator?.('/forbidden');
      return Promise.reject(error);
    }

    if (status === 401) {
      handleLogout();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
