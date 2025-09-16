import axios from 'axios';
import BASE_URL from '../store/url';
import useAuthStore from './../store/store';
import { notification } from 'antd';

// Create axios instances with shared config
const createAxiosInstance = () =>
  axios.create({
    baseURL: BASE_URL,
    timeout: 40000,
  });

const axiosInstance = createAxiosInstance();
const refreshAxios = createAxiosInstance();

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  useAuthStore.getState().logout();
  // Clear any pending requests
  processQueue(new Error('User logged out'), null);
  isRefreshing = false;
};

const refreshToken = async () => {
  const token = localStorage.getItem('accessToken');
  const refreshTokenValue = localStorage.getItem('refreshToken');
  
  if (!token || !refreshTokenValue) {
    console.error('❌ Token refresh failed: No tokens available');
    throw new Error('No tokens available');
  }

  try {
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Refresh token attempt timed out')), 20000)
    );

    const refreshPromise = refreshAxios.post('/api/account/refresh-token', {
      AccessToken: token,
      RefreshToken: refreshTokenValue,
    });

    const { data } = await Promise.race([refreshPromise, timeoutPromise]);
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;

    if (!newAccessToken || !newRefreshToken) {
      console.error('❌ Token refresh failed: Invalid tokens received');
      throw new Error('Invalid tokens received from server');
    }

    // Update tokens atomically
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    // Update axios default headers
    axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
    
    // Update store
    await useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
    
    
    return newAccessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    
    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    throw error;
  }
};

// Request interceptor with improved token refresh logic
axiosInstance.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('accessToken');
    
    // If no token, proceed without authorization
    if (!token) {
      return config;
    }

    // If currently refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    // Add current token to request
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor with better error handling
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 errors with token refresh
    if (status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          }
          return Promise.reject(error);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processQueue(null, newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();
        
        // Navigate to login or show notification
        notification.error({
          message: 'انتهت الجلسة',
          description: 'يرجى تسجيل الدخول مرة أخرى',
          placement: 'top',
          rtl: true,
        });
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 errors
    if (status === 403) {
      window.location.href = '/forbidden';
      return Promise.reject(error);
    }

    // Handle 409 errors
    if (status === 409) {
      let messageText = 'حدث خطأ';

      if (error.config?.url?.includes('/api/DamagedPassport')) {
        messageText = 'رقم الجواز موجود';
      } else if (error.config?.url?.includes('/api/Expense')) {
        messageText = 'هنالك مصروف شهري بنفس هذا التاريخ';
      } else if (error.config?.url?.includes('/api/Attendance')) {
        messageText = 'لقد تم انشاء الحضور مسبقا';
      }

      notification.error({
        message: 'خطأ',
        description: messageText,
        placement: 'top',
        rtl: true,
      });
      
      return Promise.reject({
        ...error,
        customMessage: messageText,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
/* test */