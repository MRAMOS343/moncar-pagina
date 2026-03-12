

# Plan: Módulo de Cotizaciones para Refaccionarias

## Resumen

Crear una nueva página `/refaccionarias/cotizaciones` que permita generar cotizaciones de productos con auto-llenado por SKU, cálculos automáticos de totales con IVA, vista previa estilo documento (similar a la imagen proporcionada), y un historial con seguimiento de quién las creó y cuáles se concretaron.

## Archivos a crear

### 1. `src/pages/CotizacionesPage.tsx`
Página principal con dos vistas:
- **Lista de cotizaciones** (vista por defecto): tabla con columnas Folio, Cliente, Fecha, Vendedor, Total, Estado (pendiente/concretada/cancelada), y acciones (ver, duplicar, marcar como concretada)
- **Nueva cotización** (formulario): campos de Cliente, Sucursal, búsqueda de productos por SKU/nombre usando `useProducts`, tabla editable de items con cantidad, y sección de totales (subtotal, IVA 16%, total)

### 2. `src/components/cotizaciones/CotizacionForm.tsx`
Formulario de creación/edición:
- Campo Cliente (texto libre)
- Buscador de producto por SKU: al teclear un SKU y presionar Enter o seleccionar del dropdown, se auto-llenan Descripción, Pieza (unidad), y Precio Unitario desde la API de productos (`useProducts` con param `q`)
- Campo Cantidad editable por línea
- Columna Total por línea = Cantidad x Precio Unitario
- Footer: Subtotal, IVA (16%), Total
- Botón "Guardar cotización" y "Vista previa / Imprimir"

### 3. `src/components/cotizaciones/CotizacionPreview.tsx`
Vista previa del documento para impresión, replicando el diseño de la imagen:
- Logo de Grupo Moncar arriba (se copiará `user-uploads://logo.jpeg` a `src/assets/logo-moncar.jpeg`)
- Título "COTIZACIÓN"
- Datos: Cliente, Vendedor (folio del usuario), Fecha, Número de Cotización (auto-generado), Sucursal
- Tabla: Cantidad | Descripción | Pieza | Precio Unitario | Total
- Footer: Subtotal, IVA (16%), Total
- Datos fiscales de la empresa al pie
- Botón de imprimir usando `window.print()` con CSS `@media print`

### 4. `src/components/cotizaciones/CotizacionesTable.tsx`
Tabla del historial con filtros por estado y fecha, mostrando KPIs arriba:
- Total de cotizaciones
- Cotizaciones concretadas (%)
- Monto total cotizado
- Cotizaciones por vendedor

### 5. `src/services/cotizacionService.ts`
Servicio con funciones para la API (preparado para backend, inicialmente localStorage):
- `fetchCotizaciones()` — listar
- `createCotizacion()` — crear
- `updateCotizacionEstado()` — cambiar estado (pendiente → concretada/cancelada)

### 6. `src/hooks/useCotizaciones.ts`
Hook con React Query para CRUD de cotizaciones. Mientras no exista endpoint backend, persistirá en localStorage bajo `moncar_cotizaciones`.

### 7. `src/types/cotizaciones.ts`
Tipos:
```typescript
interface CotizacionItem {
  sku: string;
  descripcion: string;
  pieza: string;       // unidad
  precioUnitario: number;
  cantidad: number;
  total: number;
}

interface Cotizacion {
  id: string;
  folio: string;       // MC-0001, MC-0002...
  cliente: string;
  sucursal: string;
  vendedorId: string;
  vendedorNombre: string;
  fecha: string;
  items: CotizacionItem[];
  subtotal: number;
  iva: number;
  total: number;
  estado: 'pendiente' | 'concretada' | 'cancelada';
  creadaEn: string;
}
```

## Archivos a modificar

### 8. `src/pages/RefaccionariasLayout.tsx`
- Agregar nav item "Cotizaciones" con icono `FileText` entre Ventas y Predicción
- Agregar entrada en `routeLabels`

### 9. `src/main.tsx`
- Agregar lazy import de `CotizacionesPage`
- Agregar ruta `cotizaciones` dentro de `refaccionarias`

### 10. Copiar logo
- Copiar `user-uploads://logo.jpeg` a `src/assets/logo-moncar.jpeg` para usarlo en la vista previa del documento

## Flujo de auto-llenado por SKU

1. Usuario teclea SKU en el campo de búsqueda
2. Se usa `useProducts({ q: skuInput })` para buscar en la API real
3. Al seleccionar un producto, se auto-llenan: descripción (`descrip`), pieza (`unidad`), precio unitario (`precio1 + impuesto` calculado)
4. Usuario ingresa cantidad → se calcula total de esa línea
5. Totales generales se recalculan en tiempo real

## Persistencia temporal

Dado que no hay endpoint backend para cotizaciones aún, se usará localStorage con la clave `moncar_cotizaciones`. El servicio está estructurado para migrar fácilmente a API REST cuando esté disponible.

