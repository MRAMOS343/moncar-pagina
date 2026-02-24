

# Cambiar Unidades de Collapsible a Modal de Detalle

## Objetivo

Actualmente, al hacer clic en una unidad dentro de una ruta, se expande un collapsible inline mostrando los documentos. El usuario quiere que al hacer clic en una unidad se **abra un modal de detalle** (similar a como funciona en Inventario al hacer clic en un producto, o en Ventas al hacer clic en una venta).

## Cambios

### 1. Convertir `UnidadCollapsible` en `UnidadRow` (item clickeable)

Transformar el componente `UnidadCollapsible.tsx` en un componente simple tipo fila/tarjeta que al hacer clic dispare un callback `onClick(unidad)` en lugar de expandirse. Mostrara: numero de unidad, placa, marca/modelo, badge de estado, e indicadores de alertas (puntos rojo/amarillo).

### 2. Redisenar `VehicleDetailModal` como pantalla de documentos de unidad

Actualizar `VehicleDetailModal.tsx` para que sea el modal principal al hacer clic en una unidad. Se redisena para mostrar:

- **Header**: "Unidad 04 - Chevrolet Silverado 2022" con badge de estado y placa
- **Info basica**: Color, km, descripcion
- **Tabla de documentos**: Nombre, Tipo, Vigencia (con alertas visuales), Tamano, acciones (descargar, eliminar)
- **Botones de accion**: "Subir Documento" y "Configurar Alertas"

Este modal seguira el mismo patron visual que `ProductDetailModal` (max-w-2xl, ScrollArea, secciones con separadores).

### 3. Actualizar `RutaCollapsible`

Cambiar para que en lugar de renderizar `UnidadCollapsible` con expansion, renderice items de unidad clickeables que llamen a `onSelectUnidad(unidad)`.

### 4. Actualizar `VehiculosPage`

Agregar estado para la unidad seleccionada y renderizar condicionalmente el `VehicleDetailModal` cuando se selecciona una unidad.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/vehiculos/UnidadCollapsible.tsx` | Convertir de collapsible a fila clickeable (renombrar logica interna) |
| `src/components/vehiculos/VehicleDetailModal.tsx` | Redisenar como modal de documentos con tabla, alertas y acciones |
| `src/components/vehiculos/RutaCollapsible.tsx` | Cambiar callback de unidades de expansion a seleccion |
| `src/pages/VehiculosPage.tsx` | Agregar estado de unidad seleccionada y renderizar modal de detalle |

