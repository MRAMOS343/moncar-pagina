import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProducts } from "@/services/productService";
import type { ApiProduct } from "@/types/products";

const MAX_PAGES = 20;
const PAGE_SIZE = 500;
const MAX_ITEMS = 10000;

interface ProductosKPIsResult {
  totalProductos: number;
  marcas: string[];
  lineas: string[];
  truncated: boolean;
  products: ApiProduct[];
}

/**
 * Hook dedicado para calcular KPIs de productos con múltiples páginas.
 * Carga hasta 10,000 productos (20 páginas x 500) para tener datos precisos.
 */
export function useProductosKPIs() {
  const { token } = useAuth();

  return useQuery<ProductosKPIsResult>({
    queryKey: ["productos-kpis"],
    queryFn: async () => {
      const allItems: ApiProduct[] = [];
      let cursor: string | undefined = undefined;
      let pageCount = 0;

      // Cargar múltiples páginas para KPIs más precisos
      do {
        const response = await fetchProducts(token!, {
          limit: PAGE_SIZE,
          cursor,
        });

        allItems.push(...response.items);
        cursor = response.next_cursor ?? undefined;
        pageCount++;
      } while (cursor && pageCount < MAX_PAGES && allItems.length < MAX_ITEMS);

      // Deduplicar por SKU
      const seen = new Set<string>();
      const uniqueProducts = allItems.filter(item => {
        if (seen.has(item.sku)) return false;
        seen.add(item.sku);
        return true;
      });

      // Calcular marcas y líneas únicas
      const marcas = [...new Set(uniqueProducts.map(p => p.marca).filter(Boolean))] as string[];
      const lineas = [...new Set(uniqueProducts.map(p => p.linea).filter(Boolean))] as string[];

      return {
        totalProductos: uniqueProducts.length,
        marcas,
        lineas,
        truncated: pageCount >= MAX_PAGES && cursor !== undefined,
        products: uniqueProducts,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    enabled: !!token,
  });
}
