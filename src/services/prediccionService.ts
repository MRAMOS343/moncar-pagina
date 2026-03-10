import { apiRequest } from "./apiClient";

/* ── Types ── */

// Vista semanal
export interface HistorialSemanalItem {
  semana_inicio: string;
  semana_fin: string;
  monto: number;
  num_ventas: number;
  ticket_promedio: number;
}

export interface PrediccionSemanalItem {
  semana_inicio: string;
  semana_fin: string;
  monto_pred: number;
  monto_real: number | null;
  confianza: number;
  tendencia: "subiendo" | "bajando" | "estable";
}

// Vista diaria
export interface HistorialDiarioItem {
  fecha: string;
  monto: number;
  num_ventas: number;
  dia_semana: number;
}

export interface PrediccionDiariaItem {
  fecha: string;
  monto_pred: number;
  monto_real: number | null;
  confianza: number;
  dia_semana: number;
}

// Shared
export interface PrediccionMetricas {
  mae: number | null;
  mape: number | null;
  dias_data: number;
  calculado_en?: string;
}

export interface PrediccionKPIs {
  promedio_semanal: number;
  total_pred_12sem: number;
  tendencia: "subiendo" | "bajando" | "estable" | null;
  confianza: number | null;
}

export interface PrediccionSemanalResponse {
  vista: "semanal";
  historial: HistorialSemanalItem[];
  predicciones: PrediccionSemanalItem[];
  kpis: PrediccionKPIs;
  metricas: PrediccionMetricas | null;
  sin_datos: boolean;
  calculado_en?: string | null;
}

export interface PrediccionDiariaResponse {
  vista: "diaria";
  historial: HistorialDiarioItem[];
  predicciones: PrediccionDiariaItem[];
  sin_datos: boolean;
  calculado_en?: string | null;
}

export type PrediccionResponse = PrediccionSemanalResponse | PrediccionDiariaResponse;

/* ── API calls ── */

export async function fetchPrediccion(
  token: string,
  vista: "semanal" | "diaria",
  sucursalId?: string,
  horizonte?: number
): Promise<PrediccionResponse> {
  const params = new URLSearchParams();
  params.set("vista", vista);
  if (sucursalId) params.set("sucursal_id", sucursalId);
  if (horizonte) params.set("horizonte", String(horizonte));
  return apiRequest<PrediccionResponse>(
    `/api/v1/prediccion/diaria?${params.toString()}`,
    { token }
  );
}

export async function recalcularPrediccionesDiarias(
  token: string
): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>(
    "/api/v1/prediccion/diaria/recalcular",
    { method: "POST", token }
  );
}
