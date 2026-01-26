

# Plan: Selector de Usuarios para Lider de Equipo

## Objetivo

Reemplazar el campo de texto "ID del Lider (UUID)" por un dropdown que muestre los usuarios disponibles con su nombre y email, haciendo la seleccion mucho mas intuitiva.

---

## Cambios a Implementar

### 1. Crear Tipo e Interfaz para Usuarios

**Nuevo archivo: `src/types/usuarios.ts`**

```typescript
export interface UsuarioListItem {
  id: string;          // UUID del usuario
  nombre: string;      // "Juan Perez"
  email: string;       // "juan@empresa.com"
  role?: string;       // "admin" | "gerente" | "cajero"
}

export interface UsuariosListResponse {
  ok: true;
  items: UsuarioListItem[];
}
```

---

### 2. Crear Servicio para Fetch de Usuarios

**Nuevo archivo: `src/services/usuarioService.ts`**

```typescript
import { apiRequest } from "./apiClient";
import type { UsuariosListResponse } from "@/types/usuarios";

export async function fetchUsuarios(token: string): Promise<UsuariosListResponse> {
  return apiRequest<UsuariosListResponse>("/users", { token });
}
```

---

### 3. Crear Hook React Query

**Nuevo archivo: `src/hooks/useUsuarios.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUsuarios } from "@/services/usuarioService";

export function useUsuarios() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: () => fetchUsuarios(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,  // 5 minutos cache
    select: (data) => data.items,
  });
}
```

---

### 4. Actualizar Formulario de Equipos

**Archivo: `src/components/modals/EquipoFormModal.tsx`**

Cambios principales:

1. **Importar hook de usuarios**:
```typescript
import { useUsuarios } from "@/hooks/useUsuarios";
```

2. **Obtener lista de usuarios**:
```typescript
const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios();
```

3. **Reemplazar Input por Select para el lider**:

```tsx
// ANTES (lineas 162-176):
<div className="space-y-2">
  <Label htmlFor="lider_usuario_id">ID del Lider (opcional)</Label>
  <Input
    id="lider_usuario_id"
    value={formData.lider_usuario_id}
    onChange={(e) => setFormData({ ...formData, lider_usuario_id: e.target.value })}
    placeholder="UUID del usuario lider"
    disabled={isPending}
  />
  <p className="text-xs text-muted-foreground">
    Ingresa el ID del usuario que sera lider del equipo
  </p>
</div>

// DESPUES:
<div className="space-y-2">
  <Label htmlFor="lider">Lider del Equipo (opcional)</Label>
  <Select
    value={formData.lider_usuario_id}
    onValueChange={(value) => 
      setFormData({ ...formData, lider_usuario_id: value === "none" ? "" : value })
    }
    disabled={isPending || loadingUsuarios}
  >
    <SelectTrigger>
      <SelectValue placeholder="Seleccionar lider" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Sin lider asignado</SelectItem>
      {usuarios.map((u) => (
        <SelectItem key={u.id} value={u.id}>
          {u.nombre} ({u.email})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    El lider tendra permisos especiales sobre el equipo
  </p>
</div>
```

---

## Resumen de Archivos

| Archivo | Accion |
|---------|--------|
| `src/types/usuarios.ts` | **Crear** - Tipos para usuario |
| `src/services/usuarioService.ts` | **Crear** - Servicio GET /users |
| `src/hooks/useUsuarios.ts` | **Crear** - Hook React Query |
| `src/components/modals/EquipoFormModal.tsx` | **Modificar** - Usar Select en lugar de Input |

---

## Flujo de Usuario Mejorado

1. Usuario abre modal "Crear Equipo"
2. Ve dropdown "Lider del Equipo" con lista de usuarios
3. Cada opcion muestra: **Nombre (email)**
4. Puede seleccionar "Sin lider asignado" para dejar vacio
5. Al guardar, se envia el UUID internamente

---

## Notas Tecnicas

- El endpoint GET /users debe retornar `{ ok: true, items: [...] }` o un array directo
- Si el formato de respuesta es diferente, ajustaremos el servicio como hicimos con sucursales
- El dropdown incluye opcion "Sin lider" para permitir equipos sin lider inicial

