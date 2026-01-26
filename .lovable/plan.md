
# Plan: Permitir Guardar sin Modificar Campos en ProductEditModal

## Problema Identificado

Los campos numéricos (Precio, Impuesto, Mínimo, Máximo) muestran error "Expected number, received string" porque:

1. Los inputs usan `defaultValue` (no controlados por react-hook-form)
2. El schema de Zod espera `z.number()` pero HTML inputs siempre retornan strings
3. `handleNumberChange` solo se ejecuta cuando el usuario modifica el campo
4. Si el usuario no toca nada y da "Guardar", react-hook-form no tiene los valores correctamente tipados

## Solución

### Opción Elegida: Usar `z.coerce.number()` + valores iniciales correctos

Cambiar el schema para que Zod automáticamente convierta strings a números, y asegurar que los valores iniciales se carguen correctamente.

## Cambios Requeridos

### Archivo: `src/components/modals/ProductEditModal.tsx`

**Cambio 1: Actualizar el schema con coerción automática**

```typescript
// ANTES
precio1: z.number().min(0, 'El precio debe ser positivo').optional(),
impuesto: z.number().min(0).max(100, 'El impuesto debe ser entre 0 y 100').optional(),
minimo: z.number().min(0, 'El mínimo debe ser positivo').optional(),
maximo: z.number().min(0, 'El máximo debe ser positivo').optional(),
costo_u: z.number().min(0, 'El costo debe ser positivo').optional(),

// DESPUÉS (con coerción y manejo de strings vacíos)
precio1: z.union([
  z.literal('').transform(() => undefined),
  z.coerce.number().min(0, 'El precio debe ser positivo')
]).optional(),
impuesto: z.union([
  z.literal('').transform(() => undefined),
  z.coerce.number().min(0).max(100, 'El impuesto debe ser entre 0 y 100')
]).optional(),
minimo: z.union([
  z.literal('').transform(() => undefined),
  z.coerce.number().min(0, 'El mínimo debe ser positivo')
]).optional(),
maximo: z.union([
  z.literal('').transform(() => undefined),
  z.coerce.number().min(0, 'El máximo debe ser positivo')
]).optional(),
costo_u: z.union([
  z.literal('').transform(() => undefined),
  z.coerce.number().min(0, 'El costo debe ser positivo')
]).optional(),
```

**Cambio 2: Usar `register()` en lugar de `defaultValue` + `onChange`**

Esto permite que react-hook-form maneje los valores directamente:

```tsx
// ANTES
<Input
  id="precio1"
  type="number"
  step="0.01"
  defaultValue={product.precio1 ?? ''}
  onChange={handleNumberChange('precio1')}
  placeholder="0.00"
/>

// DESPUÉS
<Input
  id="precio1"
  type="number"
  step="0.01"
  {...register('precio1')}
  placeholder="0.00"
/>
```

**Cambio 3: Eliminar `handleNumberChange` (ya no es necesario)**

La función `handleNumberChange` se puede eliminar porque Zod con `z.coerce.number()` se encarga de la conversión automáticamente.

## Resumen de Cambios

| Líneas | Cambio |
|--------|--------|
| 22-35 | Actualizar schema con `z.coerce.number()` y manejo de strings vacíos |
| 106-118 | Eliminar función `handleNumberChange` |
| 194-201, 208-215, 244-251, 258-265 | Cambiar inputs numéricos para usar `register()` |

## Resultado Esperado

1. El usuario puede abrir el modal y dar "Guardar" sin modificar nada (el modal se cierra sin errores)
2. Si no hay cambios, no se envía request a la API (comportamiento actual conservado)
3. Los errores de tipo "Expected number, received string" desaparecen
4. La validación de rangos (min/max) sigue funcionando correctamente

## Detalle Técnico

La clave es usar `z.union([z.literal(''), z.coerce.number()])` que:
- Si el valor es string vacío `''` → lo transforma a `undefined`
- Si el valor es un string numérico como `"30.00"` → lo convierte a número `30`
- Si el valor ya es número → lo mantiene
