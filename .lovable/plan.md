
# Plan: Optimización de Carga de Gráficos

## Resumen del Problema
Los gráficos tardan en cargar porque:
1. Se hacen múltiples llamadas API secuenciales (hasta 7 páginas)
2. El hook de métodos de pago hace 1 llamada por cada venta (potencialmente cientos)
3. Los componentes de recharts se cargan todos de golpe

## Fase 1: Usar `pagos_resumen` en lugar de fetchear detalles
**Archivo:** `src/hooks/useDashboardPaymentMethods.ts`

Cambio principal: En lugar de hacer N llamadas a `/sales/{id}`, parsear el campo `pagos_resumen` que ya viene en el listado.

```text
Antes:
- Recibir lista de 500 ventas
- Hacer 500 llamadas GET /sales/{id} para obtener pagos
- Agregar resultados

Después:
- Recibir lista de 500 ventas (ya tienen pagos_resumen)
- Parsear "EFE:116.00,TRA:50.00" directamente
- Calcular totales sin llamadas adicionales
```

Esto elimina cientos de llamadas API y hace la carga casi instantánea.

---

## Fase 2: Reducir páginas en Dashboard
**Archivo:** `src/hooks/useDashboardSales.ts`

Cambios:
- Reducir `MAX_PAGES` de 20 a 5 para carga inicial
- Reducir `limit` de 1000 a 500 por página
- Mostrar indicador si los datos están truncados

Resultado esperado: Pasar de 7 llamadas secuenciales a máximo 5, con menos datos por llamada.

---

## Fase 3: Lazy Loading de Recharts
**Archivo:** `src/components/charts/LazyLineChart.tsx` y `LazyPieChart.tsx`

Implementar `React.lazy()` real con Suspense:

```text
Antes:
import { LineChart } from 'recharts';  // Se carga inmediatamente

Después:
const RechartsModule = React.lazy(() => import('recharts'));
// Solo se carga cuando se renderiza el gráfico
```

Beneficio: Reduce el bundle inicial y carga los gráficos bajo demanda.

---

## Fase 4: Optimizar Cache y Estados
**Archivos:** Hooks de dashboard

Cambios:
- Aumentar `staleTime` a 5 minutos en dashboard
- Agregar `placeholderData: keepPreviousData` para mostrar datos anteriores mientras carga
- Usar `gcTime` (garbage collection) más largo

---

## Fase 5: Memoización de Gráficos
**Archivos:** `DashboardPage.tsx`, `VentasPage.tsx`

Envolver los componentes de gráficos con `React.memo()` y memoizar las configuraciones de tooltip/axis para evitar re-renders innecesarios.

---

## Resumen de Impacto Esperado

| Área | Antes | Después |
|------|-------|---------|
| Llamadas API (métodos pago) | ~500 | 0 |
| Llamadas API (dashboard) | 7 secuenciales | 5 máx |
| Tiempo carga inicial | ~5-10s | ~1-2s |
| Bundle inicial | Todo recharts | Lazy loaded |

---

## Detalle Técnico: Parser de pagos_resumen

El campo `pagos_resumen` viene con formato `"EFE:116.00"` o `"EFE:100.00,TRA:50.00"`.

Función de parseo:
```typescript
function parsePagosResumen(resumen: string | null): Record<string, number> {
  if (!resumen) return {};
  
  const result: Record<string, number> = {};
  resumen.split(',').forEach(part => {
    const [metodo, monto] = part.split(':');
    if (metodo && monto) {
      result[metodo.toLowerCase()] = (result[metodo.toLowerCase()] || 0) + parseFloat(monto);
    }
  });
  return result;
}
```

---

## Orden de Implementación

1. Fase 1 (Mayor impacto) - Usar pagos_resumen
2. Fase 2 - Reducir páginas dashboard  
3. Fase 4 - Mejorar cache
4. Fase 3 - Lazy loading recharts
5. Fase 5 - Memoización

Fases 1-2 darán el mayor beneficio inmediato.
