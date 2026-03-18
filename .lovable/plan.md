

# Diagnóstico: Búsqueda de productos en Cotizaciones

## Causa raíz

El formulario de cotizaciones (`CotizacionForm.tsx`) usa `useProducts({ q: debouncedSearch, limit: 10 })`, que envía el término de búsqueda al backend vía `GET /products?q=...&limit=10`.

El problema es doble:

1. **El parámetro `q` del backend probablemente solo busca por SKU** (o hace un match muy limitado), no por descripción ni marca. Cuando el usuario escribe "filtro de aceite", el backend no encuentra coincidencias porque busca en el campo SKU.

2. **No hay filtrado client-side de respaldo.** La página de Inventario ya resuelve esto con una estrategia dual: búsqueda server-side + filtro client-side adicional (documentado en la memoria del proyecto). El formulario de Cotizaciones no implementa esta segunda capa.

## Solución

Aplicar la misma estrategia dual que ya usa el módulo de Inventario:

### Cambios en `src/components/cotizaciones/CotizacionForm.tsx`

1. **Aumentar el límite de búsqueda** de 10 a 50 para tener más candidatos del servidor.

2. **Agregar filtrado client-side** sobre los resultados del API: filtrar `products` por SKU, `descrip`, y `marca` usando el término de búsqueda original (no el debounced), con lógica de palabras desordenadas (misma que inventario — todas las palabras del query deben aparecer en alguno de los campos, sin importar el orden).

3. **Limitar los resultados visibles** a 10 después del filtrado client-side para mantener el dropdown manejable.

### Lógica del filtro client-side

```text
Input: "aceite filtro"
→ palabras: ["aceite", "filtro"]
→ Para cada producto, concatenar: sku + descrip + marca
→ Match si TODAS las palabras aparecen en el texto concatenado
→ Mostrar máximo 10 resultados
```

Esto es consistente con el patrón ya establecido en `useInventarioGlobal` / la página de inventario.

