import axios from 'axios';
import BASE_URL from '../store/url';
import useAuthStore from './../store/store';

console.log("hello");

// Create axios instance for regular API calls
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Create axios instance for refreshing tokens
const refreshAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Manage refresh token state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle user logout by removing tokens and calling the logout method from auth store
const handleLogout = () => {
  console.log('[Axios] Logging out user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  const authStore = useAuthStore.getState();
  authStore.logout();
};

// Request interceptor to attach access token to headers
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
      // Remove or comment out the line below to avoid logging the access token
      // console.log('[Axios] Request with token:', token); 
    } else {
      console.log('[Axios] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh logic
axiosInstance.interceptors.response.use(
  (response) => response, // If response is successful, return it
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403) {
      console.log('[Axios] Forbidden access:', error.response.data);
      // Use the appropriate navigation method
      if (navigator) {
        navigator('/forbidden');
      }
      return Promise.reject(error);
    }

    // If error is a 401 and the request is to the refresh token endpoint, log out immediately
    if (error.response?.status === 401 && originalRequest.url === '/api/account/refresh-token') {
      console.log('[Axios] Refresh token request failed, logging out');
      handleLogout();
      return Promise.reject(error);
    }

    // If error is not 401 or the request has already been retried, reject the error
    if (error.response?.status !== 401 || originalRequest._retry) {
      console.log('[Axios] Non-401 error or already retried, no need to refresh');
      return Promise.reject(error);
    }

    // If another request is already refreshing the token, queue the request until refresh completes
    if (isRefreshing) {
      console.log('[Axios] Token refresh in progress, queuing request');
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers = { Authorization: `Bearer ${token}` };
        console.log('[Axios] Retrying request with new token');
        return axiosInstance(originalRequest);
      }).catch(err => Promise.reject(err));
    }

    // Start refresh process
    console.log('[Axios] Starting token refresh');
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const currentAccessToken = localStorage.getItem('accessToken');
      const currentRefreshToken = localStorage.getItem('refreshToken');

      if (!currentAccessToken || !currentRefreshToken) {
        console.log('[Axios] No tokens available for refresh');
        throw new Error('No tokens available for refresh');
      }

      // Request new tokens using the refresh token
      console.log('[Axios] Sending request to refresh tokens');
      const response = await refreshAxios.post('/api/account/refresh-token', {
        AccessToken: currentAccessToken,
        RefreshToken: currentRefreshToken
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      if (!newAccessToken || !newRefreshToken) {
        console.log('[Axios] Invalid token refresh response');
        throw new Error('Invalid token refresh response');
      }

      // Store the new tokens
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // Update request headers and defaults with the new access token
      originalRequest.headers = { Authorization: `Bearer ${newAccessToken}` };
      axiosInstance.defaults.headers = { Authorization: `Bearer ${newAccessToken}` };

      // Process any queued requests with the new token
      console.log('[Axios] Token refresh successful, processing queued requests');
      processQueue(null, newAccessToken);
      isRefreshing = false;

      // Update the auth store with the new tokens
      const authStore = useAuthStore.getState();
      await authStore.updateTokens(newAccessToken, newRefreshToken);

      // Retry the original request with the new token
      console.log('[Axios] Retrying original request with new token');
      return axiosInstance(originalRequest);

    } catch (refreshError) {
      console.error('[Axios] Token refresh failed:', refreshError);
      processQueue(refreshError, null);
      isRefreshing = false;

      // Logout user on refresh failure (either refresh token is expired or some other issue)
      console.log('[Axios] Logging out user due to refresh failure');
      handleLogout();
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
