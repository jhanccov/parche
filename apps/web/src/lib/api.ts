const KEY = 'parche.token';

export function getToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: {
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, data.error ?? 'Algo salió mal');
  }
  return data as T;
}

export type Me = {
  id: string;
  email: string;
  name: string | null;
  university_id: string;
  university: string;
  campus_id: string | null;
  campus: string | null;
  city: string | null;
  career: string | null;
  semester: number | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  role: string;
  points: number;
  badges: { id: string; nombre: string; descripcion: string }[];
};
