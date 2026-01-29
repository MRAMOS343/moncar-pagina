

# Plan: Corregir Cálculo de Precio Total en Vista Lista y Galería

## Problema Identificado

La función `calcularPrecioConImpuesto` actual no convierte los valores de string a número como sí lo hace el modal de detalle. Los campos de la API (`precio1`, `impuesto`) pueden venir como **strings** desde Postgres (tipo `numeric`), lo que causa que el cálculo falle o dé resultados incorrectos.

## Ejemplo del Comportamiento Esperado

```text
┌─────────────────────────────────────────┐
│  Datos de la API:                       │
│  precio1 = 86.21 (o "86.21" como string)│
│  impuesto = 16 (o "16" como string)     │
├─────────────────────────────────────────┤
│  Cálculo:                               │
│  base = 86.21                           │
│  rate = 16 / 100 = 0.16                 │
│  impuestoAmount = 86.21 * 0.16 = 13.79  │
│  total = 86.21 + 13.79 = 100.00         │
├─────────────────────────────────────────┤
│  Mostrar en rojo: $100.00               │
└─────────────────────────────────────────┘
```

## Cambios a Realizar

### Archivo: `src/pages/InventarioPage.tsx`

**1. Actualizar la función helper para parsear strings (líneas 66-76)**

Replicar exactamente la lógica del modal de detalle que usa `parseFloat()`:

```typescript
// Helper para calcular precio total (precio + IVA)
function calcularPrecioConImpuesto(
  precio: number | string | null, 
  impuesto: number | string | null
): number | null {
  if (precio == null) return null;
  
  // Convertir a número (la API puede devolver strings)
  const base = typeof precio === 'string' ? parseFloat(precio) : precio;
  if (isNaN(base)) return null;
  
  // Manejar impuesto null y convertir a número
  let impuestoRate = 0;
  if (impuesto != null) {
    const rawImpuesto = typeof impuesto === 'string' 
      ? parseFloat(impuesto) 
      : impuesto;
    
    if (!isNaN(rawImpuesto)) {
      // Normalizar: si es > 1 (ej: 16), dividir entre 100 para obtener 0.16
      impuestoRate = rawImpuesto > 1 ? rawImpuesto / 100 : rawImpuesto;
    }
  }
  
  // Calcular total: base + (base * tasa)
  return base + (base * impuestoRate);
}
```

**2. Actualizar el interface para aceptar strings (líneas 43-44)**

```typescript
precio: number | string | null;
impuesto: number | string | null;
```

## Resultado Visual

| Vista | Antes | Después |
|-------|-------|---------|
| **Lista** | `$86.21` (solo precio base, sin IVA) | `$100.00` (precio + IVA, en rojo) |
| **Galería** | `$86.21` (solo precio base, azul) | `$100.00` (precio + IVA, en rojo) |

## Consistencia con el Modal

La nueva implementación será **idéntica** a la lógica del `ProductDetailModal.tsx` (líneas 52-81), garantizando que el precio mostrado en la lista/galería coincida con el "Total" que se ve al abrir la ficha técnica.

