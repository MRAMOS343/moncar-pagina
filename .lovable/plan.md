

# Plan: Migrar Equipos de `sucursal_id` a `sucursal_codigo`

## Resumen

Actualizar el modulo de Equipos para usar el codigo de sucursal (ej: `"moncar"`) en lugar de UUIDs. Esto alinea el frontend con la estructura del backend donde las sucursales se identifican por codigo.

---

## Cambios a Implementar

### 1. Crear Tipo y Servicio para Sucursales

**Nuevo archivo: `src/types/sucursales.ts`**

```typescript
export interface Sucursal {
  codigo: string;     // "moncar"
  nombre: string;     // "Moncar"
  direccion?: string;
  telefono?: string;
  activo: boolean;
}

export interface SucursalesListResponse {
  ok: true;
  items: Sucursal[];
}
```

**Nuevo archivo: `src/services/sucursalService.ts`**

```typescript
import { apiRequest } from "./apiClient";
import type { SucursalesListResponse } from "@/types/sucursales";

export async function fetchSucursales(token: string): Promise<SucursalesListResponse> {
  return apiRequest<SucursalesListResponse>("/sucursales", { token });
}
```

**Nuevo archivo: `src/hooks/useSucursales.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSucursales } from "@/services/sucursalService";

export function useSucursales() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["sucursales"],
    queryFn: () => fetchSucursales(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.items,
  });
}
```

---

### 2. Actualizar Tipos de Equipo

**Archivo: `src/types/equipos.ts`**

Cambios:
- Reemplazar `sucursal_id` por `sucursal_codigo` en todas las interfaces

```typescript
// Antes
export interface EquipoListItem {
  sucursal_id: string | null;
  sucursal_nombre: string | null;
  // ...
}

// Despues
export interface EquipoListItem {
  sucursal_codigo: string | null;  // <- Cambio
  sucursal_nombre: string | null;
  // ...
}
```

Lo mismo para:
- `CreateEquipoRequest`: `sucursal_id` -> `sucursal_codigo`
- `UpdateEquipoRequest`: `sucursal_id` -> `sucursal_codigo`

---

### 3. Actualizar Formulario de Creacion/Edicion

**Archivo: `src/components/modals/EquipoFormModal.tsx`**

Cambios principales:

1. **Importar nuevo hook**: Reemplazar `useWarehouses` por `useSucursales`

2. **Actualizar estado del formulario**:
```typescript
// Antes
const [formData, setFormData] = useState({
  sucursal_id: "",
  // ...
});

// Despues
const [formData, setFormData] = useState({
  sucursal_codigo: "",
  // ...
});
```

3. **Actualizar Select de sucursales**:
```tsx
// Antes
{warehouses.map((w) => (
  <SelectItem key={w.id} value={w.id}>
    {w.nombre}
  </SelectItem>
))}

// Despues
{sucursales.map((s) => (
  <SelectItem key={s.codigo} value={s.codigo}>
    {s.nombre}
  </SelectItem>
))}
```

4. **Actualizar payload en handleSubmit**:
```typescript
const payload = {
  nombre: formData.nombre.trim(),
  descripcion: formData.descripcion.trim() || null,
  lider_usuario_id: formData.lider_usuario_id.trim() || null,
  sucursal_codigo: formData.sucursal_codigo,  // <- Cambio
  // ...
};
```

5. **Actualizar validacion**:
```typescript
if (!formData.sucursal_codigo) {
  setErrors({ sucursal: "Debes seleccionar una sucursal" });
  return;
}
```

---

### 4. Actualizar Modal de Detalle (Opcional)

**Archivo: `src/components/modals/EquipoDetailModal.tsx`**

Si se requiere mostrar el codigo ademas del nombre:

```tsx
<div className="flex items-start gap-3">
  <Building className="h-4 w-4 mt-1 text-muted-foreground" />
  <div>
    <p className="text-xs text-muted-foreground">Sucursal</p>
    <p className="font-medium">
      {equipo.sucursal_nombre || "Sin asignar"}
    </p>
    {equipo.sucursal_codigo && (
      <p className="text-xs text-muted-foreground">
        Codigo: {equipo.sucursal_codigo}
      </p>
    )}
  </div>
</div>
```

---

### 5. Verificar/Actualizar Filtros (Si Aplica)

Revisar `src/hooks/useEquipos.ts` para ver si hay filtros por sucursal.

**Estado actual**: El hook `useEquipos` solo filtra por `q` (busqueda) y no por sucursal. No se requieren cambios aqui a menos que se agregue filtrado por sucursal en el futuro.

---

## Resumen de Archivos

| Archivo | Accion |
|---------|--------|
| `src/types/sucursales.ts` | **Crear** - Nuevo tipo Sucursal |
| `src/services/sucursalService.ts` | **Crear** - Servicio GET /sucursales |
| `src/hooks/useSucursales.ts` | **Crear** - Hook React Query |
| `src/types/equipos.ts` | **Modificar** - Cambiar sucursal_id por sucursal_codigo |
| `src/components/modals/EquipoFormModal.tsx` | **Modificar** - Usar useSucursales y enviar sucursal_codigo |
| `src/components/modals/EquipoDetailModal.tsx` | **Modificar** - Mostrar sucursal_codigo (opcional) |

---

## Pruebas de Aceptacion

1. Crear equipo seleccionando sucursal "Moncar" del dropdown
2. Verificar que el request POST envia `sucursal_codigo: "moncar"`
3. Ver en el listado que aparece "Moncar" como nombre de sucursal
4. Abrir detalle del equipo y confirmar que muestra `sucursal_codigo = "moncar"`
5. Editar equipo y verificar que el dropdown muestra la sucursal correcta preseleccionada

---

## Notas Tecnicas

- El endpoint `GET /sucursales` debe retornar `{ ok: true, items: [{ codigo, nombre, ... }] }`
- Si el endpoint actual es diferente (ej: `/warehouses`), ajustar el servicio segun la respuesta real del backend
- La validacion frontend previene enviar equipos sin sucursal seleccionada

