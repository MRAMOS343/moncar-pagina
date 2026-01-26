

# Plan: Limitar Decimales en Modal de Detalle de Producto

## Problema Identificado

En el modal de detalle de producto, varios valores numéricos muestran demasiados decimales:
- **Mínimo/Máximo:** 10.0000 PZA, 100.0000 PZA (4 decimales)
- **Total precio:** $30.000 MXN (3 decimales, debería ser 2)
- **Total stock:** Puede mostrar decimales innecesarios

## Cambios Requeridos

### Archivo: `src/components/inventory/ProductDetailModal.tsx`

**Cambio 1: Crear helper para formatear cantidades (máximo 1 decimal)**

```typescript
// Función helper para formatear cantidades con máximo 1 decimal
const formatQuantity = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  // Si es entero, no mostrar decimales; si tiene decimales, máximo 1
  return num % 1 === 0 
    ? num.toLocaleString('es-MX') 
    : num.toLocaleString('es-MX', { maximumFractionDigits: 1 });
};
```

**Cambio 2: Aplicar a Mínimo/Máximo (líneas 201, 205)**

```tsx
// ANTES
<p className="font-semibold">{product.minimo ?? '-'} {product.unidad ?? 'PZA'}</p>
<p className="font-semibold">{product.maximo ?? '-'} {product.unidad ?? 'PZA'}</p>

// DESPUÉS
<p className="font-semibold">{formatQuantity(product.minimo)} {product.unidad ?? 'PZA'}</p>
<p className="font-semibold">{formatQuantity(product.maximo)} {product.unidad ?? 'PZA'}</p>
```

**Cambio 3: Aplicar a Total Stock (línea 153)**

```tsx
// ANTES
Total: {totalStock.toLocaleString()} {product.unidad ?? 'PZA'}

// DESPUÉS
Total: {formatQuantity(totalStock)} {product.unidad ?? 'PZA'}
```

**Cambio 4: Corregir precios con exactamente 2 decimales (líneas 284, 289, 295)**

```tsx
// ANTES
${priceInfo.base.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN

// DESPUÉS (agregar maximumFractionDigits: 2)
${priceInfo.base.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
```

**Cambio 5: Aplicar a Existencia en tabla (línea 181)**

```tsx
// ANTES
{parseFloat(String(inv.existencia)).toLocaleString()} {product.unidad ?? 'PZA'}

// DESPUÉS
{formatQuantity(inv.existencia)} {product.unidad ?? 'PZA'}
```

## Resumen de Cambios

| Ubicación | Antes | Después |
|-----------|-------|---------|
| Mínimo (línea 201) | 10.0000 PZA | 10 PZA |
| Máximo (línea 205) | 100.0000 PZA | 100 PZA |
| Total stock (línea 153) | Sin límite | Máx 1 decimal |
| Existencia tabla (línea 181) | Sin límite | Máx 1 decimal |
| Precios (líneas 284, 289, 295) | $30.000 | $30.00 |

## Resultado Esperado

- Cantidades enteras se muestran sin decimales (ej: "10 PZA")
- Cantidades fraccionarias muestran máximo 1 decimal (ej: "10.5 PZA")
- Precios siempre muestran exactamente 2 decimales (ej: "$30.00 MXN")

