

# Plan: Corregir Formato de Precios en Modal de Producto

## Problema Identificado

En la imagen se ve que el Total muestra **"$50.000.08 MXN"** cuando debería mostrar **"$50,000.08 MXN"** (usando coma como separador de miles).

**Causa:** `toLocaleString('es-MX')` puede comportarse de forma inconsistente entre navegadores, mezclando separadores de punto y coma incorrectamente.

## Solución

Usar la función `formatCurrency` que ya existe en `src/utils/formatters.ts` y que usa `Intl.NumberFormat` con configuración de moneda MXN que garantiza formato consistente.

## Cambios Requeridos

### Archivo: `src/components/inventory/ProductDetailModal.tsx`

**Cambio 1: Importar `formatCurrency` desde formatters**

```typescript
// Línea 27 - agregar formatCurrency al import existente
import { formatQuantity, formatCurrency } from '@/utils/formatters';
```

**Cambio 2: Usar `formatCurrency` en lugar de `toLocaleString` (líneas 285, 290, 296)**

```tsx
// ANTES (líneas 285, 290, 296)
${priceInfo.base.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN

// DESPUÉS
{formatCurrency(priceInfo.base)}

// Aplicar a los 3 lugares:
// - Precio (línea 285)
// - IVA (línea 290) 
// - Total (línea 296)
```

## Resultado Esperado

| Antes | Después |
|-------|---------|
| $50.000.08 MXN | $50,000.08 MXN |
| $0.08 MXN | $0.08 MXN |
| $50.00 MXN | $50.00 MXN |

La función `formatCurrency` ya incluye el símbolo "$" y la moneda "MXN", así que el formato será consistente y correcto.

