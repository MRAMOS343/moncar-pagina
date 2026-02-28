

# Diagnostico: Error al actualizar unidades

## Causa raiz

Hay un **desajuste de valores de estado** entre frontend y backend:

- El backend espera: `"activa"` | `"taller"` | `"baja"` (femenino, para concordar con "unidad")
- El frontend envía: `"activo"` | `"taller"` | `"baja"` (masculino)

El flujo completo del bug:

1. La API devuelve `"estado": "activa"` en el GET
2. `vehiculoService.ts` lo normaliza a `"activo"` con `normalizeEstado()` (linea 23-28)
3. `UnidadFormModal.tsx` carga ese valor `"activo"` en el formulario
4. El Select muestra opciones con `value="activo"`, `value="taller"`, `value="baja"`
5. Al guardar, envía `"estado": "activo"` al backend
6. El backend rechaza con 400: `Invalid option: expected one of "activa"|"taller"|"baja"`

## Solucion

Dos cambios en un archivo (`UnidadFormModal.tsx`):

1. Cambiar los valores del Select de estado para que coincidan con lo que espera el backend: `"activa"` en vez de `"activo"`
2. Mantener las etiquetas legibles ("Activo", "En Taller", "Baja")

Opcionalmente, eliminar la normalizacion innecesaria en `vehiculoService.ts` que convierte `"activa"` a `"activo"`, ya que causa este conflicto. O alternativamente, agregar una funcion inversa que convierta `"activo"` de vuelta a `"activa"` antes de enviar al backend.

**Enfoque recomendado**: Alinear todo al valor del backend (`"activa"`) y actualizar el tipo `EstadoVehiculo` en `types/vehiculos.ts` para reflejar los valores reales de la API.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/types/vehiculos.ts` | Cambiar `EstadoVehiculo` a `'activa' \| 'taller' \| 'baja'` |
| `src/services/vehiculoService.ts` | Eliminar `normalizeEstado` — usar el valor tal cual de la API |
| `src/components/vehiculos/UnidadFormModal.tsx` | Cambiar `SelectItem value="activo"` a `value="activa"`, default del form a `"activa"` |
| `src/components/vehiculos/VehicleDetailModal.tsx` | Verificar que badges de estado usen `"activa"` en vez de `"activo"` |

