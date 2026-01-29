

# Plan: Corregir useMemo con Side-Effect en DataTable

## Problema Identificado

**Archivo:** `src/components/ui/data-table.tsx` (líneas 112-115)

```typescript
// INCORRECTO - side-effect dentro de useMemo
useMemo(() => {
  setPaginaActual(1);
}, [datosProcesados.length]);
```

### Por qué es un problema

1. **Violación de reglas de React**: `useMemo` es para calcular valores derivados, NO para ejecutar efectos secundarios
2. **Comportamiento impredecible**: React puede ejecutar `useMemo` múltiples veces durante el render sin garantías de orden
3. **Warning en consola**: React detecta este patrón y genera warnings en desarrollo
4. **Bugs de paginación**: La página puede no resetearse correctamente en ciertas condiciones

## Solución

Cambiar `useMemo` por `useEffect`, que es el hook correcto para side-effects:

```typescript
// CORRECTO - side-effect dentro de useEffect
useEffect(() => {
  setPaginaActual(1);
}, [datosProcesados.length]);
```

## Cambios a Realizar

| Archivo | Cambio |
|---------|--------|
| `src/components/ui/data-table.tsx` | Línea 1: Añadir `useEffect` al import |
| `src/components/ui/data-table.tsx` | Líneas 112-115: Cambiar `useMemo` por `useEffect` |

## Código Final

### Import (línea 1)

```typescript
// Antes
import { useState, useMemo, memo } from "react";

// Después
import { useState, useMemo, memo, useEffect } from "react";
```

### Hook (líneas 112-115)

```typescript
// Antes
useMemo(() => {
  setPaginaActual(1);
}, [datosProcesados.length]);

// Después
useEffect(() => {
  setPaginaActual(1);
}, [datosProcesados.length]);
```

## Comportamiento Esperado

- Cuando cambia la cantidad de datos filtrados (`datosProcesados.length`), la paginación se resetea a la página 1
- El reset ocurre DESPUÉS del render, no durante (comportamiento correcto de efectos)
- Se elimina el warning de React en consola
- La paginación funciona de manera predecible y consistente

