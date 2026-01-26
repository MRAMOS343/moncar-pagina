
# Plan: Corregir Errores 400/500 en Formulario de Equipos

## Diagnostico Confirmado

Basado en el analisis de la respuesta de la API de equipos:
- El equipo existente usa `sucursal_id: "00000000-0000-0000-0000-000000000001"` (UUID completo)
- El formulario actual envia `sucursal_id: null` cuando no se selecciona ninguna sucursal (linea 91)
- El backend rechaza con error 400 "SUCURSAL_REQUIRED"

## Solucion Recomendada: Validacion Frontend + UX Mejorada

La mejor solucion es **prevenir el envio de datos invalidos desde el frontend** con validacion clara y mensajes de error amigables.

---

## Cambios a Implementar

### 1. Marcar Sucursal como Campo Requerido en UI

**Archivo:** `src/components/modals/EquipoFormModal.tsx`

Cambios:
- Agregar asterisco (*) al label de Sucursal
- Mostrar mensaje de error si no se selecciona sucursal
- Deshabilitar boton "Crear/Actualizar" si sucursal esta vacia

```text
Antes:  <Label htmlFor="sucursal">Sucursal</Label>
Despues: <Label htmlFor="sucursal">Sucursal *</Label>
```

### 2. Agregar Validacion en handleSubmit

**Archivo:** `src/components/modals/EquipoFormModal.tsx`

Agregar validacion antes de enviar:

```typescript
// Agregar estado para errores
const [errors, setErrors] = useState<{ sucursal?: string }>({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validaciones
  const newErrors: { sucursal?: string } = {};
  
  if (!formData.nombre.trim()) {
    return;
  }
  
  if (!formData.sucursal_id) {
    newErrors.sucursal = "Debes seleccionar una sucursal";
    setErrors(newErrors);
    return;
  }
  
  setErrors({});
  
  // Solo enviar sucursal_id si tiene valor (nunca null en creacion)
  const payload = {
    nombre: formData.nombre.trim(),
    descripcion: formData.descripcion.trim() || null,
    lider_usuario_id: formData.lider_usuario_id.trim() || null,
    sucursal_id: formData.sucursal_id, // Ya validamos que no esta vacio
    ...(isEditing && { activo: formData.activo }),
  };
  
  // ... resto igual
};
```

### 3. Mostrar Error Visual en Campo Sucursal

**Archivo:** `src/components/modals/EquipoFormModal.tsx`

Agregar mensaje de error debajo del Select:

```tsx
<div className="space-y-2">
  <Label htmlFor="sucursal">Sucursal *</Label>
  <Select
    value={formData.sucursal_id}
    onValueChange={(value) => {
      setFormData({ ...formData, sucursal_id: value });
      if (errors.sucursal) setErrors({ ...errors, sucursal: undefined });
    }}
    disabled={isPending || loadingWarehouses || (!isAdmin && isGerente)}
  >
    <SelectTrigger className={errors.sucursal ? "border-destructive" : ""}>
      <SelectValue placeholder="Seleccionar sucursal" />
    </SelectTrigger>
    <SelectContent>
      {warehouses.map((w) => (
        <SelectItem key={w.id} value={w.id}>
          {w.nombre}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {errors.sucursal && (
    <p className="text-sm text-destructive">{errors.sucursal}</p>
  )}
  {!isAdmin && isGerente && (
    <p className="text-xs text-muted-foreground">
      Solo puedes crear equipos en tu sucursal asignada
    </p>
  )}
</div>
```

### 4. Deshabilitar Boton si Falta Sucursal

**Archivo:** `src/components/modals/EquipoFormModal.tsx`

```tsx
<Button 
  type="submit" 
  disabled={isPending || !formData.nombre.trim() || !formData.sucursal_id}
>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isEditing ? "Actualizar" : "Crear"}
</Button>
```

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/modals/EquipoFormModal.tsx` | Agregar validacion, mensajes de error, y deshabilitar boton |

## Beneficios de Esta Solucion

1. **Previene errores 400**: El usuario no puede enviar sin sucursal
2. **UX clara**: Mensaje de error visible y campo resaltado en rojo
3. **Boton deshabilitado**: Indicador visual de que falta informacion
4. **Consistente**: Sigue el patron de validacion del resto de la app
5. **No requiere cambios en backend**: Solo ajustes en frontend

## Nota sobre Error 500

Los errores 500 probablemente ocurren cuando:
- Se envia un `lider_usuario_id` invalido (UUID que no existe)
- El backend tiene un error no manejado

**Recomendacion adicional**: Agregar validacion de formato UUID para el campo `lider_usuario_id` (opcional, pero mejoraria la robustez).
