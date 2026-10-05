import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.capybarababy.com/api';
//fixed some bugs and hell yeah

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Token helpers ───────────────────────────────────────────
export const getAccessToken = () => localStorage.getItem('capybara_access');
export const getRefreshToken = () => localStorage.getItem('capybara_refresh');

export const setTokens = (access, refresh) => {
  localStorage.setItem('capybara_access', access);
  if (refresh) localStorage.setItem('capybara_refresh', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('capybara_access');
  localStorage.removeItem('capybara_refresh');
};

// ─── Request interceptor — attach access token ──────────────
api.interceptors.request.use(
  (config) => {
    if (config.guestBearerToken) {
      config.headers.Authorization = `Bearer ${config.guestBearerToken}`;
      config._skipAuthRefresh = true;
      delete config.guestBearerToken;
      return config;
    }
    if (config.skipUserAuth) {
      delete config.skipUserAuth;
      delete config.headers.Authorization;
      config._skipAuthRefresh = true;
      return config;
    }
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — auto-refresh on 401 ─────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._skipAuthRefresh &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/accounts/refresh/`, {
          refresh: getRefreshToken(),
        });

        setTokens(data.access, data.refresh || getRefreshToken());
        processQueue(null, data.access);

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
