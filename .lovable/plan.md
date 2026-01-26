
# Plan: Corrección de KPIs y Datos en Tiempo Real

## Problema Identificado
Los KPIs (Ventas Totales, Ticket Promedio, Transacciones) no se actualizan cuando el usuario cambia el período debido a:
1. Cache agresivo de React Query (`staleTime: 60s`)
2. `useInfiniteQuery` mantiene datos de páginas anteriores
3. Solo se calculan KPIs con la primera página de datos (100 ventas)

## Solución Propuesta

### Fase 1: Forzar recarga al cambiar período
**Archivo:** `src/hooks/useSales.ts`

Cambios:
- Reducir `staleTime` a 0 para forzar recarga cuando cambia queryKey
- Agregar `refetchOnMount: true` para asegurar datos frescos

```text
Antes:
staleTime: 60 * 1000  // 1 minuto

Después:
staleTime: 0  // Siempre refetch cuando queryKey cambia
refetchOnMount: 'always'
```

---

### Fase 2: Crear hook dedicado para KPIs con más datos
**Nuevo archivo:** `src/hooks/useVentasKPIs.ts`

Este hook cargará múltiples páginas para tener KPIs más precisos:

```text
- Usar useQuery normal (no infinite) con paginación interna
- Cargar hasta 500-1000 ventas para KPIs
- Cache separado del listado de tabla
- Indicador si datos están truncados
```

Estructura:
```typescript
export function useVentasKPIs(params: { from: string; sucursal_id?: string }) {
  // Cargar hasta 5 páginas de 200 ventas = 1000 max
  // Calcular totales en el hook
  // Devolver: { totalVentas, ticketPromedio, transacciones, truncated }
}
```

---

### Fase 3: Actualizar VentasPage para usar el nuevo hook
**Archivo:** `src/pages/VentasPage.tsx`

Cambios:
- Usar `useVentasKPIs` para los 3 KPIs
- Mantener `useSales` solo para la tabla (con paginación manual)
- Mostrar indicador si los datos de KPIs están truncados

---

## Detalle Técnico

### Hook useVentasKPIs

```typescript
const MAX_PAGES = 5;
const PAGE_SIZE = 200;

export function useVentasKPIs(params: { from: string; sucursal_id?: string }) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["ventas-kpis", params.from, params.sucursal_id],
    queryFn: async () => {
      const allItems: SaleListItem[] = [];
      let cursor = undefined;
      let pageCount = 0;

      // Fetch múltiples páginas
      do {
        const response = await fetchSales(token!, {
          from: params.from,
          sucursal_id: params.sucursal_id,
          include_cancelled: true, // Necesitamos ambas para calcular ratio
          limit: PAGE_SIZE,
          cursor_fecha: cursor?.cursor_fecha,
          cursor_venta_id: cursor?.cursor_venta_id,
        });

        allItems.push(...response.items);
        cursor = response.next_cursor;
        pageCount++;
      } while (cursor && pageCount < MAX_PAGES);

      // Calcular KPIs
      const ventasActivas = allItems.filter(s => !s.cancelada);
      const totalVentas = ventasActivas.reduce((sum, s) => sum + toNumber(s.total), 0);
      const ticketPromedio = ventasActivas.length > 0 
        ? totalVentas / ventasActivas.length 
        : 0;

      return {
        totalVentas,
        ticketPromedio,
        transacciones: ventasActivas.length,
        truncated: pageCount >= MAX_PAGES,
        totalItems: allItems.length
      };
    },
    staleTime: 0, // Siempre refetch al cambiar período
    enabled: !!token,
  });
}
```

---

## Archivos a Modificar/Crear

| Archivo | Acción | Cambio |
|---------|--------|--------|
| `src/hooks/useVentasKPIs.ts` | Crear | Hook dedicado para KPIs con múltiples páginas |
| `src/hooks/useSales.ts` | Modificar | Reducir staleTime, agregar refetchOnMount |
| `src/pages/VentasPage.tsx` | Modificar | Usar nuevo hook para KPIs, mostrar indicador de truncado |

---

## Resultado Esperado

1. **KPIs se actualizan inmediatamente** al cambiar el período
2. **Datos más precisos** al cargar hasta 1000 ventas para KPIs
3. **Indicador visual** si hay más datos de los mostrados (ej: "Basado en las últimas 1000 transacciones")
4. **Tabla separada** con su propia paginación infinita para navegar todas las ventas

---

## Sobre "Cachear Total de Ventas"

Para tener el total EXACTO de todas las ventas, la mejor opción sería:

**Solución ideal (requiere cambio en backend):**
- Endpoint `/sales/stats?from=X&to=Y` que devuelva solo agregados:
  ```json
  { "total": 1234567.89, "count": 823, "cancelled": 12 }
  ```
- Esto sería instantáneo y preciso

**Solución actual (frontend):**
- Cargar hasta 1000-2500 ventas para KPIs
- Mostrar indicador si hay más datos
- Aceptar que es una aproximación para períodos con muchas ventas
