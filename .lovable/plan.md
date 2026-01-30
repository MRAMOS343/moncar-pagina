
# Plan: Usar `usu_fecha` y `usu_hora` en Toda la Información de Ventas

## Resumen

Estandarizar el uso de `usu_fecha` y `usu_hora` (fecha/hora de captura real) en lugar de `fecha_emision` en todas las páginas y componentes que muestran información de ventas.

## Análisis de Uso Actual

| Ubicación | Campo Actual | Cambio Necesario |
|-----------|--------------|------------------|
| `tableColumns.tsx` (tabla ventas) | `usu_fecha` | Ya está correcto |
| `VentasPage.tsx` (gráfico tendencia) | `fecha_emision` | Cambiar a `usu_fecha` |
| `VentasPage.tsx` (mobile card) | `usu_fecha` + `usu_hora` | Ya está correcto |
| `DashboardPage.tsx` (ventas recientes) | `fecha_emision` | Cambiar a `usu_fecha` + `usu_hora` |
| `dashboardKpiService.ts` (tendencia) | `fecha_emision` | Cambiar a `usu_fecha` |
| `dashboardKpiService.ts` (recent sales sort) | `fecha_emision` | Cambiar a `usu_fecha` |
| `SaleDetailModal.tsx` | `fecha_emision` | Cambiar a `usu_fecha` + `usu_hora` |
| `types/sales.ts` | `string` | Cambiar a `string \| null` |

## Archivos a Modificar

| Archivo | Descripción del Cambio |
|---------|------------------------|
| `src/types/sales.ts` | Actualizar tipos: `usu_fecha: string \| null`, `usu_hora: string \| null` |
| `src/services/dashboardKpiService.ts` | Usar `usu_fecha` en `calculateTrend` y `getRecentSales` |
| `src/pages/VentasPage.tsx` | Usar `usu_fecha` en generación de gráfico de tendencia |
| `src/pages/DashboardPage.tsx` | Usar `usu_fecha` + `usu_hora` en ventas recientes |
| `src/components/modals/SaleDetailModal.tsx` | Usar `usu_fecha` + `usu_hora` en header |

## Detalles Técnicos

### 1. Actualizar tipos en `src/types/sales.ts`

```typescript
// Líneas 32-33 - Cambiar de string a string | null
export interface SaleListItem {
  // ... otros campos ...
  usu_fecha: string | null;  // Era: string
  usu_hora: string | null;   // Era: string
}
```

### 2. Actualizar `src/services/dashboardKpiService.ts`

**En `calculateTrend` (línea 69):**
```typescript
// Antes:
const fechaVenta = venta.fecha_emision.split('T')[0];

// Después:
const fechaVenta = venta.usu_fecha?.split('T')[0];
if (!fechaVenta) return false;
```

**En `getRecentSales` (línea 124):**
```typescript
// Antes:
.sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())

// Después:
.sort((a, b) => {
  const dateA = a.usu_fecha ? new Date(a.usu_fecha).getTime() : 0;
  const dateB = b.usu_fecha ? new Date(b.usu_fecha).getTime() : 0;
  return dateB - dateA;
})
```

### 3. Actualizar `src/pages/VentasPage.tsx`

**En generación de gráfico (línea 164):**
```typescript
// Antes:
const day = format(new Date(sale.fecha_emision), 'yyyy-MM-dd');

// Después:
if (!sale.usu_fecha) return; // Skip sales without date
const day = sale.usu_fecha.split('T')[0];
```

### 4. Actualizar `src/pages/DashboardPage.tsx`

**En ventas recientes (línea 338):**
```typescript
// Antes:
{getWarehouseName(venta.sucursal_id)} • {new Date(venta.fecha_emision).toLocaleDateString('es-MX')}

// Después:
{getWarehouseName(venta.sucursal_id)} • {
  venta.usu_fecha 
    ? new Date(venta.usu_fecha).toLocaleDateString('es-MX') 
    : '---'
} {venta.usu_hora || ''}
```

### 5. Actualizar `src/components/modals/SaleDetailModal.tsx`

**En header de fecha (línea 85-88):**
```typescript
// Antes:
<span className="font-medium">
  {safeFormatDate(data.venta.fecha_emision)}
</span>

// Después - Combinar usu_fecha + usu_hora:
<span className="font-medium">
  {data.venta.usu_fecha 
    ? `${new Date(data.venta.usu_fecha).toLocaleDateString('es-MX')} ${data.venta.usu_hora || ''}`
    : '---'}
</span>
```

## Resultado Visual

Antes vs Después:

| Componente | Antes | Después |
|------------|-------|---------|
| Tabla Ventas | 30-01-26 | 30-01-26 (ya usaba usu_fecha) |
| Gráfico Tendencia | Basado en fecha_emision | Basado en usu_fecha |
| Modal Detalle | 30/01/2026 | 30/01/2026 13:18:50 |
| Ventas Recientes (Dashboard) | 30/01/2026 | 30/01/2026 13:18:50 |

## Beneficios

1. **Consistencia**: Todos los lugares muestran la misma fecha/hora de captura
2. **Precisión**: `usu_fecha` + `usu_hora` reflejan cuándo se registró la venta en el sistema
3. **Robustez**: Manejo de valores `null` para evitar errores
