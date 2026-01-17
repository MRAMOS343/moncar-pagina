import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchInventory } from "@/services/inventoryService";
import type { ApiInventoryItem } from "@/types/products";

export function useInventoryBySku(sku: string | null, enabled: boolean = true) {
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ["inventory", sku],
    queryFn: () => fetchInventory(token!, { sku: sku!, limit: 200 }),
    enabled: !!token && !!sku && enabled,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Deduplicar por sku+almacen
  const inventory = useMemo((): ApiInventoryItem[] => {
    if (!query.data?.items) return [];
    const seen = new Set<string>();
    return query.data.items.filter(item => {
      const key = `${item.sku}|${item.almacen}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [query.data]);

  // Calcular stock total
  const totalStock = useMemo(() => 
    inventory.reduce((sum, i) => sum + parseFloat(String(i.existencia)), 0),
    [inventory]
  );

  return { 
    ...query, 
    inventory, 
    totalStock,
  };
}
