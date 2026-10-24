import axios from 'axios';

// Determine the base API URL:
// 1. Explicit Vite environment variable (e.g. from Vercel / Render environment variables)
// 2. Relative '/api' (works on Vercel with serverless functions and on local dev with Vite proxy)
// 3. Fallback to 'http://localhost:5000/api' for SSR or non-browser environments
const getBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  return typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercept requests to add the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to guard against SPA HTML fallbacks
api.interceptors.response.use(
  (response) => {
    // If the server returned an HTML document instead of JSON (common when SPA fallbacks rewrite /api to index.html)
    if (
      typeof response.data === 'string' &&
      (response.data.includes('<!DOCTYPE') ||
        response.data.includes('<!doctype') ||
        response.data.includes('<html'))
    ) {
      return Promise.reject(new Error('Invalid API response: received HTML document instead of JSON'));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
