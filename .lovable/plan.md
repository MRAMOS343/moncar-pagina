
# Plan: Implementacion Completa del Modulo de Equipos

## Resumen Ejecutivo

Transformar la pagina de Equipos existente (que usa datos mock) a un modulo completo integrado con la API real del backend. Esto incluye tipos TypeScript, servicio de API, hooks de React Query y UI con CRUD completo + gestion de miembros.

---

## Pre-requisitos Verificados

Los patrones existentes en el proyecto ya estan claros:

| Componente | Ubicacion | Patron |
|------------|-----------|--------|
| Token de autenticacion | `AuthContext` via `useAuth()` | `const { token } = useAuth()` |
| Cliente API | `src/services/apiClient.ts` | `apiRequest<T>(path, opts)` con Authorization header automatico |
| API Base URL | `.env.local` | `VITE_API_BASE_URL=https://api.grupomonzalvo.mx` |
| Fetch pattern | `salesService.ts`, `productService.ts` | Funciones async que reciben token y params |
| Mutations | `useProductMutations.ts`, `useInventoryMutations.ts` | `useMutation` con invalidacion de queries |
| Sucursales | `useWarehouses.ts` | Hook existente para obtener warehouses activos |

---

## Archivos a Crear

### 1. Tipos TypeScript: `src/types/equipos.ts`

Definir interfaces alineadas con la respuesta de la API:

```typescript
// Item de lista (GET /equipos)
export interface EquipoListItem {
  equipo_id: string;
  nombre: string;
  descripcion: string | null;
  lider_usuario_id: string | null;
  lider_nombre: string | null;
  sucursal_id: string | null;
  sucursal_nombre: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  total_miembros: number;
}

// Miembro de equipo
export interface EquipoMiembro {
  usuario_id: string;
  nombre: string;
  email: string;
  rol_equipo: string;
  fecha_ingreso: string;
}

// Detalle con miembros (GET /equipos/:id)
export interface EquipoDetail extends EquipoListItem {
  miembros: EquipoMiembro[];
}

// Respuestas de API
export interface EquiposListResponse {
  ok: true;
  items: EquipoListItem[];
  next_cursor: string | null;
}

export interface EquipoDetailResponse {
  ok: true;
  equipo: EquipoDetail;
}

// Requests para mutaciones
export interface CreateEquipoRequest {
  nombre: string;
  descripcion?: string;
  lider_usuario_id?: string | null;
  sucursal_id?: string | null;
}

export interface UpdateEquipoRequest {
  nombre?: string;
  descripcion?: string | null;
  lider_usuario_id?: string | null;
  sucursal_id?: string | null;
  activo?: boolean;
}

export interface AddMiembroRequest {
  usuario_id: string;
  rol_equipo?: string;
}

// Params para fetch
export interface FetchEquiposParams {
  limit?: number;
  cursor?: string;
  q?: string;
}
```

---

### 2. Servicio de API: `src/services/equipoService.ts`

Siguiendo el patron de `salesService.ts` y `productService.ts`:

```typescript
import { apiRequest } from "./apiClient";
import type { 
  EquiposListResponse, 
  EquipoDetailResponse,
  CreateEquipoRequest,
  UpdateEquipoRequest,
  AddMiembroRequest,
  FetchEquiposParams 
} from "@/types/equipos";

// GET /equipos?limit=&cursor=&q=
export async function fetchEquipos(
  token: string,
  params: FetchEquiposParams = {}
): Promise<EquiposListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit ?? 20));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  
  return apiRequest<EquiposListResponse>(`/equipos?${searchParams}`, { token });
}

// GET /equipos/:id
export async function fetchEquipoById(
  token: string,
  id: string
): Promise<EquipoDetailResponse> {
  return apiRequest<EquipoDetailResponse>(`/equipos/${id}`, { token });
}

// POST /equipos
export async function createEquipo(
  token: string,
  data: CreateEquipoRequest
): Promise<{ ok: true; equipo: { equipo_id: string } }> {
  return apiRequest(`/equipos`, { method: "POST", token, body: data });
}

// PATCH /equipos/:id
export async function updateEquipo(
  token: string,
  id: string,
  data: UpdateEquipoRequest
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${id}`, { method: "PATCH", token, body: data });
}

// DELETE /equipos/:id (soft delete)
export async function deleteEquipo(
  token: string,
  id: string
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${id}`, { method: "DELETE", token });
}

// POST /equipos/:id/miembros
export async function addMiembro(
  token: string,
  equipoId: string,
  data: AddMiembroRequest
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${equipoId}/miembros`, { 
    method: "POST", token, body: data 
  });
}

// DELETE /equipos/:id/miembros/:usuario_id
export async function removeMiembro(
  token: string,
  equipoId: string,
  usuarioId: string
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${equipoId}/miembros/${usuarioId}`, { 
    method: "DELETE", token 
  });
}
```

---

### 3. Hook de Queries: `src/hooks/useEquipos.ts`

```typescript
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEquipos, fetchEquipoById } from "@/services/equipoService";
import type { FetchEquiposParams } from "@/types/equipos";

// Lista con paginacion
export function useEquipos(params: Omit<FetchEquiposParams, 'cursor'> = {}) {
  const { token } = useAuth();

  return useInfiniteQuery({
    queryKey: ["equipos", params.q, params.limit],
    queryFn: ({ pageParam }) => fetchEquipos(token!, { ...params, cursor: pageParam }),
    enabled: !!token,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Detalle de un equipo
export function useEquipoDetail(id: string | null, enabled: boolean = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["equipo", id],
    queryFn: () => fetchEquipoById(token!, id!),
    enabled: !!token && !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
```

---

### 4. Hook de Mutaciones: `src/hooks/useEquipoMutations.ts`

Siguiendo el patron de `useProductMutations.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/apiClient";
import { toast } from "@/hooks/use-toast";
import { 
  createEquipo, 
  updateEquipo, 
  deleteEquipo, 
  addMiembro, 
  removeMiembro 
} from "@/services/equipoService";
import type { CreateEquipoRequest, UpdateEquipoRequest, AddMiembroRequest } from "@/types/equipos";

// Manejo de errores estandarizado
function handleMutationError(error: unknown, defaultMsg: string) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      toast({ title: "Sin permisos", description: "No tienes permisos para esta accion", variant: "destructive" });
    } else if (error.status === 400) {
      toast({ title: "Error de validacion", description: error.message, variant: "destructive" });
    } else if (error.status === 404) {
      toast({ title: "No encontrado", description: "El equipo no existe", variant: "destructive" });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  } else {
    toast({ title: "Error", description: defaultMsg, variant: "destructive" });
  }
}

export function useCreateEquipo() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEquipoRequest) => createEquipo(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({ title: "Equipo creado", description: "El equipo se creo correctamente" });
    },
    onError: (error) => handleMutationError(error, "Error al crear equipo"),
  });
}

export function useUpdateEquipo() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipoRequest }) => 
      updateEquipo(token!, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      queryClient.invalidateQueries({ queryKey: ["equipo", variables.id] });
      toast({ title: "Equipo actualizado", description: "Los cambios se guardaron" });
    },
    onError: (error) => handleMutationError(error, "Error al actualizar equipo"),
  });
}

export function useDeleteEquipo() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEquipo(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({ title: "Equipo eliminado", description: "El equipo fue desactivado" });
    },
    onError: (error) => handleMutationError(error, "Error al eliminar equipo"),
  });
}

export function useAddMiembro() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ equipoId, data }: { equipoId: string; data: AddMiembroRequest }) => 
      addMiembro(token!, equipoId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipo", variables.equipoId] });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({ title: "Miembro agregado", description: "Se agrego el miembro al equipo" });
    },
    onError: (error) => handleMutationError(error, "Error al agregar miembro"),
  });
}

export function useRemoveMiembro() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ equipoId, usuarioId }: { equipoId: string; usuarioId: string }) => 
      removeMiembro(token!, equipoId, usuarioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipo", variables.equipoId] });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({ title: "Miembro eliminado", description: "Se quito el miembro del equipo" });
    },
    onError: (error) => handleMutationError(error, "Error al quitar miembro"),
  });
}
```

---

## Archivos a Modificar

### 5. Reescribir: `src/pages/EquiposPage.tsx`

Cambios principales:
- Eliminar uso de `useData()` y datos mock
- Integrar `useEquipos()` para fetch real
- Agregar debounce en busqueda con `useDebounce`
- Implementar modales para crear/editar
- Agregar dialog de confirmacion para eliminar
- Implementar control de permisos segun rol
- Agregar paginacion por cursor ("Cargar mas")

Estructura del componente:

```text
EquiposPage
├── Header con titulo y boton "Crear Equipo" (oculto para cajero)
├── Barra de busqueda con debounce
├── Grid de Cards de equipos
│   └── Cada card muestra: nombre, sucursal, lider, total_miembros, badge activo
│   └── Botones: Ver Detalle, Editar (admin/gerente), Eliminar (admin)
├── Boton "Cargar mas" si hay next_cursor
├── Modal crear/editar equipo (EquipoFormModal)
├── Dialog de confirmacion para eliminar
└── Estado vacio si no hay equipos
```

Control de permisos en UI:
- **admin**: Ve todo, puede crear/editar/eliminar
- **gerente**: Puede crear/editar (su sucursal), no puede eliminar
- **cajero**: Solo lectura, sin botones de mutacion

---

### 6. Crear Componente Modal: `src/components/modals/EquipoFormModal.tsx`

Modal reutilizable para crear y editar equipos:

```text
EquipoFormModal
├── Props: open, onOpenChange, equipo? (para edicion)
├── Campos:
│   ├── nombre (required, Input)
│   ├── descripcion (optional, Textarea)
│   ├── lider_usuario_id (optional, Select/Input - ver nota abajo)
│   ├── sucursal_id (Select de useWarehouses, disabled si no es admin)
│   └── activo (Switch, solo en edicion para admin/gerente)
├── Validacion con zod
└── Llama useCreateEquipo o useUpdateEquipo
```

**Nota sobre Select de usuarios:**
- Si existe endpoint `/usuarios?q=`, implementar `useUsuarios` similar a `useWarehouses`
- Si no existe, usar Input de texto para pegar `usuario_id` manualmente como solucion temporal

---

### 7. Crear Componente: `src/components/modals/EquipoDetailModal.tsx`

Modal o drawer para ver detalle del equipo y gestionar miembros:

```text
EquipoDetailModal
├── Props: equipoId, open, onOpenChange
├── Usa useEquipoDetail(equipoId)
├── Seccion info general:
│   ├── Nombre, descripcion
│   ├── Sucursal, lider
│   └── Fechas de creacion/actualizacion
├── Tabla de miembros:
│   ├── Columnas: nombre, email, rol_equipo, fecha_ingreso
│   └── Boton "Quitar" por fila (usa useRemoveMiembro)
├── Boton "Agregar miembro" (abre sub-dialog)
│   ├── Input/Select para usuario_id
│   ├── Input para rol_equipo
│   └── Llama useAddMiembro
└── Control de permisos: botones ocultos para cajero
```

---

### 8. Crear Servicio de Usuarios (opcional): `src/services/userService.ts`

Si el backend tiene endpoint `/usuarios`:

```typescript
export async function fetchUsuarios(
  token: string,
  params: { q?: string; limit?: number } = {}
): Promise<{ ok: true; items: { usuario_id: string; nombre: string; email: string }[] }> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit ?? 50));
  if (params.q) searchParams.set("q", params.q);
  return apiRequest(`/usuarios?${searchParams}`, { token });
}
```

Y hook correspondiente `useUsuarios` para selects.

---

### 9. Agregar ruta de detalle (opcional): `src/main.tsx`

Si se prefiere pagina separada en lugar de modal:

```typescript
// Agregar despues de path: "equipos"
{
  path: "equipos/:equipoId",
  element: (
    <Suspense fallback={<PageLoader />}>
      <EquipoDetailPage />
    </Suspense>
  ),
},
```

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/types/equipos.ts` | CREAR | Interfaces TypeScript |
| `src/services/equipoService.ts` | CREAR | Funciones de API |
| `src/hooks/useEquipos.ts` | CREAR | Hooks de queries |
| `src/hooks/useEquipoMutations.ts` | CREAR | Hooks de mutaciones |
| `src/pages/EquiposPage.tsx` | REESCRIBIR | Lista + busqueda + modales |
| `src/components/modals/EquipoFormModal.tsx` | CREAR | Modal crear/editar |
| `src/components/modals/EquipoDetailModal.tsx` | CREAR | Modal detalle + miembros |
| `src/services/userService.ts` | CREAR (opcional) | API de usuarios |
| `src/hooks/useUsuarios.ts` | CREAR (opcional) | Hook para select usuarios |

---

## Orden de Implementacion

1. `src/types/equipos.ts` - Tipos base
2. `src/services/equipoService.ts` - Servicio de API
3. `src/hooks/useEquipos.ts` - Hooks de queries
4. `src/hooks/useEquipoMutations.ts` - Hooks de mutaciones
5. `src/components/modals/EquipoFormModal.tsx` - Modal de formulario
6. `src/pages/EquiposPage.tsx` - Reescribir pagina principal
7. `src/components/modals/EquipoDetailModal.tsx` - Modal de detalle
8. (Opcional) `src/services/userService.ts` + `useUsuarios.ts` - Si hay endpoint de usuarios

---

## Criterios de Aceptacion

- [ ] Lista de equipos carga desde API real (`GET /equipos`)
- [ ] Busqueda con debounce funciona (parametro `q`)
- [ ] Paginacion por cursor funciona ("Cargar mas")
- [ ] Modal crear equipo funciona (admin/gerente)
- [ ] Modal editar equipo funciona (admin/gerente)
- [ ] Eliminar equipo funciona con confirmacion (solo admin)
- [ ] Ver detalle muestra info + lista de miembros
- [ ] Agregar miembro funciona
- [ ] Quitar miembro funciona
- [ ] Cajero solo ve lista/detalle sin botones de mutacion
- [ ] Errores 400/403/404 muestran toast apropiado
- [ ] Network tab muestra requests con Authorization header

---

## Consideraciones Tecnicas

**Endpoint de usuarios:**
- Si no existe `/usuarios`, el select de lider mostrara un input de texto donde el admin puede pegar el `usuario_id` manualmente
- Esto es temporal hasta que se implemente el endpoint

**Permisos:**
- La logica de permisos en UI es "cosmetic" (oculta botones)
- El backend ya valida permisos reales y retorna 403 si no aplica

**Cache:**
- Equipos tienen `staleTime: 2min` para balance entre frescura y rendimiento
- Al mutar, se invalidan queries relacionadas para refetch automatico
