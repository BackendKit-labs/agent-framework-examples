import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Serialized refresh state — prevents multiple simultaneous refresh calls
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const drainQueue = (token: string | null) => {
  refreshQueue.forEach(cb => cb(token));
  refreshQueue = [];
};

// Response interceptor: on 401, attempt token refresh once before redirecting
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    // If a refresh is already in flight, queue this request to retry after
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) return reject(error);
          original.headers.Authorization = `Bearer ${token}`;
          resolve(client(original));
        });
      });
    }

    isRefreshing = true;
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (!refreshToken) {
      sessionStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Use base axios (not client) to bypass this interceptor for the refresh call
      const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
      sessionStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('refreshToken', data.refreshToken);
      drainQueue(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return client(original);
    } catch {
      drainQueue(null);
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
