const normalizeApiBase = (value) => {
  if (!value) return 'http://localhost:4000/api';
  const trimmed = value.endsWith('/') ? value.slice(0, -1) : value;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_URL);
