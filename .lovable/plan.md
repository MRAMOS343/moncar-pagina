

# Plan: Añadir Barra de Búsqueda en Inventario (SKU + Notas del Producto)

## Objetivo

Añadir una barra de búsqueda dedicada en la página de Inventario que permita buscar productos por:
- **SKU** del producto
- **Notas del producto** (campo `notes` que contiene descripciones como "BANDA MICRO V FORD AEROSTAR...")

## Situación Actual

La página de Inventario ya tiene:
- Una búsqueda global en el topbar que pasa `searchQuery` vía contexto
- El hook `useProducts` ya envía el parámetro `q` a la API
- Filtros de Marca y Línea en una tarjeta dedicada

Sin embargo, la API puede no buscar en el campo `notes`. Para garantizar la funcionalidad, implementaremos filtrado adicional en el cliente.

## Cambios a Realizar

### Archivo: `src/pages/InventarioPage.tsx`

1. **Añadir estado local para búsqueda**
   ```typescript
   const [localSearch, setLocalSearch] = useState('');
   const debouncedLocalSearch = useDebounce(localSearch, 300);
   ```

2. **Añadir Input de búsqueda en la sección de filtros**
   - Icono de lupa a la izquierda
   - Placeholder: "Buscar por SKU o notas del producto..."
   - Botón para limpiar búsqueda

3. **Modificar mapeo de productos para incluir `notes`**
   ```typescript
   interface ProductTableItem {
     // ... campos existentes
     notes: string | null; // Añadir campo notes
   }
   ```

4. **Implementar filtrado combinado (API + cliente)**
   - Enviar `debouncedLocalSearch` a la API (ya soportado con `q`)
   - Filtrar adicionalmente en el cliente por `notes` para garantizar cobertura

## Diseño Visual

```text
┌─────────────────────────────────────────────────────────────┐
│  Productos                                                  │
│  Catálogo de productos desde la API                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Filtros                                                    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🔍 [Buscar por SKU o notas del producto...           ] [X] │
│                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐   │
│  │ Marca       ▼ │ │ Línea       ▼ │ │ Limpiar Filtros │   │
│  └───────────────┘ └───────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Detalles Técnicos

### Lógica de Filtrado

```typescript
// Filtrar productos cargados por búsqueda local
const filteredProducts = useMemo(() => {
  let result = tableProducts;
  
  // Filtrar por búsqueda local (SKU o notes)
  if (debouncedLocalSearch) {
    const searchLower = debouncedLocalSearch.toLowerCase();
    result = result.filter(item => 
      item.sku.toLowerCase().includes(searchLower) ||
      (item.notes && item.notes.toLowerCase().includes(searchLower))
    );
  }
  
  // Filtros existentes de marca y categoría
  if (selectedMarca !== 'all') {
    result = result.filter(item => item.marca === selectedMarca);
  }
  if (selectedCategoria !== 'all') {
    result = result.filter(item => item.categoria === selectedCategoria);
  }
  
  return result;
}, [tableProducts, debouncedLocalSearch, selectedMarca, selectedCategoria]);
```

### Estrategia de Búsqueda

| Nivel | Acción | Campo |
|-------|--------|-------|
| API | `GET /products?q={búsqueda}` | SKU, descrip (según backend) |
| Cliente | Filtro adicional | `sku`, `notes` |

Esta estrategia dual garantiza que:
- Si la API busca en `notes`, los resultados llegan optimizados
- Si la API NO busca en `notes`, el filtro del cliente lo cubre

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/InventarioPage.tsx` | Añadir Input de búsqueda, estado local, lógica de filtrado |

## Comportamiento Esperado

1. Usuario escribe "BANDA MICRO" en la barra de búsqueda
2. Después de 300ms (debounce), se filtra la tabla
3. Se muestran productos donde:
   - SKU contiene "BANDA MICRO", O
   - Notas contienen "BANDA MICRO"
4. Los filtros de Marca/Línea se aplican sobre los resultados de búsqueda

