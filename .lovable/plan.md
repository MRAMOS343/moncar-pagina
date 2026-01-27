
# Plan: Unificar Placeholder de Marca en Todos los Formularios de Productos

## Contexto

Actualmente hay dos formularios de productos con diferentes placeholders para el campo "Marca":

| Archivo | Placeholder Actual |
|---------|-------------------|
| `ProductModal.tsx` | ✅ "Ej: Roshfrans" (ya actualizado) |
| `ProductEditModal.tsx` | ❌ "Ej: Samsung" |

## Cambio a Realizar

**Archivo: `src/components/modals/ProductEditModal.tsx`**

Cambiar el placeholder en la línea 149:

```typescript
// Antes
<Input id="marca" {...register('marca')} placeholder="Ej: Samsung" />

// Después
<Input id="marca" {...register('marca')} placeholder="Ej: Roshfrans" />
```

## Resultado

Ambos formularios de productos mostrarán consistentemente "Ej: Roshfrans" como ejemplo de marca.
