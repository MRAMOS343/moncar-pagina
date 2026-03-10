import { apiRequest } from "./apiClient";

/* ── Types ── */

export interface PrediccionProductoItem {
  sku: string;
  nombre: string;
  marca: string;
  mae: number | null;
  mape: number | null;
  stock_actual: number;
}

export interface PrediccionProductosResponse {
  ok: boolean;
  productos: PrediccionProductoItem[];
}

export interface HistorialItem {
  semana: string;
  unidades: number;
}

export interface PrediccionItem {
  semana_inicio: string;
  unidades_pred: number;
  unidades_reales: number | null;
  tendencia: "subiendo" | "bajando" | "estable";
  confianza: number;
}

export interface PrediccionMetricas {
  mae: number | null;
  mape: number | null;
  semanas_data: number;
  calculado_en: string;
}

export interface PrediccionProductoDetalle {
  sku: string;
  nombre: string;
  precio: number;
  marca: string;
  categoria: string;
  stock_minimo: number;
  stock_actual: number;
  stock_por_almacen: { almacen: string; existencia: number }[];
}

export interface PrediccionResponse {
  ok: boolean;
  producto: PrediccionProductoDetalle;
  historial: HistorialItem[];
  predicciones: PrediccionItem[];
  metricas: PrediccionMetricas;
  sin_datos: boolean;
  calculado_en: string;
}

/* ── API calls ── */

export async function fetchPrediccionProductos(
  token: string,
  sucursalId?: string
): Promise<PrediccionProductosResponse> {
  const params = new URLSearchParams();
  if (sucursalId) params.set("sucursal_id", sucursalId);
  const qs = params.toString();
  return apiRequest<PrediccionProductosResponse>(
    `/api/v1/prediccion/productos${qs ? `?${qs}` : ""}`,
    { token }
  );
}

export async function fetchPrediccion(
  token: string,
  productoSku: string,
  sucursalId?: string,
  horizonte?: number
): Promise<PrediccionResponse> {
  const params = new URLSearchParams();
  params.set("producto_sku", productoSku);
  if (sucursalId) params.set("sucursal_id", sucursalId);
  if (horizonte) params.set("horizonte", String(horizonte));
  return apiRequest<PrediccionResponse>(
    `/api/v1/prediccion?${params.toString()}`,
    { token }
  );
}

export async function recalcularPredicciones(
  token: string
): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>(
    "/api/v1/prediccion/recalcular",
    { method: "POST", token }
  );
}
