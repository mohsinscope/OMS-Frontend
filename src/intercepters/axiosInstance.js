import axios from 'axios';
import BASE_URL from '../store/url';
import useAuthStore from './../store/store';
import { notification } from 'antd';

/* ───── Debug helpers ───── */
const DEBUG_AUTH = true;
const dbg = (...args) => { if (DEBUG_AUTH) console.log('[auth]', ...args); };
const maskToken = (t) => {
  if (!t) return '(none)';
  const s = String(t);
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)} [len:${s.length}]`;
};

/* ───── In-memory access token ───── */
let memoryAccessToken = null;
const setAccessToken = (t) => {
  const prev = memoryAccessToken;
  memoryAccessToken = t || null;
  dbg('setAccessToken:', 'prev=', maskToken(prev), 'next=', maskToken(memoryAccessToken));
};

// Create axios instances with shared config
const createAxiosInstance = () =>
  axios.create({
    baseURL: BASE_URL,
    timeout: 40000,
  });

const axiosInstance = createAxiosInstance();
const refreshAxios = createAxiosInstance();
// refresh must send cookies (HttpOnly refresh token)
refreshAxios.defaults.withCredentials = true;

// Token refresh state management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  dbg('processQueue: count=', failedQueue.length, 'error?', !!error, 'token=', maskToken(token));
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
  dbg('handleLogout: logging out and clearing tokens');
  // legacy clears (harmless even if unused)
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  setAccessToken(null);
  useAuthStore.getState().logout();
  // Clear any pending requests
  processQueue(new Error('User logged out'), null);
  isRefreshing = false;
};

const refreshToken = async () => {
  dbg('refreshToken: start (withCredentials cookie expected)');

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Refresh token attempt timed out')), 20000)
    );

    const refreshPromise = refreshAxios.post(
      '/api/account/refresh-token',
      {},
      { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
    );

    const { data } = await Promise.race([refreshPromise, timeoutPromise]);

    // Accept both camel/Pascal case from backend
    const newAccessToken =
      data?.accessToken ?? data?.AccessToken ?? data?.token ?? data?.Token ?? null;
    const newRefreshToken =
      data?.refreshToken ?? data?.RefreshToken ?? data?.refresh_token ?? null; // optional (cookie is primary)

    dbg('refreshToken: response',
        'access=', maskToken(newAccessToken),
        'refreshPresent=', !!newRefreshToken);

    if (!newAccessToken) {
      dbg('refreshToken: invalid tokens received');
      throw new Error('Invalid tokens received from server');
    }

    // Update in-memory token & axios default header
    setAccessToken(newAccessToken);
    axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
    dbg('refreshToken: axios defaults updated');

    // Update store (refresh may be null if cookie-only rotation)
    await useAuthStore.getState().updateTokens?.(newAccessToken, newRefreshToken || null);
    dbg('refreshToken: store updated');

    return newAccessToken;
  } catch (error) {
    dbg('refreshToken: FAILED ->', error?.message || error);
    setAccessToken(null);
    throw error;
  }
};

// Request interceptor with improved token refresh logic
axiosInstance.interceptors.request.use(
  async (config) => {
    if (isRefreshing) {
      dbg('request: queueing while refresh in-flight ->', config?.url, 'queueLen=', failedQueue.length + 1);
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            dbg('request: resumed after refresh ->', config?.url, 'token=', maskToken(token));
            if (token) {
              config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
            }
            resolve(config);
          },
          reject: (err) => {
            dbg('request: resume rejected ->', config?.url, err?.message || err);
            reject(err);
          },
        });
      });
    }

    if (memoryAccessToken) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${memoryAccessToken}` };
      dbg('request:', config?.method?.toUpperCase(), config?.url, 'using access=', maskToken(memoryAccessToken));
    } else {
      dbg('request:', config?.method?.toUpperCase(), config?.url, 'no access token attached');
    }
    return config;
  },
  (error) => {
    dbg('request interceptor error:', error?.message || error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest) {
      dbg('response error: no originalRequest, status=', status);
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      const url = originalRequest?.url || '';
      const isRefreshPath = url.includes('/api/account/refresh-token');
      dbg('response 401:', url, 'retry?', !isRefreshPath, 'isRefreshing=', isRefreshing);

      if (!isRefreshPath) {
        if (isRefreshing) {
          dbg('response 401: queueing retry for', url, 'queueLen=', failedQueue.length + 1);
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token) => {
                dbg('response 401: replaying queued request ->', url, 'token=', maskToken(token));
                if (token) {
                  originalRequest.headers = {
                    ...(originalRequest.headers || {}),
                    Authorization: `Bearer ${token}`,
                  };
                }
                resolve(axiosInstance(originalRequest));
              },
              reject: (e) => {
                dbg('response 401: queued request rejected ->', url, e?.message || e);
                reject(e);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;
        dbg('response 401: starting refresh flow');

        try {
          const newToken = await refreshToken();
          dbg('response 401: refresh ok, new access=', maskToken(newToken));
          processQueue(null, newToken);

          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${newToken}`,
          };
          dbg('response 401: retrying original ->', originalRequest?.url);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          dbg('response 401: refresh failed -> logout');
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
          dbg('response 401: refresh flow ended');
        }
      }
    }

    if (status === 403) {
      dbg('response 403 -> redirect /forbidden');
      window.location.href = '/forbidden';
      return Promise.reject(error);
    }

    if (status === 409) {
      let messageText = 'حدث خطأ';
      const path = originalRequest?.url || '';

      if (path.includes('/api/DamagedPassport')) {
        messageText = 'رقم الجواز موجود';
      } else if (path.includes('/api/Expense')) {
        messageText = 'هنالك مصروف شهري بنفس هذا التاريخ';
      } else if (path.includes('/api/Attendance')) {
        messageText = 'لقد تم انشاء الحضور مسبقا';
      }

      dbg('response 409:', path, '->', messageText);

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

    dbg('response error passthrough:', status, originalRequest?.url);
    return Promise.reject(error);
  }
);

export default axiosInstance;
