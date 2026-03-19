import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSales } from "@/services/salesService";
import { toNumber } from "@/utils/formatters";
import type { SaleListItem, SalesCursor } from "@/types/sales";

const MAX_PAGES = 10;
const PAGE_SIZE = 500;
const MAX_ITEMS = 5000;

interface VentasKPIsParams {
  from: string;
  sucursal_id?: string;
}

export interface ChartDayPoint {
  date: string;   // "DD/MM"
  value: number;
}

export interface VentasKPIsResult {
  totalVentas: number;
  ticketPromedio: number;
  transacciones: number;
  truncated: boolean;
  totalItems: number;
  /** Ventas diarias agregadas (solo activas), ordenadas cronológicamente */
  chartData: ChartDayPoint[];
}

/**
 * Hook dedicado para calcular KPIs de ventas con múltiples páginas.
 * Carga hasta 5000 ventas (10 páginas x 500) para tener datos precisos.
 * También genera datos de chart agregados por día para evitar inconsistencia con la tabla parcial.
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
          include_cancelled: true,
          limit: PAGE_SIZE,
          cursor_fecha: cursor?.cursor_fecha,
          cursor_venta_id: cursor?.cursor_venta_id,
        });

        allItems.push(...response.items);
        cursor = response.next_cursor;
        pageCount++;
      } while (cursor && pageCount < MAX_PAGES && allItems.length < MAX_ITEMS);

      // Calcular KPIs solo con ventas activas
      const ventasActivas = allItems.filter(s => !s.cancelada);
      const totalVentas = ventasActivas.reduce((sum, s) => sum + toNumber(s.total), 0);
      const ticketPromedio = ventasActivas.length > 0 
        ? totalVentas / ventasActivas.length 
        : 0;

      // Agregar ventas por día para chart (solo activas)
      const salesByDay: Record<string, number> = {};
      ventasActivas.forEach(sale => {
        if (sale.usu_fecha) {
          const day = sale.usu_fecha.split('T')[0];
          salesByDay[day] = (salesByDay[day] || 0) + toNumber(sale.total);
        }
      });

      const chartData: ChartDayPoint[] = Object.entries(salesByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date]) => {
          const [, month, day] = date.split('-');
          return { date: `${day}/${month}`, value: salesByDay[date] };
        });

      return {
        totalVentas,
        ticketPromedio,
        transacciones: ventasActivas.length,
        truncated: pageCount >= MAX_PAGES && !!cursor,
        totalItems: allItems.length,
        chartData,
      };
    },
    staleTime: 0,
    enabled: !!token,
    placeholderData: undefined,
    refetchOnMount: true,
  });
}
