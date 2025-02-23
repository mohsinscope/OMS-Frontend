import axios from 'axios';
import BASE_URL from '../store/url';
import useAuthStore from './../store/store';
import { notification } from 'antd';

// Create axios instances with shared config
const createAxiosInstance = () =>
  axios.create({
    baseURL: BASE_URL,
    timeout: 20000, // Reduced timeout for faster failure detection
  });

const axiosInstance = createAxiosInstance();
const refreshAxios = createAxiosInstance();

// Optimize token refresh state management
let isRefreshing = false;

const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  useAuthStore.getState().logout();
};

// Add token refresh logic before every request
axiosInstance.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // Attempt to refresh token if both tokens exist and we're not already refreshing
    if (!isRefreshing && token && refreshToken) {
      isRefreshing = true;
      try {
        // Create a promise that rejects after 7 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Refresh token attempt timed out')), 30000)
        );

        // Race the refresh request against the timeout
        const refreshPromise = refreshAxios.post('/api/account/refresh-token', {
          AccessToken: token,
          RefreshToken: refreshToken,
        });

        const { data } = await Promise.race([refreshPromise, timeoutPromise]);
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;

        if (newAccessToken && newRefreshToken) {
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
          await useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
        } else {
          // If refresh endpoint doesn't provide new tokens, simulate a 401 error.
          return Promise.reject({
            response: {
              status: 401,
              data: { message: 'Unauthorized: token refresh failed' },
            },
          });
        }
      } catch (err) {
        // If refresh fails or times out, simulate a 401 error.
        return Promise.reject({
          response: {
            status: 401,
            data: { message: 'Unauthorized: token refresh attempt timed out or failed' },
          },
        });
      } finally {
        isRefreshing = false;
      }
    }

    // Attach the latest token to the request if available
    const updatedToken = localStorage.getItem('accessToken');
    if (updatedToken) {
      config.headers.Authorization = `Bearer ${updatedToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: log out immediately when receiving a 401 response.
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;

    if (status === 403) {
      console.log("unothirzied");
      window.location.href = '/forbidden'; // Navigates to /forbidden with a full reload
      return Promise.reject(error);
    }

    if (status === 409) {
      let messageText = 'حدث خطأ'; // default error message

      // Check the request URL to differentiate the source
      if (error.config?.url?.includes('/api/DamagedPassport')) {
        // This error is from the damaged passports endpoint
        messageText = 'رقم الجواز موجود'; // For example
      } else if (error.config?.url?.includes('/api/Attendance')) {
        // This error is from the attendance endpoint
        messageText = 'لقد تم انشاء الحضور مسبقا'; // For example
      }

      notification.error({
        message: 'خطأ', // "Error"
        description: messageText,
        placement: 'top',
        rtl: true,
      });
      return Promise.reject({
        ...error,
        customMessage: messageText,
      });
    }

    if (status === 401) {
      // Immediately log out on 401 error.
      handleLogout();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
