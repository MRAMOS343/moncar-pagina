
# Plan: Corregir Cálculo de Total en Detalle de Producto

## Problema Identificado

En el modal de detalle del producto, el "Total" muestra $0.00 cuando debería mostrar la suma de Precio + IVA.

### Causa Raíz
Los valores `precio1` e `impuesto` vienen de la API como **strings** (ej: `"474.14"`, `"16.00"`), pero el código los trata como números sin convertirlos primero. Esto causa que las operaciones matemáticas fallen.

---

## Solución

Actualizar el cálculo de `priceInfo` en `ProductDetailModal.tsx` para:

1. Convertir explícitamente los valores a números usando `parseFloat()`
2. Normalizar el impuesto (manejar tanto formato `0.16` como `16`)
3. Calcular correctamente: `Total = Precio Base + (Precio * Tasa Impuesto)`

---

## Cambios a Implementar

**Archivo: `src/components/inventory/ProductDetailModal.tsx`**

Actualizar el `useMemo` de `priceInfo` (líneas 51-63):

```typescript
// Calcular precio con impuesto
const priceInfo = useMemo(() => {
  if (!product || product.precio1 == null) return null;
  
  // Convertir a número (la API puede devolver strings)
  const base = typeof product.precio1 === 'string' 
    ? parseFloat(product.precio1) 
    : product.precio1;
  
  // Manejar impuesto null y convertir a número
  let impuestoRate = 0;
  if (product.impuesto != null) {
    const rawImpuesto = typeof product.impuesto === 'string' 
      ? parseFloat(product.impuesto) 
      : product.impuesto;
    
    // Normalizar: si es > 1 (ej: 16), dividir entre 100 para obtener 0.16
    impuestoRate = rawImpuesto > 1 ? rawImpuesto / 100 : rawImpuesto;
  }
  
  // Calcular montos
  const impuestoAmount = base * impuestoRate;
  const total = base + impuestoAmount;
  
  return {
    base,
    impuesto: impuestoRate * 100, // Mostrar como porcentaje (16%)
    impuestoAmount,
    total,
  };
}, [product]);
```

---

## Resultado Esperado

| Campo | Antes | Después |
|-------|-------|---------|
| Precio | $474.14 | $474.14 |
| IVA (16%) | $75.86 | $75.86 |
| Total | $0.00 | $549.99 |

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/inventory/ProductDetailModal.tsx` | Corregir cálculo de priceInfo con conversión de tipos |
