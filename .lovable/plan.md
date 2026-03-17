

# Plan: Conectar Dashboard a endpoints backend de KPIs

## Resumen

Reemplazar la lógica actual del dashboard (que pagina miles de ventas y calcula KPIs en el frontend) por 4 hooks independientes que llaman a los nuevos endpoints del backend. Cada sección carga en paralelo y falla de forma aislada.

## Archivos a crear

### 1. `src/hooks/useDashboardHooks.ts`
4 hooks de React Query independientes usando `apiRequest` con token de `useAuth()`:
- **`useDashboardKpis(sucursalId?, desde?, hasta?)`** — `GET /api/v1/dashboard/kpis`, staleTime 5min
- **`useDashboardTendencia(sucursalId?, dias?)`** — `GET /api/v1/dashboard/tendencia`, staleTime 10min
- **`useDashboardMetodosPago(sucursalId?, desde?, hasta?)`** — `GET /api/v1/dashboard/metodos-pago`, staleTime 10min
- **`useDashboardTopProductos(sucursalId?, desde?, hasta?, limite?)`** — `GET /api/v1/dashboard/top-productos`, staleTime 15min

Helper interno `buildParams()` para construir query strings omitiendo valores undefined.

### 2. `src/types/dashboard.ts`
Interfaces TypeScript para las respuestas de cada endpoint:
- `DashboardKpisResponse` — ventas_totales, num_transacciones, ticket_promedio, ventas_canceladas, from_cache
- `DashboardTendenciaResponse` — data[]: { fecha, total, num_ventas }
- `DashboardMetodosPagoResponse` — data[]: { metodo, total, num_pagos, porcentaje }
- `DashboardTopProductosResponse` — data[]: { sku, nombre, marca, unidades_vendidas, ingresos_totales, num_ventas }

## Archivos a modificar

### 3. `src/pages/DashboardPage.tsx` — Reescritura significativa

**Eliminar:**
- Imports de `useDashboardSales`, `useDashboardPaymentMethods`, `dashboardKpiService`
- Toda la lógica de `fromDate` con `subDays`/`format`
- Todos los `useMemo` que calculan KPIs, tendencia, porSucursal, ventasRecientes
- El aviso de "datos truncados"

**Conectar a los 4 hooks:**
- KPI cards → `useDashboardKpis` — mapear los 4 campos a `KPIData[]` directamente
- Gráfica de tendencia → `useDashboardTendencia` — agregar selector de días (7|15|30) que cambia el queryKey
- Gráfica circular → `useDashboardMetodosPago` (siempre, ya no condicional por sucursal)
- Nueva sección "Top Productos" → `useDashboardTopProductos` — tabla con SKU, Nombre, Marca, Unidades, Ingresos

**Selector de período:** Mantener el `<Select>` de fecha pero ahora pasa `desde`/`hasta` como strings directamente a los hooks.

**Invalidación al cambiar sucursal:**
```ts
useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}, [currentWarehouse]);
```

**Cada sección maneja su propio loading/error:**
- Loading → skeleton correspondiente (ya existentes: `KPISkeleton`, `ChartSkeleton`)
- Error → ícono de advertencia con tooltip, sin bloquear las demás secciones

**Reemplazar "Ventas Recientes"** por la tabla de Top Productos.

**Mantener:** Botón "Actualizar" (invalida `["dashboard"]`), botones "Nueva Venta" y "Agregar Producto", alertas del sistema (adaptadas a usar `kpisData.ventas_canceladas`).

## Archivos a eliminar (o dejar sin uso)

- `src/hooks/useDashboardSales.ts` — ya no se necesita
- `src/hooks/useDashboardPaymentMethods.ts` — ya no se necesita
- `src/services/dashboardKpiService.ts` — ya no se necesita (los cálculos se hacen en el backend)

## Notas técnicas

- `apiRequest` ya maneja auth (Bearer token), errores 401, y parsing JSON
- El campo `from_cache` de las respuestas se ignora en la UI (solo para debugging)
- El selector de días de tendencia (7|15|30) es un nuevo `useState` que alimenta el parámetro `dias` del hook

