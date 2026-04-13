import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('chatix-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const stored = localStorage.getItem('chatix-auth');
        const { state } = JSON.parse(stored);
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: state.refreshToken });
        const parsed = JSON.parse(localStorage.getItem('chatix-auth'));
        parsed.state.accessToken = data.accessToken;
        parsed.state.refreshToken = data.refreshToken;
        localStorage.setItem('chatix-auth', JSON.stringify(parsed));
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('chatix-auth');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
