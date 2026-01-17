import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSales } from "@/services/salesService";
import type { SaleListItem, SalesCursor } from "@/types/sales";

interface DashboardSalesParams {
  from: string;
  sucursal_id?: string;
}

// Límites de seguridad para evitar loops infinitos
const MAX_PAGES = 20;
const MAX_ITEMS = 10000;

/**
 * Hook para obtener ventas del dashboard.
 * Implementa paginación por cursor para traer TODO el historial del período.
 */
export function useDashboardSales(params: DashboardSalesParams) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["dashboard-sales", params.from, params.sucursal_id],
    queryFn: async (): Promise<SaleListItem[]> => {
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
          limit: 1000,
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

      // Log de diagnóstico (temporal para debugging)
      if (allItems.length > 0) {
        const fechas = allItems.map(i => i.fecha_emision.split('T')[0]);
        const minFecha = fechas.reduce((a, b) => a < b ? a : b);
        const maxFecha = fechas.reduce((a, b) => a > b ? a : b);
        console.log(`[Dashboard Sales] from=${params.from}, pages=${pageCount}, items=${allItems.length}, rango=[${minFecha} → ${maxFecha}]${truncated ? ' (TRUNCADO)' : ''}`);
      } else {
        console.log(`[Dashboard Sales] from=${params.from}, pages=${pageCount}, items=0 (sin ventas)`);
      }

      if (truncated) {
        console.warn(`[Dashboard Sales] Datos truncados: se alcanzó el límite de ${MAX_PAGES} páginas o ${MAX_ITEMS} items`);
      }

      return allItems;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}
