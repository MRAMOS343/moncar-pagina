
# Plan: Agregar Cliente (datos_origen) al Modal de Detalle de Venta

## Resumen

Agregar el campo `datos_origen` en la sección de encabezado del modal de detalle de venta, mostrándolo como información del cliente.

## Ubicación en el Modal

```text
┌─────────────────────────────────────────────────────┐
│ Venta #110136                                    ✕  │
├─────────────────────────────────────────────────────┤
│ Fecha: 30/01/2026 13:47:04    Sucursal: moncar      │
│ Caja: ESTACION01              Cliente: [datos]  ←NEW│
├─────────────────────────────────────────────────────┤
```

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/modals/SaleDetailModal.tsx` | Agregar campo "Cliente" en el grid de encabezado |

## Detalles Técnicos

### Modificar `SaleDetailModal.tsx` (líneas 96-100)

Agregar un nuevo `<div>` después del campo "Caja":

```typescript
// Después de Caja (línea 99), agregar:
<div>
  <span className="text-muted-foreground">Cliente:</span>{" "}
  <span className="font-medium">{data.venta.datos_origen || 'Público general'}</span>
</div>
```

### Consideraciones

- El campo `datos_origen` ya existe en el tipo `SaleListItem` (y por extensión en `SaleDetail`)
- Si `datos_origen` es `null` o vacío, se muestra "Público general" como fallback
- Se mantiene el mismo estilo visual que los otros campos del encabezado (Fecha, Sucursal, Caja)
- El grid ya es de 2 columnas, así que el nuevo campo se alineará naturalmente

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Fecha, Sucursal, Caja (3 campos) | Fecha, Sucursal, Caja, Cliente (4 campos) |

El modal mostrará la información del cliente extraída de `datos_origen` de la API.
