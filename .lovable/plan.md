

## Connect ComprasPage to Real Backend + Verify PrediccionPage

### Overview

Replace all mock/synthetic data in ComprasPage with real API calls, add priority filter cards, editable quantities, row selection, and a pre-order confirmation modal. Also verify PrediccionPage has no issues.

### PrediccionPage Verification

Reviewed the code — no errors found. The data flow, chart mapping, trend section, and recalculate button all look correct. One minor note: the `selectedSku` won't reset when switching warehouses if the current product doesn't exist in the new warehouse's product list, but React Query will simply return empty data, which is handled gracefully.

### Files to Create

**1. `src/services/compraService.ts`** — Types + API calls
- Types: `CompraSugeridaItem`, `CompraSugeridaResumen`, `CompraSugeridaResponse`, `PreOrdenItem`, `PreOrdenBody`, `PreOrdenResponse`
- `fetchCompraSugerida(token, { sucursal_id?, prioridad?, page?, limit? })` → GET `/api/v1/compras/sugerida`
- `crearPreOrden(token, body)` → POST `/api/v1/compras/pre-orden`
- `recalcularCompras(token)` → POST `/api/v1/compras/recalcular`

**2. `src/hooks/useCompraSugerida.ts`** — React Query hook
- `useCompraSugerida(sucursalId?, prioridad?)` wrapping `fetchCompraSugerida`
- Uses `useAuth()` for token, 5min staleTime, retry 2

### Files to Modify

**3. `src/pages/ComprasPage.tsx`** — Full rewrite

**Remove:**
- `useData()` import and all mock data generation (`Math.random`, `useMemo` for `purchaseSuggestions`)
- `useProductCache`, `useLoadingState` imports
- `PurchaseSuggestion` type from `../types`
- The "simulación" Alert banner
- The "Configuración de Cálculo" card (leadTime, safetyStock, horizonte — backend handles this now)

**Add:**
- Import `useCompraSugerida` hook, `crearPreOrden`, `recalcularCompras` from services
- Import `useAuth` for token + role check
- Import `useWarehouses` for warehouse selector
- Import `Checkbox` from ui/checkbox
- Import `Dialog` components for pre-order confirmation modal
- Import `Progress` for coverage bar
- Import `formatCurrency` from formatters
- Import `format` from date-fns + es locale
- Import `toast` from sonner

**State:**
- `selectedWarehouse` (from outlet context)
- `prioridadFilter`: `'urgente' | 'normal' | 'opcional' | null` — toggle filter via clickable summary cards
- `selectedSkus`: `Set<string>` — tracks which rows are checked
- `cantidades`: `Record<string, number>` — editable quantities per SKU, initialized from `cantidad_sugerida`
- `preOrderOpen`: boolean — modal visibility
- `preOrderNotas`: string — notes field in modal
- `recalculating`: boolean — 30s cooldown

**Summary Cards (3 clickable KPI cards above table):**
- 🔴 Urgente: `resumen.urgente` products — click toggles `prioridadFilter = 'urgente'`
- 🟡 Normal: `resumen.normal` products — click toggles `prioridadFilter = 'normal'`
- 🟢 Opcional: `resumen.opcional` products — click toggles `prioridadFilter = 'opcional'`
- Active card gets a ring/border highlight; clicking again clears filter

**Last updated text:**
- Below title: "Última actualización: {items[0].calculado_en formatted}" or "Sin datos aún"

**Table columns (using ResponsiveTable):**
1. Checkbox — `<Checkbox>` controlling `selectedSkus`
2. SKU — `item.sku` in mono font
3. Producto — `item.nombre` + `item.marca` subtitle
4. Stock actual — `item.stock_actual` / `item.stock_minimo`
5. Cubre (días) — `item.dias_cobertura` with 1 decimal + `<Progress>` bar (red < 7, yellow < 14, green >= 14)
6. Sugerir pedir — `item.cantidad_sugerida`
7. Precio unitario — `formatCurrency(item.precio)`
8. Total sugerido — `formatCurrency(cantidades[sku] * item.precio)`
9. Prioridad — Badge: 🔴 Urgente / 🟡 Normal / 🟢 Opcional
10. Cantidad a pedir — `<Input type="number">` editable, pre-populated with `cantidad_sugerida`, min 0, updates `cantidades` state

**Initialize `cantidades`:** `useEffect` on data change, sets each SKU's quantity to `cantidad_sugerida`

**Client-side filter:** If `prioridadFilter` is set, filter displayed items by that priority (data already fetched)

**"Generar Pre-orden" button:**
- Disabled if `selectedSkus.size === 0`
- Opens confirmation modal showing selected items with edited quantities + total in pesos
- Modal has optional "Notas" textarea
- Confirm calls `crearPreOrden` with selected items using `cantidades` values
- Success: toast + close modal + clear selection
- Error: toast

**"Actualizar sugerencias" button (admin only):**
- Top-right corner, calls `recalcularCompras`, toast, 30s cooldown

**Empty state:** "No hay productos que necesiten reabastecimiento en este momento. El sistema recalcula cada lunes."

**Loading:** `TableSkeleton` + `Skeleton` cards driven by React Query `isLoading`

**Error:** React Query `isError` → toast

### Summary

| File | Action |
|------|--------|
| `src/services/compraService.ts` | Create — API calls + types |
| `src/hooks/useCompraSugerida.ts` | Create — React Query hook |
| `src/pages/ComprasPage.tsx` | Rewrite — real data, priority filters, editable quantities, pre-order modal |

