
# Plan: Corrección del KPI de Transacciones

## Problemas Identificados

### Problema 1: Texto de truncado confuso
El mensaje "Basado en las últimas X transacciones" muestra `totalItems` (incluye canceladas) cuando el KPI de Transacciones solo cuenta ventas activas. Esto genera confusión.

### Problema 2: Warning de React refs
El componente `KPICard` usa `memo()` pero no implementa `forwardRef`, generando warnings y posibles problemas de renderizado.

### Problema 3: Posible cache stale
Aunque `staleTime: 0`, al cambiar período rápidamente podría mostrar datos del período anterior momentáneamente.

---

## Solución

### Cambio 1: Corregir texto de truncado
**Archivo:** `src/pages/VentasPage.tsx` (líneas 336-340)

Cambiar el mensaje para que sea coherente:
```tsx
// ANTES:
{kpisData?.truncated && (
  <p className="text-xs text-muted-foreground text-center -mt-2">
    * Basado en las últimas {kpisData.totalItems.toLocaleString()} transacciones del período
  </p>
)}

// DESPUÉS:
{kpisData?.truncated && (
  <p className="text-xs text-muted-foreground text-center -mt-2">
    * KPIs basados en {kpisData.transacciones.toLocaleString()} ventas activas de un total de {kpisData.totalItems.toLocaleString()} registros
  </p>
)}
```

### Cambio 2: Agregar forwardRef al KPICard
**Archivo:** `src/components/ui/kpi-card.tsx`

```tsx
// ANTES:
const KPICardComponent = ({ data, className }: KPICardProps) => { ... };
export const KPICard = memo(KPICardComponent);

// DESPUÉS:
import { memo, forwardRef } from "react";

const KPICardComponent = forwardRef<HTMLDivElement, KPICardProps>(
  ({ data, className }, ref) => {
    // ... mismo código interno
    return <div ref={ref} className={...}>...</div>;
  }
);

KPICardComponent.displayName = "KPICard";
export const KPICard = memo(KPICardComponent);
```

### Cambio 3: Forzar limpieza de datos al cambiar período
**Archivo:** `src/hooks/useVentasKPIs.ts`

Agregar `keepPreviousData: false` para evitar mostrar datos viejos:
```tsx
return useQuery<VentasKPIsResult>({
  queryKey: ["ventas-kpis", params.from, params.sucursal_id],
  queryFn: async () => { ... },
  staleTime: 0,
  enabled: !!token,
  placeholderData: undefined,  // No usar datos previos como placeholder
  refetchOnMount: true,
});
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/VentasPage.tsx` | Corregir texto de truncado para distinguir transacciones activas vs total |
| `src/components/ui/kpi-card.tsx` | Agregar forwardRef para eliminar warning de React |
| `src/hooks/useVentasKPIs.ts` | Agregar `placeholderData: undefined` y `refetchOnMount: true` |

---

## Resultado Esperado

1. El texto de truncado será claro: "KPIs basados en X ventas activas de Y registros totales"
2. No habrá warnings de React en la consola
3. Al cambiar período, los KPIs mostrarán loading en lugar de datos viejos mientras cargan los nuevos
