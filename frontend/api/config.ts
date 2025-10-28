// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  PLAYLIST: '/playlist',
  PLAYLIST_USER: '/playlist/user',
  SEARCH: '/search',
  USERS: '/users',
} as const;
