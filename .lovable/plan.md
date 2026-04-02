

# Correcciones y mejoras al módulo de Cotizaciones

5 cambios solicitados por el usuario con instrucciones exactas de implementación.

## Cambios

### 1. Agregar `updateCotizacion` al servicio y hook
- **`src/services/cotizacionService.ts`**: Agregar función `updateCotizacion` con `PUT /api/v1/cotizaciones/:id`
- **`src/hooks/useCotizaciones.ts`**: Importar `updateCotizacion`, agregar hook `useUpdateCotizacion`

### 2. Botones de estado para todos los estados
- **`src/components/cotizaciones/CotizacionesTable.tsx`**: Reemplazar el bloque condicional `{c.estado === 'pendiente'}` (lineas 149-158) por tres botones condicionales que permitan cambiar a cualquier estado desde cualquier otro. Agregar `RotateCcw` y `Pencil` a imports de lucide-react.

### 3. Fix delete con feedback de error
- **`src/pages/CotizacionesPage.tsx`**: Agregar `onError` al `deleteMut.mutate` con toast destructivo.

### 4. Modo edición completo
- **`src/pages/CotizacionesPage.tsx`**:
  - Tipo `View` → agregar `'edit'`
  - Estado `editingCotizacion` + importar `useUpdateCotizacion`
  - Funciones `handleEdit` y `handleUpdate`
  - Bloque `if (view === 'edit')` con formulario igual al de crear pero con título "Editar Cotización" y botón que llama `handleUpdate`
  - Pasar `onEdit={handleEdit}` a `CotizacionesTable`
- **`src/components/cotizaciones/CotizacionesTable.tsx`**:
  - Agregar `onEdit` a Props
  - Agregar botón con icono `Pencil` en acciones

### 5. Fix del PDF
- **`src/components/cotizaciones/CotizacionPreview.tsx`**:
  - Agregar `formatFecha` para mostrar solo DD/MM/YYYY
  - Agregar `useEffect` que inyecta `<style>` para print (ocultar todo menos el documento)
  - Agregar `id="cotizacion-print-root"` al div raíz
- **`src/pages/CotizacionesPage.tsx`**:
  - Reemplazar `handlePrint` para cambiar `document.title` temporalmente con folio + nombre del cliente, generando nombres de archivo PDF correctos

## Archivos modificados
1. `src/services/cotizacionService.ts`
2. `src/hooks/useCotizaciones.ts`
3. `src/components/cotizaciones/CotizacionesTable.tsx`
4. `src/pages/CotizacionesPage.tsx`
5. `src/components/cotizaciones/CotizacionPreview.tsx`

