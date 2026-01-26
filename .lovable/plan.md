
# Plan: Corregir KPIs de Ventas que Muestran Valores Menores a los Reales

## Problema Identificado

La versión actual muestra valores de KPIs incorrectos (menores a los reales) porque el hook `useVentasKPIs` tiene un **limite de 1,000 registros** (5 paginas x 200 items), mientras que para mostrar correctamente los 689 transacciones con $237,012.00 de la version anterior, el sistema necesita cargar mas datos.

**Datos correctos (version anterior):**
- Ventas Totales: $237,012.00
- Transacciones: 689
- Ticket Promedio: $343.99

**Causa raiz:** El hook `useVentasKPIs` esta configurado con:
- `MAX_PAGES = 5`
- `PAGE_SIZE = 200`
- **Total maximo: 1,000 registros**

Pero el hook del Dashboard (`useDashboardSales`) usa limites mas altos:
- `MAX_PAGES = 5`
- `PAGE_SIZE = 500`
- `MAX_ITEMS = 2,500`

## Solucion Propuesta

Aumentar los limites del hook `useVentasKPIs` para que cargue suficientes datos y sea consistente con el dashboard.

---

## Cambios Tecnicos

### Archivo: `src/hooks/useVentasKPIs.ts`

**Cambio 1: Aumentar limites de paginacion (lineas 7-8)**

```typescript
// ANTES
const MAX_PAGES = 5;
const PAGE_SIZE = 200;

// DESPUES
const MAX_PAGES = 10;
const PAGE_SIZE = 500;
```

Esto cambia el limite de **1,000 a 5,000 registros**, asegurando que periodos largos (30d, 90d) tengan datos completos.

**Cambio 2: Agregar limite de items como seguridad (despues de linea 8)**

```typescript
const MAX_ITEMS = 5000;
```

**Cambio 3: Agregar condicion de limite de items en el loop (linea 51)**

```typescript
// ANTES
} while (cursor && pageCount < MAX_PAGES);

// DESPUES
} while (cursor && pageCount < MAX_PAGES && allItems.length < MAX_ITEMS);
```

**Cambio 4: Actualizar comentario de documentacion (linea 23-26)**

```typescript
/**
 * Hook dedicado para calcular KPIs de ventas con multiples paginas.
 * Carga hasta 5000 ventas (10 paginas x 500) para tener datos precisos.
 */
```

---

## Resumen de Impacto

| Metrica | Antes | Despues |
|---------|-------|---------|
| MAX_PAGES | 5 | 10 |
| PAGE_SIZE | 200 | 500 |
| Maximo registros | 1,000 | 5,000 |
| Tiempo de carga estimado | Rapido | Ligeramente mas lento (2-3s adicionales) |

## Resultado Esperado

- Los KPIs mostraran los valores correctos: $237,012.00, 689 transacciones, $343.99 ticket promedio
- El indicador de truncado seguira funcionando si se exceden los 5,000 registros
- Consistencia entre la pagina de Ventas y el Dashboard
