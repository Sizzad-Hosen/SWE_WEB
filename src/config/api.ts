import { env } from './env';

const ACCESS_TOKEN_KEY = 'nctb_kids_access_token';

export const tokenStorage = {
  async getToken() { return window.localStorage.getItem(ACCESS_TOKEN_KEY); },
  async setToken(token: string) { window.localStorage.setItem(ACCESS_TOKEN_KEY, token); },
  async removeToken() { window.localStorage.removeItem(ACCESS_TOKEN_KEY); },
};

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const buildUrl = (route: string) => {
  if (!env.API_BASE_URL) throw new ApiError('API base URL is missing.');
  return `${env.API_BASE_URL.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;
};

export async function apiRequest<T>(route: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.auth) {
    const token = await tokenStorage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(buildUrl(route), {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data
      ? String((data as { message: unknown }).message)
      : 'Request failed';
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}

export const apiGet = <T,>(route: string, auth = true) =>
  apiRequest<T>(route, { method: 'GET', auth });
export const apiPost = <T,>(route: string, body?: unknown, auth = true) =>
  apiRequest<T>(route, { method: 'POST', body, auth });
