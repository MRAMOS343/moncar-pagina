import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/apiClient";
import type {
  DashboardKpisResponse,
  DashboardTendenciaResponse,
  DashboardMetodosPagoResponse,
  DashboardTopProductosResponse,
} from "@/types/dashboard";

/** Construye query string omitiendo valores undefined/null */
function buildParams(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  return new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
}

export function useDashboardKpis(sucursalId?: string, desde?: string, hasta?: string) {
  const { token } = useAuth();
  return useQuery<DashboardKpisResponse>({
    queryKey: ["dashboard", "kpis", sucursalId, desde, hasta],
    queryFn: () =>
      apiRequest<DashboardKpisResponse>(
        `/api/v1/dashboard/kpis?${buildParams({ sucursal_id: sucursalId, desde, hasta })}`,
        { token },
      ),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useDashboardTendencia(sucursalId?: string, dias: number = 15) {
  const { token } = useAuth();
  return useQuery<DashboardTendenciaResponse>({
    queryKey: ["dashboard", "tendencia", sucursalId, dias],
    queryFn: () =>
      apiRequest<DashboardTendenciaResponse>(
        `/api/v1/dashboard/tendencia?${buildParams({ sucursal_id: sucursalId, dias })}`,
        { token },
      ),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useDashboardMetodosPago(sucursalId?: string, desde?: string, hasta?: string) {
  const { token } = useAuth();
  return useQuery<DashboardMetodosPagoResponse>({
    queryKey: ["dashboard", "metodos_pago", sucursalId, desde, hasta],
    queryFn: () =>
      apiRequest<DashboardMetodosPagoResponse>(
        `/api/v1/dashboard/metodos-pago?${buildParams({ sucursal_id: sucursalId, desde, hasta })}`,
        { token },
      ),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useDashboardTopProductos(
  sucursalId?: string,
  desde?: string,
  hasta?: string,
  limite?: number,
) {
  const { token } = useAuth();
  return useQuery<DashboardTopProductosResponse>({
    queryKey: ["dashboard", "top_productos", sucursalId, desde, hasta, limite],
    queryFn: () =>
      apiRequest<DashboardTopProductosResponse>(
        `/api/v1/dashboard/top-productos?${buildParams({ sucursal_id: sucursalId, desde, hasta, limite })}`,
        { token },
      ),
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });
}
