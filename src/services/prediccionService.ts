import { apiRequest } from "./apiClient";

/* ── Types ── */

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
  tendencia: "subiendo" | "bajando" | "estable";
  confianza: number;
  dia_semana: number;
}

export interface PrediccionDiariaMetricas {
  mae: number | null;
  mape: number | null;
  dias_data: number;
  calculado_en: string;
}

export interface PrediccionDiariaKPIs {
  promedio_semanal: number;
  total_pred_30d: number;
  tendencia: "subiendo" | "bajando" | "estable" | null;
  confianza: number | null;
}

export interface PrediccionDiariaResponse {
  ok: boolean;
  historial: HistorialDiarioItem[];
  predicciones: PrediccionDiariaItem[];
  metricas: PrediccionDiariaMetricas | null;
  sin_datos: boolean;
  calculado_en: string | null;
  kpis: PrediccionDiariaKPIs;
}

/* ── API calls ── */

export async function fetchPrediccionDiaria(
  token: string,
  sucursalId?: string,
  horizonte?: number
): Promise<PrediccionDiariaResponse> {
  const params = new URLSearchParams();
  if (sucursalId) params.set("sucursal_id", sucursalId);
  if (horizonte) params.set("horizonte", String(horizonte));
  const qs = params.toString();
  return apiRequest<PrediccionDiariaResponse>(
    `/api/v1/prediccion/diaria${qs ? `?${qs}` : ""}`,
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
