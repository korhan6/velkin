'use client';
/**
 * API client. Access token lives in memory only (never localStorage); the refresh token is an
 * httpOnly cookie scoped to api.<domain>/v1/auth. A 401 triggers one silent refresh + retry.
 */
export const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

export const setToken = (t: string | null) => {
  accessToken = t;
  listeners.forEach((l) => l());
};
export const onAuthChange = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(typeof body === 'object' && body && 'message' in body ? String((body as { message: unknown }).message) : `HTTP ${status}`);
  }
}

export async function refresh(): Promise<boolean> {
  refreshing ??= fetch(`${API}/v1/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (r) => {
      if (!r.ok) {
        setToken(null);
        return false;
      }
      setToken(((await r.json()) as { accessToken: string }).accessToken);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${API}${path}`, { ...init, headers, body, credentials: 'include' });
  if (res.status === 401 && retry && (await refresh())) return api<T>(path, init, false);
  if (res.status === 204) return undefined as T;
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

/** Uploads a file to the public media bucket through a presigned URL; returns its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const { url, publicUrl } = await api<{ url: string; publicUrl: string }>('/v1/admin/media/upload-url', {
    method: 'POST',
    json: { filename: file.name, contentType: file.type, size: file.size },
  });
  const put = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return publicUrl;
}

export const LOCALES = (process.env.NEXT_PUBLIC_LOCALES || 'en,es').split(',').map((s) => s.trim());
