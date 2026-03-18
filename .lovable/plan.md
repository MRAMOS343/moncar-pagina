

## Plan

### Issue 1: Mostrar SKU + notes en lugar de SKU + descrip

En línea 134 del dropdown, cambiar `p.descrip` por `p.notes`:

```tsx
<span className="ml-2 text-muted-foreground">{p.notes ?? p.descrip}</span>
```

Usaré `p.notes ?? p.descrip` como fallback por si algún producto no tiene notes.

### Issue 2: No aparecen todos los productos

El `limit` actual es 50, lo que significa que el backend solo devuelve 50 productos. Si el catálogo tiene más, muchos productos quedan fuera del filtro client-side. 

Solución: aumentar el `limit` a 200 (o más) y aprovechar el infinite query para cargar más páginas automáticamente. También se puede llamar `fetchNextPage` si hay más datos disponibles.

Cambios concretos en `CotizacionForm.tsx`:
1. Línea ~29: Cambiar `limit: 50` → `limit: 200`
2. Línea ~134: Cambiar `{p.descrip}` → `{p.notes ?? p.descrip}`
3. Agregar auto-fetch de páginas siguientes con `useEffect` que llame `fetchNextPage()` cuando `hasNextPage` sea true y el usuario esté buscando.

