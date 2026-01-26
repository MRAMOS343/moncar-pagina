
# Plan: Corregir Error "Cannot access 'equipo' before initialization"

## Problema Identificado

En el archivo `EquipoDetailModal.tsx`, hay un error de orden de declaración de variables:

- **Línea 74-76**: Se usa `equipo` para filtrar usuarios disponibles
- **Línea 82**: Se declara `equipo = data?.equipo`

JavaScript no permite usar una variable declarada con `const` antes de su línea de declaración (Temporal Dead Zone).

## Solución

Reorganizar las declaraciones para que `equipo` se declare **antes** de ser usada.

## Cambios a Implementar

**Archivo: `src/components/modals/EquipoDetailModal.tsx`**

Mover la declaración de `equipo` antes del filtro de usuarios:

```text
ANTES (orden actual):
Línea 70-71: Estados (showAddMiembro, newMiembro)
Línea 74-76: usuariosDisponibles = usuarios.filter(u => !equipo?.miembros...)  ← USA 'equipo'
Línea 77-80: Estado (miembroToRemove)
Línea 82-84: equipo = data?.equipo  ← DECLARA 'equipo'

DESPUES (orden corregido):
Línea 70-71: Estados (showAddMiembro, newMiembro)
Línea 72-73: Estado (miembroToRemove)
Línea 75: equipo = data?.equipo  ← DECLARA 'equipo' PRIMERO
Línea 76-78: canManageMembers
Línea 80-82: usuariosDisponibles = usuarios.filter(...)  ← USA 'equipo' DESPUES
```

## Código Corregido

```typescript
const [showAddMiembro, setShowAddMiembro] = useState(false);
const [newMiembro, setNewMiembro] = useState({ usuario_id: "", rol_equipo: "" });
const [miembroToRemove, setMiembroToRemove] = useState<{
  usuario_id: string;
  nombre: string;
} | null>(null);

// Declarar equipo PRIMERO
const equipo = data?.equipo;
const canManageMembers =
  currentUser?.role === "admin" || currentUser?.role === "gerente";

// AHORA sí podemos usarlo
const usuariosDisponibles = usuarios.filter(
  (u) => !equipo?.miembros?.some((m) => m.usuario_id === u.usuario_id)
);
```

## Resumen

| Archivo | Cambio |
|---------|--------|
| `src/components/modals/EquipoDetailModal.tsx` | Reordenar declaraciones: `equipo` antes de `usuariosDisponibles` |

## Impacto

- La página de Equipos cargará correctamente
- El modal de detalle funcionará sin errores
- El filtrado de usuarios disponibles funcionará como esperado
