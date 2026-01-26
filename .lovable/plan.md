
# Plan: Corrección de Bugs y Mejoras de Estabilidad

## Resumen Ejecutivo
Se han identificado 10 problemas potenciales en el código que van desde errores runtime hasta inconsistencias de datos y vulnerabilidades de parsing. Este plan propone correcciones ordenadas por prioridad.

---

## Bugs Críticos (Prioridad Alta)

### 1. Error Runtime "Component is not a function"
**Causa probable:** Los lazy-loaded charts pueden fallar si Recharts no exporta correctamente el componente.

**Archivo:** `src/components/charts/LazyLineChart.tsx`

**Solución:**
```typescript
// Agregar fallback más robusto
const RechartsLineChart = React.lazy(() => 
  import('recharts').then(module => {
    if (!module.LineChart) {
      throw new Error('LineChart not found in recharts module');
    }
    return { default: module.LineChart };
  }).catch(err => {
    console.error('Failed to load LineChart:', err);
    return { default: () => <div>Error loading chart</div> };
  })
);
```

### 2. Datos Truncados No Expuestos en Dashboard
**Archivo:** `src/hooks/useDashboardSales.ts`

**Solución:** Retornar objeto con metadata en lugar de solo array.

```typescript
// ANTES
return allItems;

// DESPUÉS
return {
  items: allItems,
  truncated,
  pageCount,
  totalFetched: allItems.length
};
```

**Cambio en DashboardPage.tsx:** Actualizar para usar la nueva estructura.

### 3. Parser de Pagos Vulnerable a NaN
**Archivo:** `src/hooks/useDashboardPaymentMethods.ts`

**Solución:**
```typescript
function parsePagosResumen(resumen: string | null | undefined): Record<string, number> {
  if (!resumen) return {};
  
  const result: Record<string, number> = {};
  resumen.split(',').forEach(part => {
    const [metodo, monto] = part.trim().split(':');
    if (metodo && monto) {
      const key = metodo.toLowerCase();
      const numMonto = parseFloat(monto);
      // Validar que no sea NaN antes de sumar
      if (!isNaN(numMonto)) {
        result[key] = (result[key] || 0) + numMonto;
      }
    }
  });
  return result;
}
```

---

## Bugs Moderados (Prioridad Media)

### 4. Redirección 401 con window.location
**Archivo:** `src/services/apiClient.ts`

**Problema:** Pérdida de estado de React y posibles bucles.

**Solución alternativa:** Usar un flag global en lugar de redirección forzada.

```typescript
// Crear un evento global que AuthContext escuche
if (res.status === 401) {
  localStorage.removeItem('moncar_token');
  localStorage.removeItem('moncar_user');
  
  // Disparar evento en lugar de redirección forzada
  window.dispatchEvent(new CustomEvent('auth:expired'));
  throw new ApiError('Sesión expirada', 401, data);
}
```

### 5. Validación de Fechas en SaleDetailModal
**Archivo:** `src/components/modals/SaleDetailModal.tsx`

**Solución:**
```typescript
// Crear helper de formateo seguro
const safeFormatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return '---';
  }
};
```

### 6. Ícono Faltante para KPI "Transacciones"
**Archivo:** `src/components/ui/kpi-card.tsx`

**Solución:**
```typescript
const getContextualIcon = () => {
  const iconClass = "w-5 h-5";
  if (data.label.includes("Ventas")) return <DollarSign className={iconClass} />;
  if (data.label.includes("Transacciones")) return <Receipt className={iconClass} />; // Agregar
  if (data.label.includes("Productos")) return <Package className={iconClass} />;
  if (data.label.includes("Ticket")) return <ShoppingCart className={iconClass} />;
  if (data.label.includes("Stock")) return <AlertTriangle className={iconClass} />;
  if (data.label.includes("Canceladas")) return <XCircle className={iconClass} />; // Agregar
  return null;
};
```

---

## Mejoras de Consistencia (Prioridad Baja)

### 7. Unificar Configuración de Cache
**Crear constante compartida:**

```typescript
// src/constants/queryConfig.ts
export const QUERY_CONFIG = {
  SALES_TABLE: { staleTime: 0, refetchOnMount: 'always' },
  SALES_KPI: { staleTime: 0, refetchOnMount: true },
  DASHBOARD: { staleTime: 5 * 60 * 1000 },
} as const;
```

### 8. Logging de Valores Nulos en toNumber
**Archivo:** `src/utils/formatters.ts`

```typescript
export function toNumber(value: string | number | undefined | null, fieldName?: string): number {
  if (value === undefined || value === null) {
    if (import.meta.env.DEV && fieldName) {
      console.warn(`[toNumber] Campo '${fieldName}' es nulo, usando 0`);
    }
    return 0;
  }
  // ...
}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/charts/LazyLineChart.tsx` | Agregar manejo de error en lazy import |
| `src/components/charts/LazyPieChart.tsx` | Agregar manejo de error en lazy import |
| `src/hooks/useDashboardSales.ts` | Retornar metadata de truncado |
| `src/hooks/useDashboardPaymentMethods.ts` | Validar NaN en parseFloat |
| `src/pages/DashboardPage.tsx` | Usar nueva estructura de datos con truncated |
| `src/services/apiClient.ts` | Cambiar redirección por evento |
| `src/contexts/AuthContext.tsx` | Escuchar evento auth:expired |
| `src/components/modals/SaleDetailModal.tsx` | Agregar formateo seguro de fechas |
| `src/components/ui/kpi-card.tsx` | Agregar íconos faltantes |
| `src/utils/formatters.ts` | Logging opcional de valores nulos |

---

## Orden de Implementación Sugerido

1. **Fase 1 (Crítico):** Lazy charts error handling + Parser NaN validation
2. **Fase 2 (Importante):** Dashboard truncated metadata + Fecha segura
3. **Fase 3 (Mejoras):** Íconos KPI + Evento auth:expired + Logging

---

## Sección Técnica

### Diagrama de Dependencias de Hooks de Ventas

```text
+------------------+     +-------------------+     +----------------------+
|   VentasPage     | --> |    useSales       | --> |   fetchSales (API)   |
+------------------+     +-------------------+     +----------------------+
        |                        |
        |                        v
        |                +-------------------+
        +--------------> |   useVentasKPIs   | (limite: 1000)
                         +-------------------+
                                |
                                v
                         +-------------------+
                         |   KPICard x 3     |
                         +-------------------+
```

### Notas sobre el Error Runtime

El error `Component is not a function` en `updateSimpleMemoComponent` sugiere que:
1. Un componente envuelto en `memo()` no es válido
2. O un lazy-load retornó algo que no es un componente

La solución propuesta agrega catch blocks a los lazy imports para diagnosticar mejor.
