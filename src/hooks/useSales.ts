import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSales, fetchSaleDetail } from "@/services/salesService";
import type { FetchSalesParams, SalesCursor } from "@/types/sales";

/**
 * Hook para listar ventas con paginación infinita (cursor-based compuesto)
 */
export function useSales(params: Omit<FetchSalesParams, 'cursor_fecha' | 'cursor_venta_id'>) {
  const { token } = useAuth();

  // Memoizar params para queryKey estable
  const stableParams = useMemo(() => ({
    from: params.from ?? "2025-01-01",
    to: params.to,
    sucursal_id: params.sucursal_id,
    include_cancelled: params.include_cancelled ?? false,
    limit: params.limit ?? 20,
  }), [params.from, params.to, params.sucursal_id, params.include_cancelled, params.limit]);

  return useInfiniteQuery({
    queryKey: ["sales", stableParams],
    queryFn: ({ pageParam }) => fetchSales(token!, { 
      ...stableParams, 
      cursor_fecha: pageParam?.cursor_fecha,
      cursor_venta_id: pageParam?.cursor_venta_id,
    }),
    enabled: !!token,
    initialPageParam: undefined as SalesCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 60 * 1000, // 1 minuto
    retry: (failureCount, error) => {
      // No reintentar en cursor inválido o 401
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number; details?: { code?: string } };
        if (apiError.status === 401) return false;
        if (apiError.details?.code === 'CURSOR_INVALIDO') return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook para obtener detalle de una venta
 * Solo hace fetch cuando el modal está abierto
 */
export function useSaleDetail(ventaId: number | null, open: boolean) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["sale-detail", ventaId],
    queryFn: () => fetchSaleDetail(token!, ventaId!),
    enabled: !!token && ventaId !== null && open === true,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
