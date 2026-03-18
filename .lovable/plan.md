

# Fix: Doble IVA en Cotizaciones

## Problema

El precio unitario ya incluye IVA (`calcPrecioConIva` calcula `precio1 * (1 + impuesto)`), pero luego los totales aplican otro 16% encima:

```
subtotal = suma de totales (ya con IVA)
iva = subtotal * 0.16        ← segundo IVA
total = subtotal + iva        ← precio inflado
```

## Solución (100% frontend)

Cambiar `CotizacionForm.tsx` para guardar el **precio base sin IVA** como `precioUnitario`. El IVA se calcula una sola vez al final sobre el subtotal.

### Cambios en `CotizacionForm.tsx`:

1. **`addProduct`**: Usar `product.precio1` (sin IVA) como `precioUnitario` en vez de `calcPrecioConIva(product)`.

2. **Dropdown badge**: Seguir mostrando el precio con IVA en el resultado de búsqueda (para referencia), pero almacenar el base.

3. **Totales**: Ya están correctos (`subtotal` + `iva 16%` + `total`), solo necesitan operar sobre precios base.

```text
Antes (doble IVA):
  precioUnitario = precio1 * 1.16  →  subtotal ya con IVA
  + 16% IVA otra vez = ~34.56% de impuesto real

Después (correcto):
  precioUnitario = precio1           →  subtotal sin IVA
  + 16% IVA = exactamente 16%
```

Un cambio de ~2 líneas en la función `addProduct`.

