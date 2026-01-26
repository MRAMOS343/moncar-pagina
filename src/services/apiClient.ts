export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function apiRequest<T>(
  path: string,
  opts: {
    method?: string;
    token?: string | null;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { method = "GET", token, body, headers, signal } = opts;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  // Manejo de 401: limpiar tokens y disparar evento global
  // AuthContext escucha este evento para manejar logout de forma controlada
  if (res.status === 401) {
    localStorage.removeItem('moncar_token');
    localStorage.removeItem('moncar_user');
    // Disparar evento en lugar de redirección forzada para evitar pérdida de estado React
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError('Sesión expirada', 401, data);
  }

  if (!res.ok) {
    throw new ApiError(
      (data as Record<string, unknown>)?.error as string ?? 
      (data as Record<string, unknown>)?.message as string ?? 
      `HTTP ${res.status}`,
      res.status,
      data
    );
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
