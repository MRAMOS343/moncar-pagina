

# Plan: Redondear Precio Total a 1 Decimal

## Resumen

Modificar la función `calcularPrecioConImpuesto` para que el resultado se redondee a **1 decimal**.

## Cambio a Realizar

### Archivo: `src/pages/InventarioPage.tsx`

**Actualizar el return de la función (línea 91)**

Agregar `Math.round()` con multiplicador para redondear a 1 decimal:

```typescript
// Antes:
return base + (base * impuestoRate);

// Después:
const total = base + (base * impuestoRate);
return Math.round(total * 10) / 10;
```

## Ejemplo

| Cálculo | Antes | Después |
|---------|-------|---------|
| 86.21 + 13.7936 | 99.9936 | 100.0 |
| 50.00 + 8.00 | 58.00 | 58.0 |
| 123.45 + 19.752 | 143.202 | 143.2 |

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/InventarioPage.tsx` | Agregar redondeo a 1 decimal en `calcularPrecioConImpuesto` |

