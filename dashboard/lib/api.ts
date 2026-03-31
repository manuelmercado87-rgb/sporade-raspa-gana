const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getStats: () =>
    request<{
      redemptions: number;
      scratchCodes: { total: number; used: number; available: number };
      dgoCodes: { total: number; delivered: number; available: number };
    }>('/redemptions/stats'),

  getRedemptions: (page = 1, limit = 50) =>
    request<{
      items: Redemption[];
      total: number;
      page: number;
      limit: number;
    }>(`/redemptions?page=${page}&limit=${limit}`),

  loadScratchCodes: (codes: string[]) =>
    request<{ loaded: number; duplicates: number }>('/codes/scratch/bulk', {
      method: 'POST',
      body: JSON.stringify({ codes }),
    }),

  loadDgoCodes: (codes: string[]) =>
    request<{ loaded: number; duplicates: number }>('/codes/dgo/bulk', {
      method: 'POST',
      body: JSON.stringify({ codes }),
    }),

  getScratchStock: () =>
    request<{ total: number; used: number; available: number }>('/codes/scratch/stock'),

  getDgoStock: () =>
    request<{ total: number; delivered: number; available: number }>('/codes/dgo/stock'),
};

export interface Redemption {
  id: number;
  phone: string;
  name: string;
  cedula: string;
  scratchCode: string;
  dgoCode: string;
  status: string;
  redeemedAt: string;
}
