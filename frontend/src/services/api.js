import axios from 'axios';

const API_BASE = process.env.VUE_APP_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config && error.config.url && String(error.config.url).includes('/auth/login')
      if (!isLoginRequest) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) localStorage.setItem('authToken', token);
  else localStorage.removeItem('authToken');
}

export function setAuthUser(user) {
  if (user) localStorage.setItem('authUser', JSON.stringify(user));
  else localStorage.removeItem('authUser');
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function getAuthUser() {
  try {
    const u = localStorage.getItem('authUser');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

/** Очищает данные предыдущего пользователя (задачи, уведомления и т.д.), оставляет только auth и язык */
export function clearPreviousUserData() {
  const keep = ['authToken', 'authUser', 'selectedLanguage'];
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  keys.forEach(k => { if (k && !keep.includes(k)) localStorage.removeItem(k); });
}

export default api;
