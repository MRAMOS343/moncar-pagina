

## Connect PrediccionPage to Real Backend Endpoints

Replace all mock/synthetic data in the Predicción de Ventas page with real API calls, matching the backend schema exactly.

### Files to Create

**1. `src/services/prediccionService.ts`**
- Types matching the backend response: `PrediccionProductosResponse`, `PrediccionResponse`, `PrediccionItem`, `HistorialItem`, `PrediccionMetricas`, etc.
- `fetchPrediccionProductos(token, sucursalId?)` → GET `/api/v1/prediccion/productos`
- `fetchPrediccion(token, productoSku, sucursalId?, horizonte?)` → GET `/api/v1/prediccion`
- `recalcularPredicciones(token)` → POST `/api/v1/prediccion/recalcular`

**2. `src/hooks/usePrediccion.ts`**
- `usePrediccionProductos(sucursalId?)` — React Query hook wrapping fetchPrediccionProductos
- `usePrediccionDetalle(productoSku, sucursalId?, horizonte?)` — React Query hook wrapping fetchPrediccion
- Both use `useAuth()` for token, 5min staleTime, retry 2

### Files to Modify

**3. `src/pages/PrediccionPage.tsx`** — Full rewrite of data flow

Remove:
- `useData()` import and usage
- All `Math.random()` / `useMemo` mock data generation
- The synthetic data alert banner
- `ForecastData` / `ChartDataPoint` type usage from `../types`
- `useLoadingState` (React Query handles loading)

Add:
- Import `usePrediccionProductos`, `usePrediccionDetalle` from new hooks
- Import `useWarehouses` for the warehouse selector
- Import `useAuth` for role check and `useQueryClient` for invalidation
- Import `recalcularPredicciones` from service
- Import `formatCurrency` from utils, `format` from date-fns for `calculado_en`
- Import `toast` from sonner for error/success toasts
- Import `Progress` from ui/progress for confidence bar

Product dropdown: populated from `usePrediccionProductos`, shows skeleton while loading, empty state message when no products available

State: `selectedSku` (string, first product's SKU), `selectedWarehouse`, `horizon`

Prediction data: `usePrediccionDetalle(selectedSku, selectedWarehouse, parseInt(horizon))`

Chart data: built from `data.historial` + `data.predicciones`, mapping:
- `historial[].semana` → label (formatted dd/MM), `historial[].unidades` → `value` (historical line)
- `predicciones[].semana_inicio` → label, `predicciones[].unidades_pred` → `forecast` line
- `predicciones[].unidades_reales` → also plotted on `value` line when not null (overlap comparison)

Product card: uses `data.producto` fields (sku, nombre, marca, categoria, precio with formatCurrency, stock_actual). Shows red "Stock bajo" badge when `stock_actual <= stock_minimo`.

Metrics card: `data.metricas.mae`, `data.metricas.mape` (show "Sin datos suficientes" if null), `metricas.semanas_data`, `calculado_en` formatted in Spanish (e.g., "domingo 9 de marzo, 3:00 AM")

Trend section: new card below metrics showing `predicciones[0].tendencia` indicator (green/red/yellow circle + text) and `predicciones[0].confianza` as a `<Progress>` bar (0-100) with tooltip

`sin_datos` state: when `data.sin_datos === true`, show friendly empty state instead of chart

Recalculate button (top-right, replaces synthetic data indicator): only rendered when `currentUser.role === 'admin'`, calls `recalcularPredicciones`, shows toast, disables for 30s via `useState` + `setTimeout`

Error handling: React Query `isError` → toast "Error al cargar la predicción. Intenta de nuevo."

Loading: skeletons for cards + ChartSkeleton for chart, driven by React Query `isLoading`

### Summary

| File | Action |
|------|--------|
| `src/services/prediccionService.ts` | Create — API calls + types |
| `src/hooks/usePrediccion.ts` | Create — React Query hooks |
| `src/pages/PrediccionPage.tsx` | Rewrite — real data, new sections, remove mocks |

