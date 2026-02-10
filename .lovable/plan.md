
# Plan: Mover documentos al detalle de cada propiedad

## Resumen

Eliminar el tab "Documentos" de la pagina principal y mover la gestion de documentos al modal de detalle de cada propiedad. Al hacer click en una propiedad, el modal mostrara la informacion general mas secciones colapsables por tipo de documento (Recibos de Luz, Recibos de Agua, Predial, Contratos Firmados, Identificaciones, Comprobantes de Domicilio, Otros).

---

## Cambios

### 1. `src/components/propiedades/PropertyDetailModal.tsx` (rediseno mayor)

- Ampliar el modal a `max-w-2xl` para dar espacio a las secciones de documentos
- Mantener la informacion general de la propiedad en la parte superior (estado, direccion, m2, precio, descripcion, botones editar/eliminar)
- Debajo, agregar secciones colapsables (usando el componente `Collapsible` de Radix ya instalado) por cada tipo de documento:

```text
+------------------------------------------+
|  Oficina - Av. Reforma 450              |
|  [Rentada]                  $15,000/mes  |
|  Av. Reforma 450, Col. Centro           |
|  120 m2                                  |
|  [Editar] [Eliminar]                     |
|  ────────────────────────────────────    |
|  Documentos                              |
|                                          |
|  > Recibos de Luz (2)        [+ Agregar] |
|    | CFE Enero 2026 | 2026-01-15 | X |   |
|    | CFE Dic 2025   | 2025-12-10 | X |   |
|                                          |
|  > Recibos de Agua (1)       [+ Agregar] |
|    | SAPAS Enero    | 2026-01-20 | X |   |
|                                          |
|  > Predial (0)               [+ Agregar] |
|                                          |
|  > Contratos Firmados (1)    [+ Agregar] |
|  > Identificaciones (0)     [+ Agregar]  |
|  > Comp. Domicilio (0)      [+ Agregar]  |
|  > Otros (0)                [+ Agregar]  |
+------------------------------------------+
```

- Cada seccion colapsable muestra los documentos filtrados por tipo para esa propiedad
- Cada seccion tiene un boton "+ Agregar" que abre el `DocumentFormModal` pre-llenado con la propiedad y el tipo de documento
- Cada documento muestra: nombre, fecha, y botones de descargar/eliminar

### Props adicionales del modal

El modal necesitara recibir nuevas props:
- `documentos: DocumentoPropiedad[]` (filtrados por propiedad)
- `onAddDocumento: (tipo: TipoDocumento) => void` (abre el form con tipo pre-seleccionado)
- `onDeleteDocumento: (id: string) => void`

### 2. `src/components/propiedades/DocumentFormModal.tsx` (ajuste menor)

- Agregar props opcionales `defaultPropiedadId` y `defaultTipo` para pre-llenar campos cuando se abre desde el detalle de una propiedad
- Si se pasan estos valores, los campos correspondientes se pre-seleccionan y se deshabilitan (el usuario no necesita elegir propiedad ni tipo porque ya esta contextualizado)

### 3. `src/pages/PropiedadesPage.tsx`

- Eliminar el tab "Documentos" del `TabsList` y su `TabsContent`
- Eliminar imports de `DocumentTable` (ya no se usa en la pagina principal)
- Actualizar el `PropertyDetailModal` para pasar las nuevas props de documentos
- Agregar estado para controlar la apertura del `DocumentFormModal` desde el detalle, con `defaultTipo` y `defaultPropiedadId`

---

## Detalles Tecnicos

- Se usara el componente `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` de `@radix-ui/react-collapsible` (ya instalado en el proyecto)
- Los 7 tipos de documento se iteraran desde un array constante para evitar repeticion de codigo
- Los documentos se filtran en el modal: `documentos.filter(d => d.propiedadId === propiedad.id && d.tipo === tipo)`
- El componente `DocumentTable` se conserva como componente reutilizable pero ya no se usa en la pagina principal
- El `ScrollArea` se usara dentro del modal para manejar contenido largo
