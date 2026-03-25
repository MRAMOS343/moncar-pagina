

# Migrar Cotizaciones a API REST + mejoras

## Resumen
Migrar el módulo de cotizaciones de localStorage a endpoints REST del backend, agregar edición de precio por renglón con reset al original, y agregar funcionalidad de eliminar cotización.

## Cambios

### 1. Reemplazar `src/types/cotizaciones.ts`
- Agregar `precioOriginal` a `CotizacionItem`
- Eliminar `CotizacionCliente` interface (campos ahora directos en `Cotizacion`)
- Agregar `CreateCotizacionPayload` con formato backend (`lineas`, `impuesto`, `articulo`)

### 2. Reemplazar `src/services/cotizacionService.ts`
- Eliminar toda lógica localStorage
- Usar `apiRequest` para GET/POST/PATCH/DELETE contra `/api/v1/cotizaciones`
- Agregar `deleteCotizacion` y endpoint `/duplicar`

### 3. Reemplazar `src/hooks/useCotizaciones.ts`
- `useCotizaciones` ahora usa `staleTime: 30s` (no 0)
- `useCreateCotizacion` acepta `CreateCotizacionPayload`
- Agregar `useDeleteCotizacion`

### 4. Reemplazar `src/components/cotizaciones/ItemsTable.tsx`
- Agregar input editable para precio unitario por renglón
- Resaltar precio modificado con borde amber
- Botón reset para restablecer al `precioOriginal`
- Mostrar texto "Original: $X" cuando el precio fue modificado

### 5. Modificar `src/components/cotizaciones/CotizacionesTable.tsx`
- Agregar `Trash2` al import de lucide
- Agregar `onDelete` a Props e interface
- Agregar botón eliminar (icono basura) en columna acciones

### 6. Modificar `src/pages/CotizacionesPage.tsx`
- Importar `useDeleteCotizacion`
- Instanciar `deleteMut`
- Agregar `handleDelete` con confirmación
- Pasar `onDelete` a `CotizacionesTable`
- Actualizar `handleSave` para usar `CreateCotizacionPayload` (campos `lineas`, `impuesto`, `articulo`)

### 7. Modificar `src/components/cotizaciones/ProductSearch.tsx`
- Agregar `precioOriginal: precio` al crear nuevo item en `addProduct`

