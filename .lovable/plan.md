
# Plan: Eliminar Mock Data de Totales Globales en Inventario

## Problema Actual

La sección "Totales Globales" del inventario actualmente usa datos mock:

```text
┌─────────────────────────────────────────────────────────────┐
│  InventarioPage.tsx                                         │
│  ┌─────────────────────┐     ┌─────────────────────────────┐│
│  │ globalTotals useMemo│────▶│ DataContext (mockData.ts)   ││
│  │ - inventory         │     │ - mockInventory             ││
│  │ - getProductById    │     │ - mockProducts              ││
│  └─────────────────────┘     └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

Los valores "Valor Total Global", "Productos Únicos", "Total de Unidades" y el desglose por sucursal vienen de datos ficticios.

## Solución Propuesta

Crear un hook dedicado `useInventarioGlobal` que obtenga datos reales de la API `/inventario` y calcule los totales por almacén.

```text
┌─────────────────────────────────────────────────────────────┐
│  Nueva Arquitectura                                         │
│  ┌─────────────────────┐     ┌─────────────────────────────┐│
│  │ useInventarioGlobal │────▶│ API /inventario             ││
│  │ - Carga paginada    │     │ + /products (para precios)  ││
│  │ - Agrupa por almacén│     │ + /warehouses (para nombres)││
│  └─────────────────────┘     └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Cambios a Realizar

### 1. Crear hook `useInventarioGlobal.ts`

```typescript
// src/hooks/useInventarioGlobal.ts
interface InventarioGlobalResult {
  totalStockValue: number;      // Suma de (existencia * precio) por producto
  uniqueProducts: number;       // SKUs únicos con stock
  totalItems: number;           // Suma de existencias
  byWarehouse: Record<string, {
    productos: number;
    unidades: number;
    valor: number;
  }>;
  warehouseCount: number;
  isLoading: boolean;
  error: Error | null;
}
```

El hook:
- Carga inventario global desde `/inventario` (sin filtro de SKU)
- Carga lista de precios desde `useProductosKPIs` (ya existente, tiene los productos)
- Carga sucursales desde `useSucursales` (ya existente)
- Calcula agregados por almacén

### 2. Modificar `InventarioPage.tsx`

| Antes | Después |
|-------|---------|
| `const { inventory, getProductById } = useData()` | Remover uso de `inventory` y `getProductById` |
| `useMemo(...)` para `globalTotals` | `useInventarioGlobal()` |
| KPIs con `change: 8.3` hardcoded | Sin cambios porcentuales (no tenemos histórico) |

### 3. Estructura del hook

```typescript
export function useInventarioGlobal() {
  // 1. Cargar todas las existencias (hasta 10,000 items)
  // 2. Cargar todos los productos para tener precios
  // 3. Cargar sucursales para nombres legibles
  
  // Agregar por almacén:
  // - Contar SKUs únicos por almacén
  // - Sumar existencias por almacén
  // - Calcular valor = existencia * precio1 del producto
  
  return { ... };
}
```

## Limitaciones Conocidas

- **Rendimiento**: La API `/inventario` no soporta agregaciones directas. Cargaremos hasta ~10,000 registros en el cliente para calcular totales.
- **Paginación**: Usaremos el mismo patrón de `useProductosKPIs` (múltiples páginas con cursor).
- **Sin cambios porcentuales**: Los KPIs mostrarán valores sin el indicador de cambio (no tenemos datos históricos).

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/useInventarioGlobal.ts` | **Crear** - Hook para cargar y agregar inventario real |
| `src/pages/InventarioPage.tsx` | **Modificar** - Usar nuevo hook, eliminar dependencia de DataContext para globales |

## Resultado Esperado

La pestaña "Totales Globales" mostrará:
- Datos reales del sistema de inventario
- Desglose por sucursal con nombres correctos (moncar, monar, etc.)
- Estados de carga mientras se obtienen los datos
- Sin valores ficticios de cambio porcentual
