import { apiRequest } from "./apiClient";

/* ── Types ── */

export interface CompraSugeridaItem {
  sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  promedio_diario: number;
  dias_cobertura: number;
  cantidad_sugerida: number;
  prioridad: "urgente" | "normal" | "opcional";
  calculado_en: string;
}

export interface CompraSugeridaResumen {
  urgente: number;
  normal: number;
  opcional: number;
}

export interface CompraSugeridaResponse {
  ok: boolean;
  items: CompraSugeridaItem[];
  resumen: CompraSugeridaResumen;
  pagination: { total: number; page: number; limit: number };
}

export interface PreOrdenItem {
  sku: string;
  cantidad: number;
  precio_unitario: number;
}

export interface PreOrdenBody {
  sucursal_id?: string;
  notas?: string;
  items: PreOrdenItem[];
}

export interface PreOrdenResponse {
  ok: boolean;
  orden_id: string;
}

/* ── API calls ── */

export async function fetchCompraSugerida(
  token: string,
  opts: { sucursal_id?: string; prioridad?: string; page?: number; limit?: number } = {}
): Promise<CompraSugeridaResponse> {
  const params = new URLSearchParams();
  if (opts.sucursal_id) params.set("sucursal_id", opts.sucursal_id);
  if (opts.prioridad) params.set("prioridad", opts.prioridad);
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiRequest<CompraSugeridaResponse>(
    `/api/v1/compras/sugerida${qs ? `?${qs}` : ""}`,
    { token }
  );
}

export async function crearPreOrden(
  token: string,
  body: PreOrdenBody
): Promise<PreOrdenResponse> {
  return apiRequest<PreOrdenResponse>("/api/v1/compras/pre-orden", {
    method: "POST",
    token,
    body,
  });
}

export async function recalcularCompras(
  token: string
): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>(
    "/api/v1/compras/recalcular",
    { method: "POST", token }
  );
}
