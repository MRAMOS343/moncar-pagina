

# Plan: Selector de Usuarios para Agregar Miembros al Equipo

## Objetivo

Agregar la capacidad de seleccionar múltiples usuarios como miembros del equipo, tanto en el formulario de creación/edición como en el modal de detalle.

---

## Cambios a Implementar

### 1. Mejorar EquipoDetailModal - Reemplazar Input UUID por Select

**Archivo: `src/components/modals/EquipoDetailModal.tsx`**

Cambiar el input manual de UUID por un dropdown que muestre los usuarios disponibles:

```text
ANTES (líneas 214-229):
- Input de texto para "ID Usuario" (UUID manual)

DESPUES:
- Select dropdown con lista de usuarios
- Muestra nombre y email de cada usuario
- Filtra usuarios que ya son miembros del equipo
```

**Cambios específicos:**

1. Importar el hook `useUsuarios`:
```typescript
import { useUsuarios } from "@/hooks/useUsuarios";
```

2. Obtener lista de usuarios:
```typescript
const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios();
```

3. Filtrar usuarios que ya son miembros:
```typescript
const usuariosDisponibles = usuarios.filter(
  (u) => !equipo?.miembros?.some((m) => m.usuario_id === u.usuario_id)
);
```

4. Reemplazar el Input por un Select:
```tsx
<div className="space-y-1">
  <Label htmlFor="new_usuario_id">Usuario *</Label>
  <Select
    value={newMiembro.usuario_id}
    onValueChange={(value) =>
      setNewMiembro({ ...newMiembro, usuario_id: value })
    }
    disabled={addMiembroMutation.isPending || loadingUsuarios}
  >
    <SelectTrigger>
      <SelectValue placeholder="Seleccionar usuario" />
    </SelectTrigger>
    <SelectContent>
      {usuariosDisponibles.map((u) => (
        <SelectItem key={u.usuario_id} value={u.usuario_id}>
          {u.nombre} ({u.email})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

### 2. Agregar Selector de Miembros Iniciales en EquipoFormModal

**Archivo: `src/components/modals/EquipoFormModal.tsx`**

Agregar un selector multi-usuario para añadir miembros al crear un equipo.

**Nuevo estado para miembros seleccionados:**
```typescript
const [selectedMiembros, setSelectedMiembros] = useState<string[]>([]);
```

**Nuevo componente de selección múltiple:**
```tsx
<div className="space-y-2">
  <Label>Miembros Iniciales (opcional)</Label>
  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
    {usuarios
      .filter((u) => u.usuario_id !== formData.lider_usuario_id)
      .map((u) => (
        <div key={u.usuario_id} className="flex items-center gap-2">
          <Checkbox
            id={`miembro-${u.usuario_id}`}
            checked={selectedMiembros.includes(u.usuario_id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedMiembros([...selectedMiembros, u.usuario_id]);
              } else {
                setSelectedMiembros(
                  selectedMiembros.filter((id) => id !== u.usuario_id)
                );
              }
            }}
          />
          <Label htmlFor={`miembro-${u.usuario_id}`} className="font-normal">
            {u.nombre} ({u.email})
          </Label>
        </div>
      ))}
  </div>
  <p className="text-xs text-muted-foreground">
    Los miembros seleccionados serán agregados al equipo
  </p>
</div>
```

**Lógica de submit actualizada:**
- Después de crear el equipo, agregar cada miembro seleccionado con `addMiembro`

---

## Flujo de Usuario

### Al Crear Equipo:
1. Usuario llena nombre, descripción, sucursal
2. Selecciona un líder del dropdown
3. Marca los usuarios adicionales como miembros (checkboxes)
4. Al guardar: crea equipo → agrega miembros uno por uno

### Al Agregar Miembro (Modal Detalle):
1. Usuario hace clic en "Agregar"
2. Ve dropdown con usuarios disponibles (excluye los que ya son miembros)
3. Selecciona usuario por nombre
4. Opcionalmente asigna rol
5. Confirma y el miembro se agrega

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/modals/EquipoDetailModal.tsx` | Reemplazar Input UUID por Select de usuarios |
| `src/components/modals/EquipoFormModal.tsx` | Agregar checkboxes para seleccionar miembros iniciales |

---

## Consideraciones Técnicas

- Se filtra la lista para no mostrar usuarios que ya son miembros
- Se filtra el líder de la lista de miembros (para evitar duplicados)
- Los miembros se agregan secuencialmente después de crear el equipo
- Si falla agregar un miembro, se muestra error pero el equipo ya está creado

