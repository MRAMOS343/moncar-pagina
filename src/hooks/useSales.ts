import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSales, fetchSaleDetail } from "@/services/salesService";
import type { FetchSalesParams } from "@/types/sales";

/**
 * Hook para listar ventas con paginación infinita (cursor-based)
 */
export function useSales(params: Omit<FetchSalesParams, 'cursor'>) {
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
    queryFn: ({ pageParam }) => fetchSales(token!, { ...stableParams, cursor: pageParam }),
    enabled: !!token,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 60 * 1000, // 1 minuto
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
