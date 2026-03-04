

# Conectar Modulo de Vehiculos a la API REST

## Resumen

Reemplazar los datos mock por llamadas reales a la API REST, agregar CRUD completo de rutas/unidades, implementar el flujo de subida de archivos multipart, y restringir el acceso solo a admin.

---

## Cambio 1: Actualizar tipos para coincidir con la API

**Archivo**: `src/types/vehiculos.ts`

Actualizar las interfaces para reflejar los campos exactos de la API (manteniendo camelCase en el frontend, el mapeo se hara en el service):

- `Ruta`: agregar `unidadesCount` (viene de la API), renombrar `createdAt` a `creadoEn`, agregar `actualizadoEn`
- `Unidad`: agregar `rutaNombre` (viene en GET individual), renombrar `createdAt` a `creadoEn`, agregar `actualizadoEn`
- `DocumentoUnidad`: reemplazar `archivoUrl` por `archivoId`, agregar `fechaDocumento`, renombrar `vigencia` a `vigenciaHasta`, agregar campos del archivo (`archivoNombre`, `archivoMime`, `archivoBytes`, `archivoEstado`)
- `AlertaDocumento`: agregar `creadoEn`, `actualizadoEn`
- Eliminar tipos de Mantenimiento y Gastos (ya no se usan)

## Cambio 2: Crear servicio de vehiculos

**Archivo nuevo**: `src/services/vehiculoService.ts`

Funciones que consumen la API usando `apiRequest` de `apiClient.ts`:

```
- fetchRutas()          -> GET /vehiculos/rutas
- createRuta(data)      -> POST /vehiculos/rutas
- updateRuta(id, data)  -> PATCH /vehiculos/rutas/:ruta_id
- deleteRuta(id)        -> DELETE /vehiculos/rutas/:ruta_id
- fetchUnidades(rutaId) -> GET /vehiculos/rutas/:ruta_id/unidades
- fetchUnidad(id)       -> GET /vehiculos/unidades/:unidad_id
- createUnidad(rutaId, data) -> POST /vehiculos/rutas/:ruta_id/unidades
- updateUnidad(id, data)     -> PATCH /vehiculos/unidades/:unidad_id
- deleteUnidad(id)           -> DELETE /vehiculos/unidades/:unidad_id
- fetchDocumentos(unidadId)  -> GET /vehiculos/unidades/:unidad_id/documentos
- createDocumento(unidadId, data) -> POST /vehiculos/unidades/:unidad_id/documentos
- updateDocumento(id, data)  -> PATCH /vehiculos/documentos/:documento_id
- deleteDocumento(id)        -> DELETE /vehiculos/documentos/:documento_id
- fetchAlertas(unidadId)     -> GET /vehiculos/unidades/:unidad_id/alertas
- upsertAlerta(unidadId, tipo, data) -> PUT /vehiculos/unidades/:unidad_id/alertas/:tipo
- fetchDocsPorVencer(dias)   -> GET /vehiculos/documentos/por-vencer?dias=X
```

Cada funcion incluira un mapper snake_case -> camelCase para mantener la consistencia del frontend.

## Cambio 3: Crear servicio de archivos

**Archivo nuevo**: `src/services/archivoService.ts`

Implementa el flujo multipart de subida:

1. `initUpload(data)` -> POST /archivos/init (devuelve archivo_id, upload_id, parte_bytes, partes_totales)
2. `getPartUrl(archivoId, numeroParte)` -> POST /archivos/:archivo_id/parte-url
3. `uploadPart(url, chunk)` -> PUT directo a URL firmada (captura ETag del header)
4. `completeUpload(archivoId, partes)` -> POST /archivos/:archivo_id/completar
5. `getDownloadUrl(archivoId)` -> GET /archivos/:archivo_id/descargar

Funcion de alto nivel `uploadFile(file: File)` que orquesta todo el flujo:
- Llama init -> divide el File en chunks segun parte_bytes -> sube cada parte -> completa -> devuelve archivo_id

## Cambio 4: Crear hooks de React Query

**Archivo nuevo**: `src/hooks/useVehiculosAPI.ts`

Reemplaza el hook local `useVehiculos.ts` con hooks basados en React Query:

- `useRutas()` - query para listar rutas
- `useUnidades(rutaId)` - query para unidades de una ruta (carga lazy al expandir)
- `useUnidadDetalle(unidadId)` - query para detalle individual
- `useDocumentos(unidadId)` - query para documentos de una unidad
- `useAlertas(unidadId)` - query para alertas de una unidad
- `useDocsPorVencer(dias)` - query para KPI de docs por vencer

Mutations:
- `useCreateRuta()`, `useUpdateRuta()`, `useDeleteRuta()`
- `useCreateUnidad()`, `useUpdateUnidad()`, `useDeleteUnidad()`
- `useCreateDocumento()`, `useUpdateDocumento()`, `useDeleteDocumento()`
- `useUpsertAlerta()`

Cada mutation invalida las queries correspondientes para actualizar la UI automaticamente.

## Cambio 5: Crear modales CRUD de Rutas y Unidades

**Archivo nuevo**: `src/components/vehiculos/RutaFormModal.tsx`

Modal con formulario para crear/editar ruta:
- Campos: nombre (requerido), descripcion, activa (switch)
- Validacion con Zod
- Usa mutation de crear o actualizar segun si recibe ruta existente

**Archivo nuevo**: `src/components/vehiculos/UnidadFormModal.tsx`

Modal con formulario para crear/editar unidad:
- Campos: numero (requerido), placa (requerido), marca, modelo, anio, color, km, estado (select), descripcion
- Validacion con Zod
- Incluye confirmacion de eliminacion con AlertDialog

## Cambio 6: Actualizar DocVehFormModal con subida de archivos

**Archivo**: `src/components/vehiculos/DocVehFormModal.tsx`

- Agregar campo `fecha_documento` (date input)
- Renombrar campo vigencia a `vigencia_hasta`
- Agregar file input para seleccionar archivo
- Al guardar: primero sube el archivo con `uploadFile()`, obtiene `archivo_id`, luego crea el documento con POST enviando ese `archivo_id`
- Mostrar progreso de subida (barra o porcentaje)
- Ya no necesita selector de unidad (siempre se abre desde el contexto de una unidad)

## Cambio 7: Actualizar VehicleDetailModal

**Archivo**: `src/components/vehiculos/VehicleDetailModal.tsx`

- Cargar documentos y alertas con queries de React Query (en vez de recibirlos como props)
- Boton "Descargar" ahora llama a `getDownloadUrl(archivoId)` y abre la URL en nueva pestania
- Agregar boton "Editar" en header que abre `UnidadFormModal`
- Agregar boton "Eliminar unidad" con confirmacion
- Agregar accion "Editar metadata" en cada documento (abre modal de edicion con PATCH)
- Mostrar `archivoNombre` y `archivoBytes` en la tabla de documentos

## Cambio 8: Actualizar RutaCollapsible

**Archivo**: `src/components/vehiculos/RutaCollapsible.tsx`

- Cargar unidades con lazy loading: al expandir la ruta, dispara `useUnidades(rutaId)` con `enabled: isOpen`
- Agregar boton de menu (tres puntos) en el header de la ruta con opciones: "Editar ruta", "Agregar unidad", "Eliminar ruta"
- DELETE de ruta: si el backend responde 409 (RUTA_CON_UNIDADES), mostrar toast con mensaje de error

## Cambio 9: Actualizar VehiculosPage

**Archivo**: `src/pages/VehiculosPage.tsx`

- Reemplazar `useVehiculos()` por los nuevos hooks de React Query
- KPIs: usar `useDocsPorVencer(dias)` con el plazo seleccionado
- Agregar boton "Nueva Ruta" en el header de la pagina
- Agregar estados para modales de crear/editar ruta y unidad
- Loading states: skeleton mientras cargan las rutas
- Error states: mensaje con boton de reintentar

## Cambio 10: Restringir acceso a solo admin

**Archivo**: `src/main.tsx`

Cambiar el wrapper de la ruta `/vehiculos` de `ModuleRoute` a `AdminRoute`:

```
// Antes:
<ModuleRoute module="vehiculos">

// Despues:
<AdminRoute>
```

**Archivo**: `src/components/layout/AppSidebar.tsx`

Ajustar la condicion de visibilidad del item "Vehiculos" en el sidebar para mostrar solo a admin (actualmente muestra a gestor_vehiculos tambien).

**Archivo**: `src/utils/moduleAccess.ts`

Remover `vehiculos` de la lista de modulos de `gestor_vehiculos`. Actualizar la descripcion del modulo vehiculos.

---

## Archivos a modificar/crear

| Archivo | Accion |
|---------|--------|
| `src/types/vehiculos.ts` | Modificar - actualizar interfaces |
| `src/services/vehiculoService.ts` | Crear - servicio API |
| `src/services/archivoService.ts` | Crear - flujo de archivos multipart |
| `src/hooks/useVehiculosAPI.ts` | Crear - hooks React Query |
| `src/components/vehiculos/RutaFormModal.tsx` | Crear - modal CRUD ruta |
| `src/components/vehiculos/UnidadFormModal.tsx` | Crear - modal CRUD unidad |
| `src/components/vehiculos/DocVehFormModal.tsx` | Modificar - agregar file upload |
| `src/components/vehiculos/VehicleDetailModal.tsx` | Modificar - usar queries y acciones reales |
| `src/components/vehiculos/RutaCollapsible.tsx` | Modificar - lazy load y menu de acciones |
| `src/components/vehiculos/AlertConfigModal.tsx` | Modificar - usar mutation real |
| `src/pages/VehiculosPage.tsx` | Modificar - conectar a API, agregar CRUD |
| `src/main.tsx` | Modificar - cambiar a AdminRoute |
| `src/utils/moduleAccess.ts` | Modificar - ajustar permisos |
| `src/components/layout/AppSidebar.tsx` | Modificar - visibilidad sidebar |
| `src/hooks/useVehiculos.ts` | Eliminar - ya no se usa (reemplazado por useVehiculosAPI) |
| `src/data/mockVehiculos.ts` | Eliminar - ya no se necesita |

