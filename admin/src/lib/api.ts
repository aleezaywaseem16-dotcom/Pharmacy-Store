import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        const token = data.data?.accessToken;
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          original.headers['Authorization'] = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export default api;
