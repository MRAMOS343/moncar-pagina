import { apiRequest } from "./apiClient";

/* ── Types ── */

export interface CompraSugeridaItem {
  sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  precio_compra?: number;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  promedio_diario: number;
  dias_cobertura: number;
  cantidad_sugerida: number;
  prioridad: "urgente" | "normal" | "opcional";
  calculado_en: string;
  proveedor_id?: string;
  proveedor_nombre?: string;
  lead_dias?: number;
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

export async function exportarCompraSugerida(
  token: string,
  opts: { sucursal_id?: string; prioridad?: string } = {}
): Promise<void> {
  const params = new URLSearchParams();
  if (opts.sucursal_id) params.set("sucursal_id", opts.sucursal_id);
  if (opts.prioridad) params.set("prioridad", opts.prioridad);
  const qs = params.toString();

  const BASE = import.meta.env.VITE_API_URL ?? "";
  const response = await fetch(
    `${BASE}/api/v1/compras/sugerida/export${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error("Error al generar el export");

  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `compra_sugerida_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
