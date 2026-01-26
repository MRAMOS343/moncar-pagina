

# Plan Corregido: Selector de Usuarios para Lider de Equipo

## Correcciones Necesarias

El endpoint correcto es **`GET /usuarios`** y la respuesta usa **`usuario_id`** en lugar de `id`.

---

## Cambios a Implementar

### 1. Actualizar Tipos de Usuario

**Archivo: `src/types/usuarios.ts`**

```typescript
export interface UsuarioListItem {
  usuario_id: string;    // Corregido: era "id"
  nombre: string;
  email: string;
}

export interface UsuariosListResponse {
  ok: true;
  items: UsuarioListItem[];
}
```

---

### 2. Actualizar Servicio de Usuarios

**Archivo: `src/services/usuarioService.ts`**

```typescript
import { apiRequest } from "./apiClient";
import type { UsuariosListResponse } from "@/types/usuarios";

export async function fetchUsuarios(token: string): Promise<UsuariosListResponse> {
  // Corregido: era "/users"
  return apiRequest<UsuariosListResponse>("/usuarios", { token });
}
```

---

### 3. Actualizar Formulario de Equipos

**Archivo: `src/components/modals/EquipoFormModal.tsx`**

Cambiar las referencias de `u.id` a `u.usuario_id`:

```tsx
<SelectContent>
  <SelectItem value="none">Sin lider asignado</SelectItem>
  {usuarios.map((u) => (
    <SelectItem key={u.usuario_id} value={u.usuario_id}>
      {u.nombre} ({u.email})
    </SelectItem>
  ))}
</SelectContent>
```

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/types/usuarios.ts` | Cambiar `id` a `usuario_id` |
| `src/services/usuarioService.ts` | Cambiar `/users` a `/usuarios` |
| `src/components/modals/EquipoFormModal.tsx` | Usar `u.usuario_id` en lugar de `u.id` |

---

## Respuesta Esperada del Backend

```json
{
  "ok": true,
  "items": [
    {
      "usuario_id": "86d6a11f-d183-4530-a025-af382721d0a4",
      "nombre": "Diego Monzalvo",
      "email": "diegoadmin@grupomonzalvo.mx"
    }
  ]
}
```

