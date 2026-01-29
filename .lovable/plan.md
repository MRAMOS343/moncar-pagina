

# Plan: Búsqueda Desordenada por Palabras en Notas del Producto

## Objetivo

Modificar la lógica de búsqueda para que al buscar en el campo `notes`, cada palabra del término de búsqueda se evalúe independientemente. Esto permitirá encontrar productos sin importar el orden en que el usuario escriba las palabras.

## Ejemplo de Comportamiento

| Notas del Producto | Búsqueda | Actual | Nuevo |
|--------------------|----------|--------|-------|
| "BANDA MICRO V FORD AEROSTAR 1986-1997" | "FORD BANDA" | No encuentra | Encuentra |
| "BANDA MICRO V FORD AEROSTAR 1986-1997" | "AEROSTAR 1997" | No encuentra | Encuentra |
| "ACEITE MOTOR 5W30 SINTETICO" | "SINTETICO 5W30" | No encuentra | Encuentra |

## Lógica Propuesta

```text
Término de búsqueda: "FORD BANDA AEROSTAR"
                           ↓
         Separar en palabras: ["ford", "banda", "aerostar"]
                           ↓
         Verificar que TODAS las palabras existan en notes
                           ↓
         "BANDA MICRO V FORD AEROSTAR" contiene las 3 → Coincide
```

## Cambio Técnico

**Archivo:** `src/pages/InventarioPage.tsx`

```typescript
// Antes (búsqueda secuencial)
result = result.filter(item => 
  item.sku.toLowerCase().includes(searchLower) ||
  (item.notes && item.notes.toLowerCase().includes(searchLower))
);

// Después (búsqueda por palabras en notes)
const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);

result = result.filter(item => {
  // Para SKU: búsqueda exacta/secuencial (mantener comportamiento actual)
  if (item.sku.toLowerCase().includes(searchLower)) {
    return true;
  }
  
  // Para notes: búsqueda por palabras (todas deben coincidir)
  if (item.notes) {
    const notesLower = item.notes.toLowerCase();
    return searchWords.every(word => notesLower.includes(word));
  }
  
  return false;
});
```

## Comportamiento Detallado

| Campo | Tipo de Búsqueda | Razón |
|-------|------------------|-------|
| `sku` | Secuencial (contains) | Los SKUs son códigos específicos, el orden importa |
| `notes` | Por palabras (all words match) | Descripciones largas, el usuario puede no recordar el orden |

## Casos Especiales

- **Una sola palabra:** Funciona igual que antes (ej: "FORD" encuentra todo con "FORD")
- **Palabras repetidas:** Se ignoran duplicados naturalmente
- **Espacios extra:** Se normalizan automáticamente con `split(/\s+/)`

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/InventarioPage.tsx` | Actualizar lógica de filtrado en `filteredProducts` (líneas 104-114) |

