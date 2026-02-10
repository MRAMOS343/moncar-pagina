

# Plan: Limpiar tarjetas de propiedad y agregar seccion de Documentos

## Resumen

Dos cambios: (1) Eliminar los iconos de camas, banos y estacionamientos de las tarjetas de propiedad para un look mas profesional/B2B, y (2) agregar un nuevo tab "Documentos" donde se puedan subir y gestionar archivos generales por propiedad (recibos de luz, agua, predial, etc.).

---

## Cambio 1: Limpiar tarjetas (PropertyCard y PropertyDetailModal)

### PropertyCard.tsx
- Eliminar imports de `BedDouble`, `Bath`, `Car`
- Eliminar la seccion con los iconos de habitaciones/banos/estacionamientos (lineas 56-66)
- La tarjeta mostrara solo: tipo + m2, direccion, precio/mes y badge de estado

### PropertyDetailModal.tsx
- Eliminar imports de `BedDouble`, `Bath`, `Car`
- Reemplazar el grid de 4 columnas (m2, hab, banos, est) por solo metros cuadrados como dato destacado
- Mantener el resto de informacion en el detalle pero sin iconos residenciales

---

## Cambio 2: Nuevo tab "Documentos"

### Nuevo tipo: `DocumentoPropiedad` (en `src/types/propiedades.ts`)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | string | ID unico |
| propiedadId | string | Referencia a propiedad |
| nombre | string | Nombre del documento |
| tipo | enum | recibo_luz, recibo_agua, predial, contrato_firmado, identificacion, comprobante_domicilio, otro |
| archivo | string (null) | URL del archivo (mock por ahora) |
| fechaSubida | string | Fecha de carga |
| notas | string | Observaciones |

### Nuevos archivos

| Archivo | Descripcion |
|---------|-------------|
| `src/components/propiedades/DocumentFormModal.tsx` | Modal para subir/registrar un documento con campos: propiedad, tipo de documento, nombre, notas |
| `src/components/propiedades/DocumentTable.tsx` | Tabla listando documentos con columnas: propiedad, tipo, nombre, fecha, acciones (descargar/eliminar) |

### Cambios en archivos existentes

| Archivo | Cambio |
|---------|--------|
| `src/types/propiedades.ts` | Agregar tipo `TipoDocumento` y interface `DocumentoPropiedad` |
| `src/data/mockPropiedades.ts` | Agregar array `mockDocumentos` con datos de ejemplo |
| `src/hooks/usePropiedades.ts` | Agregar estado `documentos` y funciones `addDocumento`, `deleteDocumento` |
| `src/pages/PropiedadesPage.tsx` | Agregar tab "Documentos" con tabla y boton para subir |

### Tipos de documento disponibles

- Recibo de luz
- Recibo de agua
- Predial
- Contrato firmado
- Identificacion
- Comprobante de domicilio
- Otro (campo libre)

### UI del tab Documentos

```text
[Propiedades] [Contratos] [Pagos] [Mantenimiento] [Documentos]
─────────────────────────────────────────────────────────────
                                              [+ Subir Documento]

| Propiedad      | Tipo           | Nombre         | Fecha      | Acciones     |
|----------------|----------------|----------------|------------|--------------|
| Av. Reforma 45 | Recibo de luz  | CFE Enero 2026 | 2026-01-15 | Descargar | X |
| Calle Norte 12 | Predial        | Predial 2026   | 2026-01-20 | Descargar | X |
```

---

## Detalles Tecnicos

- La carga de archivos sera simulada (mock) en esta fase; el boton "Descargar" mostrara un toast indicando que la funcionalidad estara disponible al conectar el backend
- Los documentos se filtran y agrupan visualmente por propiedad
- Se mantiene el mismo patron de modales y hooks del resto del modulo
