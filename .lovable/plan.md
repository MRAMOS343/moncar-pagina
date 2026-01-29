
# Plan: Mostrar Precio Total (Precio + Impuesto) en Rojo - Vista Lista y Galería

## Resumen

Modificar **ambas vistas** (lista/tabla y galería) en la página de inventario para que muestren el **precio total** (precio base + impuesto) en color **rojo**, consistente con el cálculo que se muestra al abrir la ficha técnica del producto.

## Problema Actual

- Las tarjetas de la galería y la tabla solo muestran el `precio1` (precio base) sin incluir el impuesto
- El estilo actual usa `text-primary` (azul) en lugar de rojo
- Hay inconsistencia con el modal de detalle que sí muestra el desglose completo

## Resultado Visual Esperado

```text
Vista Tabla - Antes:              Vista Tabla - Después:
┌───────┬──────────┐              ┌───────┬──────────────┐
│ SKU   │ Precio   │              │ SKU   │ Precio c/IVA │
├───────┼──────────┤              ├───────┼──────────────┤
│ A001  │ $100.00  │   ──────>    │ A001  │ $116.00 ✗    │
│ A002  │ $200.00  │              │ A002  │ $232.00 ✗    │
└───────┴──────────┘              └───────┴──────────────┘
                                          (rojo = precio + IVA)

Vista Galería - Antes:            Vista Galería - Después:
┌──────────────────┐              ┌──────────────────┐
│  [Imagen]        │              │  [Imagen]        │
│  Nombre Producto │              │  Nombre Producto │
│  Marca • Línea   │              │  Marca • Línea   │
│  $100.00 (azul)  │   ──────>    │  $116.00 (rojo)  │
└──────────────────┘              └──────────────────┘
                                   (precio + 16% IVA)
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/InventarioPage.tsx` | Agregar `impuesto` al interface y mapeo, actualizar columnas de tabla y renderizado de galería |

## Detalles Técnicos

### 1. Actualizar el interface `ProductTableItem` (línea 38-48)

Agregar el campo `impuesto` para que esté disponible tanto en la tabla como en la galería:

```typescript
interface ProductTableItem {
  sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number | null;
  impuesto: number | null;  // <- NUEVO
  unidad: string;
  minimo: number | null;
  maximo: number | null;
  notes: string | null;
}
```

### 2. Actualizar la función de mapeo (línea 50-62)

Incluir el campo impuesto desde la API:

```typescript
function mapApiProductToTableItem(p: ApiProduct): ProductTableItem {
  return {
    // ...campos existentes...
    precio: p.precio1,
    impuesto: p.impuesto,  // <- NUEVO
    // ...resto...
  };
}
```

### 3. Crear función helper para calcular precio total

Reutilizar la misma lógica del modal de detalle para calcular el precio con impuesto:

```typescript
// Helper para calcular precio total (precio + IVA)
function calcularPrecioConImpuesto(precio: number | null, impuesto: number | null): number | null {
  if (precio == null) return null;
  const base = precio;
  let rate = 0;
  if (impuesto != null) {
    // Normalizar: si es > 1 asumimos que viene como porcentaje (ej: 16)
    rate = impuesto > 1 ? impuesto / 100 : impuesto;
  }
  return base + (base * rate);
}
```

### 4. Actualizar columnas de la tabla (líneas 163-169)

Cambiar el renderizado de la columna "Precio" para mostrar el total con impuesto en rojo:

```typescript
{
  key: 'precio' as const,
  header: 'Precio c/IVA',  // <- Actualizar encabezado
  sortable: true,
  render: (value: number | null | undefined, row: ProductTableItem) => {
    const total = calcularPrecioConImpuesto(row.precio, row.impuesto);
    return total != null 
      ? <span className="text-destructive font-semibold">
          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      : '-';
  },
},
```

### 5. Actualizar renderizado de la galería (líneas 559-563)

Cambiar de `text-primary` a `text-destructive` y calcular el total:

```typescript
<p className="font-bold text-destructive">
  {(() => {
    const total = calcularPrecioConImpuesto(product.precio, product.impuesto);
    return total != null 
      ? `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
      : '-';
  })()}
</p>
```

## Lógica de Cálculo del Impuesto

La lógica de normalización es consistente con el modal de detalle:

| Valor de `impuesto` | Interpretación | Ejemplo |
|---------------------|----------------|---------|
| `null` | Sin IVA | $100 → $100.00 |
| `0.16` | 16% (ya normalizado) | $100 → $116.00 |
| `16` | 16% (como entero) | $100 → $116.00 |

## Consideraciones

- El color `text-destructive` es el rojo del sistema de diseño de shadcn/ui
- El encabezado de la columna cambia a "Precio c/IVA" para claridad
- Si el producto no tiene impuesto, se muestra solo el precio base
- Si el precio es `null`, se muestra un guion `-`
- El ordenamiento de la tabla seguirá funcionando por el precio base (mantenemos `key: 'precio'`)
