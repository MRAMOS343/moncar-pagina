

# Auto-rellenar nombre de documento con tipo + numero de unidad

## Cambios

### 1. `src/components/vehiculos/DocVehFormModal.tsx`
- Agregar prop `unidadNumero?: string` a la interfaz `Props`
- Trackear si el usuario ha editado manualmente el nombre con un flag `nombreTouched`
- Cuando cambie el tipo y `nombreTouched` sea false, auto-rellenar el nombre con `"${TIPO_DOC_LABELS[tipo]} ${unidadNumero}"`
- El campo nombre sigue siendo editable; al escribir manualmente se activa `nombreTouched = true`
- Al abrir el modal fresco, pre-rellenar con el tipo default + numero de unidad

### 2. `src/pages/VehiculosPage.tsx`
- Pasar `unidadNumero` al `DocVehFormModal`
- Necesita guardar el numero de unidad junto con el ID al abrir el modal de documento
- Cambiar `docFormUnidadId` de `string | null` a `{ id: string; numero: string } | null`, o agregar un state separado `docFormUnidadNumero`

