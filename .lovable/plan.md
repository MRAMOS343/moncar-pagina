
# Plan: Corrección de KPIs en Página de Ventas

## Problema
Los KPIs de la página de ventas muestran información incorrecta debido a:
1. Incluir ventas canceladas en los totales
2. Cálculo inconsistente del ticket promedio
3. Solo usar la primera página de datos (20 ventas)

## Solución

### Cambios en `src/pages/VentasPage.tsx`

**Corregir el cálculo de KPIs (líneas 112-140):**

```typescript
// ANTES (incorrecto):
const totalVentas = salesData.reduce((sum, sale) => sum + toNumber(sale.total), 0);
const ventasActivas = salesData.filter(s => !s.cancelada);
const avgTicket = totalVentas / (ventasActivas.length || 1);

// DESPUÉS (correcto):
const ventasActivas = salesData.filter(s => !s.cancelada);
const totalVentas = ventasActivas.reduce((sum, sale) => sum + toNumber(sale.total), 0);
const avgTicket = ventasActivas.length > 0 ? totalVentas / ventasActivas.length : 0;
```

**Actualizar los valores de KPIs:**
- **Ventas Totales**: Usar `totalVentas` (calculado solo de ventas activas)
- **Ticket Promedio**: Usar `avgTicket` (ahora consistente)
- **Transacciones**: Usar `ventasActivas.length` en lugar de `salesData.length`

### Cambios en `src/hooks/useSales.ts`

**Aumentar el límite por defecto para mejor precisión:**

```typescript
// ANTES:
limit: params.limit ?? 20,

// DESPUÉS:
limit: params.limit ?? 100,
```

Esto reduce la cantidad de páginas necesarias para obtener datos representativos.

---

## Resumen de Cambios

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/pages/VentasPage.tsx` | 113-139 | Filtrar ventas activas ANTES de calcular totales |
| `src/hooks/useSales.ts` | 19 | Aumentar límite de 20 a 100 |

## Resultado Esperado
- **Ventas Totales**: Solo sumará ventas completadas (no canceladas)
- **Ticket Promedio**: Dividirá el total correcto entre el número de transacciones activas
- **Transacciones**: Mostrará solo el conteo de ventas activas
- Datos más completos al cargar más ventas por página
