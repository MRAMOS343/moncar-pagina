

# Cambios solicitados en Dashboard, Inventario y Ventas

## 1. Dashboard — Eliminar botones "Nueva Venta" y "Agregar Producto"

**Archivo:** `src/pages/DashboardPage.tsx` (líneas 212-219)

Eliminar los dos botones y sus handlers asociados (`handleNewSale`, `handleAddProduct`). También eliminar el import de `ProductModal` y el estado `productModalOpen` si ya no se usan en otro lugar, junto con el componente `<ProductModal>` al final del archivo.

## 2. Dashboard — Alertas del Sistema en español

**Archivo:** `src/pages/DashboardPage.tsx` (líneas 487-497)

Cambiar el badge `"Good"` por `"Normal"` o `"Bien"` en la alerta de actividad registrada (línea 496). Revisar que todos los demás textos ya estén en español (los demás ya lo están: "Ventas Canceladas", "Sin Ventas", etc.).

## 3. Inventario — Quitar botones "Importar CSV" y "Nuevo Producto"

**Archivo:** `src/pages/InventarioPage.tsx` (líneas 344-351)

Eliminar el botón "Importar CSV" y el botón "Nuevo Producto". También eliminar la función `handleImportCSV` (líneas 288-295) y `handleCreateProduct` si ya no se usa. Si `ProductModal` deja de ser usado, eliminar su import y estado.

## 4. Ventas — KPIs no cambian con 90 días

**Diagnóstico:** El hook `useVentasKPIs` usa `params.from` en el `queryKey`, que sí cambia con 90d. Sin embargo, el límite de 5000 items puede truncar los datos. Si con 30d ya se capturan 5000 ventas, 90d devolverá los mismos 5000 (las más recientes por cursor). 

**Solución:** Aumentar `MAX_PAGES` a 20 y `MAX_ITEMS` a 10000 en `useVentasKPIs.ts` para períodos largos. Alternativamente (más eficiente), usar el endpoint de Dashboard KPIs (`/api/v1/dashboard/kpis`) que calcula en backend sin límite. La solución más pragmática: aumentar los límites.

**Archivo:** `src/hooks/useVentasKPIs.ts` (líneas 7-9)
- `MAX_PAGES = 20`
- `MAX_ITEMS = 10000`

## 5. Ventas — Reemplazar "Filtros Adicionales" por toggle de canceladas

**Archivo:** `src/components/ventas/VentasFilters.tsx`

Simplificar: en vez de una Card con título "Filtros Adicionales", mostrar solo un toggle inline (Switch + label "Mostrar solo canceladas") junto al selector de período en `VentasPage.tsx`. Eliminar la Card/Accordion wrapper.

Cambiar la lógica: en vez de "incluir canceladas" (que las mezcla con las activas), hacer un toggle "Solo canceladas" que filtre exclusivamente las canceladas cuando está activo.

**Cambios en VentasPage.tsx:**
- Mover el Switch al área del selector de período (junto al Select de "Período")
- Renombrar la lógica: cuando el toggle está activo, pasar un filtro que solo muestre canceladas
- Eliminar el componente `<VentasFilters>` como sección separada

