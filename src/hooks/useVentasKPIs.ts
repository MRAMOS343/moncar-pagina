import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSales } from "@/services/salesService";
import { toNumber } from "@/utils/formatters";
import type { SaleListItem, SalesCursor } from "@/types/sales";

const MAX_PAGES = 5;
const PAGE_SIZE = 200;

interface VentasKPIsParams {
  from: string;
  sucursal_id?: string;
}

interface VentasKPIsResult {
  totalVentas: number;
  ticketPromedio: number;
  transacciones: number;
  truncated: boolean;
  totalItems: number;
}

/**
 * Hook dedicado para calcular KPIs de ventas con múltiples páginas.
 * Carga hasta 1000 ventas (5 páginas x 200) para tener datos más precisos.
 */
export function useVentasKPIs(params: VentasKPIsParams) {
  const { token } = useAuth();

  return useQuery<VentasKPIsResult>({
    queryKey: ["ventas-kpis", params.from, params.sucursal_id],
    queryFn: async () => {
      const allItems: SaleListItem[] = [];
      let cursor: SalesCursor | null | undefined = undefined;
      let pageCount = 0;

      // Fetch múltiples páginas para KPIs más precisos
      do {
        const response = await fetchSales(token!, {
          from: params.from,
          sucursal_id: params.sucursal_id,
          include_cancelled: true, // Necesitamos todas para calcular ratio si se requiere
          limit: PAGE_SIZE,
          cursor_fecha: cursor?.cursor_fecha,
          cursor_venta_id: cursor?.cursor_venta_id,
        });

        allItems.push(...response.items);
        cursor = response.next_cursor;
        pageCount++;
      } while (cursor && pageCount < MAX_PAGES);

      // Calcular KPIs solo con ventas activas
      const ventasActivas = allItems.filter(s => !s.cancelada);
      const totalVentas = ventasActivas.reduce((sum, s) => sum + toNumber(s.total), 0);
      const ticketPromedio = ventasActivas.length > 0 
        ? totalVentas / ventasActivas.length 
        : 0;

      return {
        totalVentas,
        ticketPromedio,
        transacciones: ventasActivas.length,
        truncated: pageCount >= MAX_PAGES && cursor !== null,
        totalItems: allItems.length
      };
    },
    staleTime: 0, // Siempre refetch al cambiar período
    enabled: !!token,
    placeholderData: undefined, // No usar datos previos como placeholder
    refetchOnMount: true,
  });
}
