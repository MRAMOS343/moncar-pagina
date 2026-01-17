import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProducts, fetchProductBySku } from "@/services/productService";
import type { ApiProduct } from "@/types/products";

interface UseProductsParams {
  q?: string;
  limit?: number;
  enabled?: boolean;
}

export function useProducts(params: UseProductsParams = {}) {
  const { token } = useAuth();

  const stableParams = useMemo(() => ({
    q: params.q,
    limit: params.limit ?? 100,
  }), [params.q, params.limit]);

  const query = useInfiniteQuery({
    queryKey: ["products", stableParams],
    queryFn: ({ pageParam }) => fetchProducts(token!, { 
      ...stableParams, 
      cursor: pageParam,
    }),
    enabled: !!token && (params.enabled !== false),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Aplanar páginas + deduplicar por SKU
  const products = useMemo((): ApiProduct[] => {
    if (!query.data?.pages) return [];
    const all = query.data.pages.flatMap(p => p.items);
    const seen = new Set<string>();
    return all.filter(item => {
      if (seen.has(item.sku)) return false;
      seen.add(item.sku);
      return true;
    });
  }, [query.data]);

  return { 
    ...query, 
    products,
    totalCount: products.length,
  };
}

export function useProductDetail(sku: string | null, enabled: boolean = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["product", sku],
    queryFn: () => fetchProductBySku(token!, sku!),
    enabled: !!token && !!sku && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
