import type { AuthPayload, Paginated } from "./types";

type ListPayload<T> = T[] | Paginated<T> | { results?: T[]; count?: number } | undefined | null;

export function asList<T>(data: ListPayload<T>): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results || [];
}

export function asPage<T>(data: ListPayload<T>): { results: T[]; count: number } {
  if (!data) return { results: [], count: 0 };
  if (Array.isArray(data)) return { results: data, count: data.length };
  return { results: data.results || [], count: data.count ?? (data.results || []).length };
}

const lookupCache = new Map<string, { at: number; data: unknown }>();

export async function apiCached<T>(path: string, ttlMs = 30_000): Promise<T> {
  const hit = lookupCache.get(path);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const data = await api<T>(path);
  lookupCache.set(path, { at: Date.now(), data });
  return data;
}

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    lookupCache.clear();
    return;
  }
  for (const key of lookupCache.keys()) {
    if (key.startsWith(prefix)) lookupCache.delete(key);
  }
}

function defaultApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

const API_URL = defaultApiUrl();

const ACCESS_KEY = "upos_access";
const REFRESH_KEY = "upos_refresh";
const BRANCH_KEY = "upos_branch";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getBranchId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BRANCH_KEY);
}

export function setBranchId(id: string | null) {
  if (id) localStorage.setItem(BRANCH_KEY, id);
  else localStorage.removeItem(BRANCH_KEY);
}

export function saveTokens(payload: Pick<AuthPayload, "access" | "refresh">) {
  localStorage.setItem(ACCESS_KEY, payload.access);
  localStorage.setItem(REFRESH_KEY, payload.refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class NetworkError extends Error {
  constructor() {
    super("Network unavailable");
    this.name = "NetworkError";
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(typeof body === "string" ? body : "Request failed");
    this.status = status;
    this.body = body;
  }
}

export function fieldErrors(body: unknown): Record<string, string> {
  if (!body || typeof body !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (Array.isArray(value)) out[key] = String(value[0]);
    else if (typeof value === "string") out[key] = value;
  }
  return out;
}

async function refreshAccess(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      if (res.status === 401) clearTokens();
      return null;
    }
    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.access);
    if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
    return data.access as string;
  } catch {
    return null;
  }
}

export function apiBase() {
  return defaultApiUrl();
}

export async function publicApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(`${defaultApiUrl()}${path}`, { ...init, headers });
  } catch {
    throw new NetworkError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${defaultApiUrl()}${path}`, { ...init, headers });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new NetworkError();
  }

  if (res.status === 401 && retry && localStorage.getItem(REFRESH_KEY)) {
    const next = await refreshAccess();
    if (next) return api<T>(path, init, false);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
