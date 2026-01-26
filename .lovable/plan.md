

# Plan: Corregir Dropdown de Sucursales usando `/warehouses`

## Diagnóstico

El endpoint `/sucursales` **NO existe** en el backend. El endpoint correcto es **`/warehouses`**, que ya funciona en otras partes de la aplicación.

La solución es modificar el servicio de sucursales para usar `/warehouses` y mapear la respuesta al formato esperado.

---

## Cambios a Implementar

### 1. Actualizar `sucursalService.ts` para usar `/warehouses`

**Archivo:** `src/services/sucursalService.ts`

Modificar para llamar al endpoint existente y transformar la respuesta:

```typescript
import { apiRequest } from "./apiClient";
import type { Sucursal, SucursalesListResponse } from "@/types/sucursales";

interface WarehouseResponse {
  id: string;     // Este es el código (ej: "moncar")
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export async function fetchSucursales(token: string): Promise<SucursalesListResponse> {
  // Usar el endpoint que SÍ existe
  const warehouses = await apiRequest<WarehouseResponse[]>("/warehouses?activo=true", { token });
  
  // Mapear id -> codigo para alinear con el formato de equipos
  const items: Sucursal[] = warehouses.map(w => ({
    codigo: w.id,      // El "id" del warehouse ES el código
    nombre: w.nombre,
    direccion: w.direccion,
    telefono: w.telefono,
    activo: true,
  }));
  
  return { ok: true, items };
}
```

---

## Por Qué Esta Solución

1. **No requiere cambios en el backend**: Usamos el endpoint `/warehouses` que ya existe
2. **Mantiene la arquitectura del plan anterior**: El resto del código de equipos sigue funcionando con `sucursal_codigo`
3. **Mapeo simple**: El campo `id` del warehouse contiene el código (ej: `"moncar"`), solo lo renombramos a `codigo`

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/services/sucursalService.ts` | Usar `/warehouses` y mapear respuesta |

---

## Resultado Esperado

1. El dropdown de sucursales mostrará las opciones (Moncar, etc.)
2. Al crear/editar equipo, se enviará `sucursal_codigo: "moncar"` al backend
3. No más errores 404 de `/sucursales`

