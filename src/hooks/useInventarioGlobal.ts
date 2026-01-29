import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchInventory } from "@/services/inventoryService";
import { useProductosKPIs } from "./useProductosKPIs";
import { useSucursales } from "./useSucursales";
import type { ApiInventoryItem, InventoryCursor } from "@/types/products";

const MAX_PAGES = 50;
const PAGE_SIZE = 200;
const MAX_ITEMS = 10000;

interface WarehouseData {
  productos: number;
  unidades: number;
  valor: number;
  nombre: string;
}

interface InventarioGlobalResult {
  totalStockValue: number;
  uniqueProducts: number;
  totalItems: number;
  byWarehouse: Record<string, WarehouseData>;
  warehouseCount: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook para cargar el inventario global desde la API y calcular totales por almacén.
 * Combina datos de /inventario con precios de productos y nombres de sucursales.
 */
export function useInventarioGlobal(): InventarioGlobalResult {
  const { token } = useAuth();

  // Cargar todos los productos para obtener precios
  const { data: productosData, isLoading: productosLoading } = useProductosKPIs();

  // Cargar sucursales para obtener nombres legibles
  const { data: sucursales, isLoading: sucursalesLoading } = useSucursales();

  // Cargar inventario global (sin filtro de SKU)
  const inventoryQuery = useQuery({
    queryKey: ["inventario-global"],
    queryFn: async () => {
      const allItems: ApiInventoryItem[] = [];
      let cursor: InventoryCursor | undefined = undefined;
      let previousCursorKey: string | null = null;
      let pageCount = 0;

      do {
        const response = await fetchInventory(token!, {
          limit: PAGE_SIZE,
          cursor_sku: cursor?.cursor_sku,
          cursor_almacen: cursor?.cursor_almacen,
        });

        allItems.push(...response.items);
        
        const newCursor = response.next_cursor ?? undefined;
        
        // Verificar que el cursor cambió para evitar loop infinito
        const newCursorKey = newCursor 
          ? `${newCursor.cursor_sku}|${newCursor.cursor_almacen}` 
          : null;
        
        if (newCursorKey && newCursorKey === previousCursorKey) {
          console.warn('[useInventarioGlobal] Cursor no cambió entre iteraciones, deteniendo paginación para evitar loop infinito');
          break;
        }
        
        previousCursorKey = newCursorKey;
        cursor = newCursor;
        pageCount++;
      } while (cursor && pageCount < MAX_PAGES && allItems.length < MAX_ITEMS);

      // Deduplicar por sku+almacen
      const seen = new Set<string>();
      return allItems.filter(item => {
        const key = `${item.sku}|${item.almacen}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!token,
  });

  // Crear mapa de precios por SKU
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    if (productosData?.products) {
      for (const p of productosData.products) {
        map.set(p.sku, p.precio1 ?? 0);
      }
    }
    return map;
  }, [productosData]);

  // Crear mapa de nombres de sucursales
  const warehouseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (sucursales) {
      for (const s of sucursales) {
        map.set(s.codigo, s.nombre);
      }
    }
    return map;
  }, [sucursales]);

  // Calcular agregados
  const result = useMemo((): Omit<InventarioGlobalResult, 'isLoading' | 'error'> => {
    const inventory = inventoryQuery.data ?? [];
    
    if (inventory.length === 0) {
      return {
        totalStockValue: 0,
        uniqueProducts: 0,
        totalItems: 0,
        byWarehouse: {},
        warehouseCount: 0,
      };
    }

    // Agrupar por almacén
    const byWarehouse: Record<string, WarehouseData> = {};
    const globalSkus = new Set<string>();
    let totalValue = 0;
    let totalUnits = 0;

    for (const item of inventory) {
      const existencia = parseFloat(String(item.existencia)) || 0;
      const precio = priceMap.get(item.sku) ?? 0;
      const valor = existencia * precio;

      globalSkus.add(item.sku);
      totalValue += valor;
      totalUnits += existencia;

      if (!byWarehouse[item.almacen]) {
        byWarehouse[item.almacen] = {
          productos: 0,
          unidades: 0,
          valor: 0,
          nombre: warehouseNameMap.get(item.almacen) ?? item.almacen,
        };
      }

      byWarehouse[item.almacen].productos += 1;
      byWarehouse[item.almacen].unidades += existencia;
      byWarehouse[item.almacen].valor += valor;
    }

    return {
      totalStockValue: totalValue,
      uniqueProducts: globalSkus.size,
      totalItems: totalUnits,
      byWarehouse,
      warehouseCount: Object.keys(byWarehouse).length,
    };
  }, [inventoryQuery.data, priceMap, warehouseNameMap]);

  const isLoading = inventoryQuery.isLoading || productosLoading || sucursalesLoading;

  return {
    ...result,
    isLoading,
    error: inventoryQuery.error as Error | null,
  };
}
