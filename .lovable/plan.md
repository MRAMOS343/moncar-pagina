

## Plan: Bulk Folder Import for Vehicle Routes

### Overview

Add a "Importar Carpeta" option to each route's dropdown menu. Users select a folder with the structure `Route/Unidad XX/documents...`. The system parses the folder, shows a preview, uploads files via the existing multipart flow, then calls a new bulk endpoint to create units + document records atomically.

### Files to Create

**1. `src/utils/vehiculos.ts`** — `inferirTipoDocumento` function
- Maps filename keywords to document types (tarjeta_circulacion, poliza_seguro, factura, cromatica, etc.)
- Fallback to `"otro"`

**2. `src/components/vehiculos/BulkImportModal.tsx`** — Main modal component
- Three states: `preview` → `uploading` → `done`
- **Preview**: Lists detected units and their documents, warns about duplicates
- **Uploading**: Progress bar, current file name, prevents closing
- **Done**: Summary (created/skipped/errors), close button
- Upload logic: iterate files using `archivoService.uploadFile`, then call `vehiculoService.importarBulk`
- Invalidates `['vehiculos']` queries on success

### Files to Modify

**3. `src/types/vehiculos.ts`** — Add 5 new types
- `ParsedDocumento`, `ParsedUnidad`, `DocumentoParaImportar`, `UnidadParaImportar`, `ImportarBulkBody`, `ImportarBulkResultado`

**4. `src/services/vehiculoService.ts`** — Add 2 new functions
- `checkDuplicados(rutaId, numeros)` → `GET /vehiculos/rutas/:rutaId/unidades/check?numeros=...`
- `importarBulk(rutaId, body)` → `POST /vehiculos/rutas/:rutaId/importar`

**5. `src/components/vehiculos/RutaCollapsible.tsx`** — Add "Importar Carpeta" menu item
- Add new prop `onImportFolder(rutaId)`
- Add `<DropdownMenuItem>` with folder icon

**6. `src/pages/VehiculosPage.tsx`** — Wire up the import flow
- Hidden `<input type="file" webkitdirectory>` with ref
- `handleFolderSelected`: parse `webkitRelativePath`, build `ParsedUnidad[]`, check duplicates, open modal
- State for `bulkImportData` and `bulkImportRutaId`
- Pass `onImportFolder` to `RutaCollapsible`
- Render `BulkImportModal`

### Backend Endpoints Needed (for your backend team)

1. **`GET /vehiculos/rutas/:rutaId/unidades/check?numeros=07,08,15`**
   - Returns `{ duplicados: ["07"] }` — which unit numbers already exist

2. **`POST /vehiculos/rutas/:rutaId/importar`**
   - Body: `{ unidades: [{ numero, placa?, documentos: [{ archivo_id, tipo, nombre }] }], omitir_duplicados: bool }`
   - Creates units + links documents in a single transaction
   - Returns `{ ok, creadas: [], omitidas: [], errores: [], resumen: string }`

