

# Plan: Agregar búsqueda por `notes` en Cotizaciones

## Cambio

En `src/components/cotizaciones/CotizacionForm.tsx`, línea 35, agregar `p.notes` al string de búsqueda client-side:

```typescript
const target = `${p.sku} ${p.descrip ?? ''} ${p.marca ?? ''} ${p.notes ?? ''}`.toLowerCase();
```

El endpoint `GET /products?q=...` ya se usa con `limit: 50`. El campo `notes` ya existe en `ApiProduct`. Solo falta incluirlo en el filtro client-side, igual que lo hace inventario.

Un cambio de una línea.

