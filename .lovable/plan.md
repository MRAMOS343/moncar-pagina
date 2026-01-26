
# Plan: Actualizar KPIs de Inventario para No Limitar a 100 Productos

## Problema Actual

Los KPIs de la página de inventario muestran "Productos Cargados" basándose únicamente en los primeros 100 productos que se cargan inicialmente. Esto no refleja el catálogo completo de productos.

## Solución Propuesta

Crear un hook dedicado para KPIs de productos que cargue múltiples páginas automáticamente (similar a `useVentasKPIs`), y actualizar la página de inventario para usar este hook.

---

## Cambios a Implementar

### 1. Crear Hook Dedicado para KPIs de Productos

**Nuevo archivo: `src/hooks/useProductosKPIs.ts`**

```typescript
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
```

---

### 2. Actualizar InventarioPage para Usar el Nuevo Hook

**Archivo: `src/pages/InventarioPage.tsx`**

**Cambios:**

1. Importar el nuevo hook:
```typescript
import { useProductosKPIs } from "@/hooks/useProductosKPIs";
```

2. Usar el hook para los KPIs:
```typescript
const { 
  data: kpiData, 
  isLoading: kpiLoading 
} = useProductosKPIs();
```

3. Actualizar el cálculo de KPIs para usar datos del hook:
```typescript
const productKPIs = useMemo((): KPIData[] => {
  const totalProductos = kpiData?.totalProductos ?? 0;
  const totalMarcas = kpiData?.marcas.length ?? 0;
  const totalLineas = kpiData?.lineas.length ?? 0;

  return [
    {
      label: "Total Productos",
      value: totalProductos,
      format: "number",
    },
    {
      label: "Productos Mostrados",
      value: filteredProducts.length,
      format: "number",
    },
    {
      label: "Marcas",
      value: totalMarcas,
      format: "number",
    },
    {
      label: "Líneas",
      value: totalLineas,
      format: "number",
    },
  ];
}, [kpiData, filteredProducts.length]);
```

4. Usar `kpiLoading` para el skeleton de KPIs:
```typescript
{(isLoading || kpiLoading) ? (
  <>
    <KPISkeleton />
    ...
  </>
) : (
  productKPIs.map(...)
)}
```

---

## Comportamiento Final

| KPI | Antes | Después |
|-----|-------|---------|
| Productos | Solo primeros 100 cargados | Hasta 10,000 productos del catálogo |
| Marcas | Solo de los 100 primeros | Total de marcas en el catálogo |
| Líneas | Solo de los 100 primeros | Total de líneas en el catálogo |

---

## Consideraciones Técnicas

- **Cache de 5 minutos**: Los KPIs se cachean para evitar recargas innecesarias
- **Carga paralela separada**: El hook de KPIs es independiente del hook de la tabla
- **Límite de seguridad**: Máximo 10,000 productos o 20 páginas para evitar sobrecarga
- **Indicador de truncamiento**: Se puede mostrar mensaje si los datos están truncados

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/useProductosKPIs.ts` | Crear nuevo hook |
| `src/pages/InventarioPage.tsx` | Actualizar para usar el nuevo hook |
