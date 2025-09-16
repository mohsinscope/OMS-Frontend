// intercepters/axiosInstance.js
import axios from 'axios';
import Cookies from 'js-cookie';
import BASE_URL from '../store/url';
import useAuthStore from './../store/store';
import { notification } from 'antd';

// ---- Cookie names & options (unique to avoid localhost collisions)
const ACCESS_COOKIE  = 'oms_access_v1';
const REFRESH_COOKIE = 'oms_refresh_v1';
const cookieOpts = {
  expires: 7,
  sameSite: 'strict',
  path: '/',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
};

// Helper getters with fallback to legacy names if they exist
const getAccessCookie  = () => Cookies.get(ACCESS_COOKIE)  || Cookies.get('accessToken')  || null;
const getRefreshCookie = () => Cookies.get(REFRESH_COOKIE) || Cookies.get('refreshToken') || null;

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
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const handleLogout = () => {
  // Clear cookies (both new and legacy names)
  Cookies.remove(ACCESS_COOKIE,  { path: '/' });
  Cookies.remove(REFRESH_COOKIE, { path: '/' });
  Cookies.remove('accessToken',  { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });

  useAuthStore.getState().logout();
  processQueue(new Error('User logged out'), null);
  isRefreshing = false;
};

const refreshToken = async () => {
  const token = getAccessCookie();
  const refreshTokenValue = getRefreshCookie();

  if (!token || !refreshTokenValue) {
    throw new Error('No tokens available');
  }

  let lastError = null;

  // Try up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Refresh attempt #${attempt} timed out after 20s`)), 20000)
      );

      const refreshPromise = refreshAxios.post('/api/account/refresh-token', {
        AccessToken: token,
        RefreshToken: refreshTokenValue,
      });

      const { data } = await Promise.race([refreshPromise, timeoutPromise]);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data || {};

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Invalid tokens received from server');
      }

      // ✅ Save new tokens to COOKIES
      Cookies.set(ACCESS_COOKIE,  newAccessToken,  cookieOpts);
      Cookies.set(REFRESH_COOKIE, newRefreshToken, cookieOpts);
      Cookies.set('accessToken',  newAccessToken,  cookieOpts);
      Cookies.set('refreshToken', newRefreshToken, cookieOpts);

      // Update axios default headers for subsequent requests
      axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

      // Update Zustand store
      await useAuthStore.getState().updateTokens?.(newAccessToken, newRefreshToken);

      return newAccessToken;

    } catch (error) {
      lastError = error;

      // Wait 3 seconds before next retry
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // ❌ All 3 attempts failed → logout
  Cookies.remove(ACCESS_COOKIE,  { path: '/' });
  Cookies.remove(REFRESH_COOKIE, { path: '/' });
  Cookies.remove('accessToken',  { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });

  notification.error({
    message: 'انتهت الجلسة',
    description: 'تعذر تجديد الجلسة بعد عدة محاولات. يرجى تسجيل الدخول مجدداً.',
    placement: 'top',
    rtl: true,
    duration: 5,
  });

  throw lastError;
};

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const currentToken = getAccessCookie();

    if (!currentToken) {
      return config;
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        })
        .catch((err) => Promise.reject(err));
    }

    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${currentToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;

    // Network / CORS / timeouts
    if (!error.response) {
      notification.error({
        message: 'خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم. تحقق من الشبكة أو أعد المحاولة لاحقاً.',
        placement: 'top',
        rtl: true,
      });
      return Promise.reject(error);
    }

    // Handle 401 with token refresh
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            }
            return Promise.reject(error);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processQueue(null, newToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();

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

    // Handle 403
    if (status === 403) {
      window.location.href = '/forbidden';
      return Promise.reject(error);
    }

    // Handle 409
    if (status === 409) {
      let messageText = 'حدث خطأ';

      const url = error.config?.url || '';
      if (url.includes('/api/DamagedPassport')) {
        messageText = 'رقم الجواز موجود';
      } else if (url.includes('/api/Expense')) {
        messageText = 'هنالك مصروف شهري بنفس هذا التاريخ';
      } else if (url.includes('/api/Attendance')) {
        messageText = 'لقد تم انشاء الحضور مسبقا';
      }

      notification.error({
        message: 'خطأ',
        description: messageText,
        placement: 'top',
        rtl: true,
      });

      return Promise.reject({ ...error, customMessage: messageText });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;