const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vynk_access_token');
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set JSON content type
  if (options.body && !(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Attempt token refresh or logout
    const refreshToken = localStorage.getItem('vynk_refresh_token');
    if (refreshToken && !endpoint.includes('/auth/refresh')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          localStorage.setItem('vynk_access_token', tokenData.data.accessToken);
          localStorage.setItem('vynk_refresh_token', tokenData.data.refreshToken);
          // Retry original request
          (headers as Record<string, string>)['Authorization'] = `Bearer ${tokenData.data.accessToken}`;
          const retryRes = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
          return await retryRes.json();
        }
      } catch (e) {
        // Fallback to clear
      }
    }
  }

  // Handle file downloads
  if (headers && (headers as any)['Accept'] === 'text/csv') {
    return (await response.text()) as unknown as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message || 'Network request failed', response.status, data);
  }

  return data;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  put: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
