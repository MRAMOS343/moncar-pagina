
# Plan: Implementar Cache Optimizado para Productos

## Resumen

Configurar un sistema de cache más agresivo para los productos, reduciendo drásticamente las llamadas a la API. Los 700+ productos solo se cargarán una vez y se mantendrán en cache por 10-15 minutos, con opciones de actualización manual.

## Problema Actual

- El `QueryClient` no tiene configuración global de cache
- El `staleTime` de productos es solo 2 minutos
- Cada vez que navegas a `/inventario`, si pasaron 2 minutos, se vuelve a llamar la API
- No hay `gcTime` configurado, por lo que los datos se eliminan después de 5 minutos de inactividad

## Solución Propuesta

### Cambios Visuales

```text
┌───────────────────────────────────────────────────────────────┐
│                     Inventario de Productos                   │
│  [🔄 Actualizar]  ← Botón para forzar refresh cuando necesites│
│                                                               │
│  📦 Última actualización: hace 3 minutos                      │
│  ✅ Datos en cache (sin llamada a API)                        │
└───────────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Configurar `QueryClient` con defaults globales de cache |
| `src/constants/queryConfig.ts` | Agregar configuración específica para `PRODUCTS` |
| `src/hooks/useProducts.ts` | Usar configuración centralizada con cache más agresivo |
| `src/pages/InventarioPage.tsx` | Agregar indicador visual y botón de refrescar |

## Detalles Técnicos

### 1. Configurar QueryClient con defaults globales

**Archivo:** `src/App.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos por defecto
      gcTime: 10 * 60 * 1000,   // Mantener en cache 10 minutos
      refetchOnWindowFocus: false, // Evitar refetch al cambiar de pestaña
      retry: 1, // Solo 1 reintento en errores
    },
  },
});
```

### 2. Agregar configuración de PRODUCTS al archivo centralizado

**Archivo:** `src/constants/queryConfig.ts`

```typescript
export const QUERY_CONFIG = {
  // ... configuraciones existentes ...

  // Catálogo de productos: cache agresivo (10 minutos)
  PRODUCTS: {
    staleTime: 10 * 60 * 1000, // 10 minutos frescos
    gcTime: 15 * 60 * 1000,    // Mantener en cache 15 minutos
    refetchOnMount: false,     // No refetch al montar si está fresh
  },
} as const;
```

### 3. Actualizar useProducts para usar la configuración centralizada

**Archivo:** `src/hooks/useProducts.ts`

```typescript
import { QUERY_CONFIG } from '@/constants/queryConfig';

export function useProducts(params: UseProductsParams = {}) {
  const { token } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ["products", stableParams],
    queryFn: ({ pageParam }) => fetchProducts(token!, { 
      ...stableParams, 
      cursor: pageParam,
    }),
    enabled: !!token && (params.enabled !== false),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    ...QUERY_CONFIG.PRODUCTS, // ← Usar configuración centralizada
  });

  // ... resto del código
}
```

### 4. Agregar botón de refrescar e indicador en InventarioPage

**Archivo:** `src/pages/InventarioPage.tsx`

Agregar al hook useProducts la capacidad de refetch:

```typescript
const { 
  products: apiProducts, 
  isLoading, 
  isFetchingNextPage, 
  hasNextPage, 
  fetchNextPage,
  refetch,        // ← Agregar
  dataUpdatedAt,  // ← Agregar para mostrar última actualización
  isFetching,     // ← Para indicador de carga
} = useProducts({ 
  q: debouncedSearchQuery,
  limit: 100,
});
```

Agregar botón de refrescar junto a los otros botones de acción:

```typescript
<Button 
  variant="outline" 
  size="sm"
  onClick={() => refetch()}
  disabled={isFetching}
>
  <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
  Actualizar
</Button>

{/* Indicador de última actualización */}
{dataUpdatedAt && (
  <span className="text-xs text-muted-foreground">
    Actualizado: {new Date(dataUpdatedAt).toLocaleTimeString('es-MX')}
  </span>
)}
```

## Beneficios del Cache

| Escenario | Antes | Después |
|-----------|-------|---------|
| Navegar entre páginas | API call cada 2 min | Sin API call por 10 min |
| Cambiar de pestaña del navegador | API call (refetch on focus) | Sin API call |
| Volver a Inventario después de 5 min | API call (datos eliminados) | Datos en cache por 15 min |
| Usuario necesita datos frescos | Esperar recarga automática | Botón "Actualizar" |

## Flujo del Cache

```text
Usuario abre Inventario
        ↓
¿Hay datos en cache y staleTime < 10min?
        ↓
   ┌────┴────┐
   SÍ        NO
   ↓          ↓
Mostrar    Llamar API
cache      700+ productos
   ↓          ↓
   └────┬────┘
        ↓
Usuario ve productos instantáneamente
        ↓
¿Necesita datos frescos?
        ↓
Click "Actualizar" → API call forzado
```

## Consideraciones

- Los datos se mantienen "frescos" por 10 minutos (sin mostrar loading)
- Los datos se mantienen en memoria por 15 minutos (incluso si el usuario navega a otra página)
- El botón "Actualizar" permite refrescar manualmente cuando sea necesario
- `refetchOnWindowFocus: false` evita llamadas innecesarias al cambiar de pestaña
- Las mutaciones (actualizar producto) seguirán invalidando el cache automáticamente
