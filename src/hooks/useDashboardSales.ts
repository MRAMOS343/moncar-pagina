import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSales } from "@/services/salesService";

interface DashboardSalesParams {
  from: string;
  sucursal_id?: string;
}

/**
 * Hook para obtener ventas del dashboard.
 * Trae todas las ventas del período sin paginación cursor.
 */
export function useDashboardSales(params: DashboardSalesParams) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["dashboard-sales", params.from, params.sucursal_id],
    queryFn: async () => {
      const response = await fetchSales(token!, {
        from: params.from,
        sucursal_id: params.sucursal_id,
        include_cancelled: true, // Incluir para mostrar KPI de canceladas
        limit: 1000, // Límite alto para dashboard
      });
      return response.items;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}
