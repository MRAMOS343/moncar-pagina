import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSales } from "@/services/salesService";
import type { SaleListItem, SalesCursor } from "@/types/sales";

interface DashboardSalesParams {
  from: string;
  sucursal_id?: string;
}

// Respuesta con metadata de truncado
export interface DashboardSalesResult {
  items: SaleListItem[];
  truncated: boolean;
  pageCount: number;
  totalFetched: number;
}

// Límites de seguridad - balanceados para datos completos sin sobrecargar
const MAX_PAGES = 10;
const MAX_ITEMS = 5000;
const PAGE_SIZE = 500;

/**
 * Hook para obtener ventas del dashboard.
 * Implementa paginación por cursor con límites optimizados para carga rápida.
 * Retorna metadata de truncado para que la UI pueda informar al usuario.
 */
export function useDashboardSales(params: DashboardSalesParams) {
  const { token } = useAuth();

  return useQuery({
    // Incluir sucursal_id explícitamente en la key para invalidación correcta
    queryKey: ["dashboard-sales", params.from, params.sucursal_id ?? "all"],
    queryFn: async (): Promise<DashboardSalesResult> => {
      const allItems: SaleListItem[] = [];
      let cursor: SalesCursor | undefined = undefined;
      let pageCount = 0;
      let truncated = false;

      // Fetch paginado hasta agotar páginas o alcanzar límites
      do {
        const response = await fetchSales(token!, {
          from: params.from,
          sucursal_id: params.sucursal_id,
          include_cancelled: true,
          limit: PAGE_SIZE,
          cursor_fecha: cursor?.cursor_fecha,
          cursor_venta_id: cursor?.cursor_venta_id,
        });

        allItems.push(...response.items);
        cursor = response.next_cursor ?? undefined;
        pageCount++;

        // Verificar límites de seguridad
        if (pageCount >= MAX_PAGES || allItems.length >= MAX_ITEMS) {
          truncated = true;
          break;
        }
      } while (cursor);

      // Log de diagnóstico (compacto)
      if (import.meta.env.DEV) {
        console.log(`[Dashboard] ${allItems.length} ventas, ${pageCount} páginas${truncated ? ' (truncado)' : ''}`);
      }

      return {
        items: allItems,
        truncated,
        pageCount,
        totalFetched: allItems.length,
      };
    },
    enabled: !!token,
    staleTime: 0, // Siempre considerados "stale" - refetch al cambiar params
    gcTime: 5 * 60 * 1000, // Mantener en cache 5 minutos
    refetchOnMount: 'always', // Siempre refetch al montar para datos frescos
    refetchOnWindowFocus: true, // Refetch cuando el usuario vuelve a la pestaña
  });
}
