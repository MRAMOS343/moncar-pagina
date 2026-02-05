

# Plan: Corregir Actualización de KPIs en Dashboard

## Problema Identificado

Los KPIs del Dashboard (Ventas Totales, Transacciones, etc.) no se actualizan correctamente debido a problemas con el cache de React Query y la invalidación de queries.

## Causas Raíz

| Causa | Impacto |
|-------|---------|
| `staleTime: 5 min` muy alto | Los datos se consideran "frescos" por 5 minutos aunque cambien los filtros |
| `keepPreviousData` | Muestra datos antiguos mientras carga, pero si la carga falla, se quedan los viejos |
| QueryKey no incluye todos los parámetros | Cambios en filtros pueden no disparar refetch |

## Solución Propuesta

### 1. Reducir staleTime para KPIs en tiempo real

```typescript
// useDashboardSales.ts - Cambiar configuración
staleTime: 0,                    // Era: 5 * 60 * 1000
placeholderData: undefined,      // Era: keepPreviousData
refetchOnMount: 'always',        // Mantener
```

### 2. Forzar refetch cuando cambia la sucursal

Agregar un `useEffect` en DashboardPage para invalidar la query cuando cambie `currentWarehouse`:

```typescript
const queryClient = useQueryClient();

useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ["dashboard-sales"] });
}, [currentWarehouse, queryClient]);
```

### 3. Agregar timestamp a queryKey para forzar refresh

```typescript
// Opción más robusta: incluir "versión" en la queryKey
queryKey: ["dashboard-sales", params.from, params.sucursal_id, Date.now()],
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useDashboardSales.ts` | Reducir staleTime a 0, quitar keepPreviousData |
| `src/pages/DashboardPage.tsx` | Agregar invalidación de query al cambiar sucursal |

## Cambios Específicos

### `src/hooks/useDashboardSales.ts`

```typescript
// Líneas 74-79 - Antes:
staleTime: 5 * 60 * 1000,
gcTime: 10 * 60 * 1000,
placeholderData: keepPreviousData,
refetchOnMount: 'always',
refetchOnWindowFocus: true,

// Después:
staleTime: 0,                     // Siempre considerados "stale"
gcTime: 5 * 60 * 1000,           // Mantener en cache menos tiempo
placeholderData: undefined,       // No mostrar datos antiguos
refetchOnMount: 'always',
refetchOnWindowFocus: true,
refetchInterval: false,           // No polling automático
```

### `src/pages/DashboardPage.tsx`

Agregar al inicio del componente:

```typescript
import { useQueryClient } from "@tanstack/react-query";

// Dentro del componente:
const queryClient = useQueryClient();

// Invalidar cache cuando cambia la sucursal
useEffect(() => {
  queryClient.invalidateQueries({ 
    queryKey: ["dashboard-sales"],
    exact: false 
  });
}, [currentWarehouse, queryClient]);
```

## Resultado Esperado

| Acción | Antes | Después |
|--------|-------|---------|
| Cambiar sucursal | Muestra datos antiguos por 5 min | Refetch inmediato |
| Entrar a Dashboard | Usa cache si existe | Siempre obtiene datos frescos |
| Click "Actualizar" | Funciona | Sigue funcionando |

## Alternativa si el problema persiste

Si después de estos cambios sigue mostrando datos incorrectos, el problema podría estar en:

1. **El selector de sucursal** no está actualizando `currentWarehouse` correctamente
2. **La API está devolviendo datos cacheados** del lado del servidor
3. **El token de autenticación** tiene permisos limitados a cierta sucursal

Para diagnosticar esto, agregamos un log temporal:

```typescript
console.log('[Dashboard] Params:', { 
  currentWarehouse, 
  from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  itemsCount: salesData.length,
  totalKPI: kpisGlobales[0]?.value 
});
```

