// Centralized HTTP plumbing. Components never call fetch directly;
// per-resource modules below wrap get().

import { PUBLIC_API_BASE } from '$app/env/public';

const RAW_BASE = (PUBLIC_API_BASE ?? '').trim();
export const API_BASE = RAW_BASE.replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const base = API_BASE ? `${API_BASE}${path}` : path;
  // Relative URLs resolve against the current origin in the browser.
  const url =
    typeof window !== 'undefined'
      ? new URL(base, window.location.origin)
      : new URL(base, 'http://localhost');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'omit'
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // body stays null
    }
    const pathname = path.split('?')[0];
    throw new ApiError(res.status, body, `GET ${pathname} -> ${res.status}`);
  }
  return (await res.json()) as T;
}
