
# Plan: Actualizar Placeholder del Campo "Línea"

## Contexto

El campo "Línea" solo existe como Input de texto en `ProductEditModal.tsx`. En el otro formulario (`ProductModal.tsx`) el concepto equivalente es "Categoría" pero usa un dropdown, no un campo de texto.

## Cambio a Realizar

**Archivo: `src/components/modals/ProductEditModal.tsx`**

Cambiar el placeholder en la línea 153:

```typescript
// Antes
<Input id="linea" {...register('linea')} placeholder="Ej: Galaxy" />

// Después  
<Input id="linea" {...register('linea')} placeholder="Ej: Aceite" />
```

## Resultado

El campo "Línea" mostrará "Ej: Aceite" como ejemplo de placeholder.

| Archivo | Campo | Placeholder |
|---------|-------|-------------|
| `ProductEditModal.tsx` | Línea | ✅ "Ej: Aceite" |
| `ProductModal.tsx` | Categoría | N/A (es dropdown, no Input) |
