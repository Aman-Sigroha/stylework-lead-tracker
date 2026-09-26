const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;

  if (configured === undefined || configured.trim() === '') {
    return DEFAULT_API_BASE_URL;
  }

  return configured.replace(/\/$/, '');
}
