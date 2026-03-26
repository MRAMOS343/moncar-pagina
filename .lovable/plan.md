

# Aumentar cantidad de productos por carga en Inventario

## Problema
Cada vez que se presiona "Cargar más productos", la API solo trae 100 items (`limit: 100`). Con un catálogo de 700+ productos, se necesitan 7+ clics para ver todo.

## Solución
Aumentar el `limit` de 100 a 500 en la llamada de `useProducts` dentro de `InventarioPage.tsx`. Esto reduce las cargas necesarias a 1-2 clics máximo.

## Cambio

### `src/pages/InventarioPage.tsx` (línea 123)
Cambiar `limit: 100` → `limit: 500`

```typescript
} = useProducts({ 
  q: debouncedSearchQuery,
  limit: 500,  // antes: 100
});
```

Solo se modifica una línea. El backend ya soporta límites mayores y el hook `useProducts` ya acepta el parámetro `limit`.

