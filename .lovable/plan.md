
# Plan: Implementar Configuración con Endpoints Reales del Backend

## Resumen

Conectar la página de Configuración con los endpoints del backend para que las preferencias de usuario, settings de empresa e inventario se persistan realmente en la base de datos.

## Endpoints Disponibles

| Endpoint | Método | Propósito | Acceso |
|----------|--------|-----------|--------|
| `/users/me/preferences` | GET | Obtener preferencias del usuario | Todos |
| `/users/me/preferences` | PATCH | Actualizar preferencias | Todos |
| `/users/me/profile` | PATCH | Actualizar nombre/teléfono | Todos |
| `/settings/company` | GET/PATCH | Configuración de empresa | admin, gerente |
| `/settings/inventory` | GET/PATCH | Configuración de inventario | admin, gerente |

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────┐
│                      ConfiguracionPage                       │
├────────────┬────────────┬────────────┬────────────┬─────────┤
│   Perfil   │  Empresa   │ Inventario │   Roles    │ Sistema │
│ (todos)    │(admin/ger) │(admin/ger) │ (solo ver) │(info)   │
└─────┬──────┴─────┬──────┴─────┬──────┴────────────┴─────────┘
      │            │            │
      ▼            ▼            ▼
┌──────────┐ ┌───────────┐ ┌──────────────┐
│useProfile│ │useCompany │ │useInventory  │
│   hook   │ │Settings   │ │Settings hook │
└─────┬────┘ └─────┬─────┘ └──────┬───────┘
      │            │              │
      ▼            ▼              ▼
┌─────────────────────────────────────────┐
│           settingsService.ts            │
│  (fetchPreferences, patchProfile, etc)  │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│            apiClient.ts                 │
│    (ya existente, con JWT auth)         │
└─────────────────────────────────────────┘
```

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/types/settings.ts` | Tipos para preferencias y settings |
| `src/services/settingsService.ts` | Funciones para llamar a los endpoints |
| `src/hooks/useSettings.ts` | Hooks de React Query para settings |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/ConfiguracionPage.tsx` | Conectar con hooks reales, control de acceso |

## Detalles Técnicos

### 1. Crear tipos en `src/types/settings.ts`

```typescript
// Preferencias del usuario (notificaciones, etc)
export interface UserPreferences {
  alert_stock_bajo: boolean;
  alert_nuevas_ventas: boolean;
  alert_nuevos_proveedores: boolean;
  alert_reportes_diarios: boolean;
}

export interface UserPreferencesResponse {
  ok: true;
  item: UserPreferences;
}

// Perfil del usuario (nombre, teléfono)
export interface UserProfileUpdate {
  nombre?: string;
  telefono?: string;
  avatar_url?: string;
}

export interface UserProfileResponse {
  ok: true;
  item: {
    usuario_id: string;
    nombre: string;
    email: string;
    telefono?: string;
    avatar_url?: string;
  };
}

// Settings de empresa
export interface CompanySettings {
  nombre_empresa: string;
  rfc: string;
  direccion: string;
  telefono: string;
}

export interface CompanySettingsResponse {
  ok: true;
  item: CompanySettings;
}

// Settings de inventario
export interface InventorySettings {
  stock_minimo_global: number;
  alertas_activas: boolean;
  formato_sku: string;
}

export interface InventorySettingsResponse {
  ok: true;
  item: InventorySettings;
}
```

### 2. Crear servicio `src/services/settingsService.ts`

```typescript
import { apiRequest } from "./apiClient";
import type { 
  UserPreferencesResponse, 
  UserPreferences,
  UserProfileUpdate,
  UserProfileResponse,
  CompanySettingsResponse, 
  CompanySettings,
  InventorySettingsResponse,
  InventorySettings
} from "@/types/settings";

// === Preferencias del usuario ===
export async function fetchUserPreferences(token: string): Promise<UserPreferencesResponse> {
  return apiRequest<UserPreferencesResponse>("/users/me/preferences", { token });
}

export async function patchUserPreferences(
  token: string, 
  data: Partial<UserPreferences>
): Promise<UserPreferencesResponse> {
  return apiRequest<UserPreferencesResponse>("/users/me/preferences", {
    method: "PATCH",
    token,
    body: data,
  });
}

// === Perfil del usuario ===
export async function patchUserProfile(
  token: string, 
  data: UserProfileUpdate
): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>("/users/me/profile", {
    method: "PATCH",
    token,
    body: data,
  });
}

// === Settings de empresa (admin/gerente) ===
export async function fetchCompanySettings(token: string): Promise<CompanySettingsResponse> {
  return apiRequest<CompanySettingsResponse>("/settings/company", { token });
}

export async function patchCompanySettings(
  token: string, 
  data: Partial<CompanySettings>
): Promise<CompanySettingsResponse> {
  return apiRequest<CompanySettingsResponse>("/settings/company", {
    method: "PATCH",
    token,
    body: data,
  });
}

// === Settings de inventario (admin/gerente) ===
export async function fetchInventorySettings(token: string): Promise<InventorySettingsResponse> {
  return apiRequest<InventorySettingsResponse>("/settings/inventory", { token });
}

export async function patchInventorySettings(
  token: string, 
  data: Partial<InventorySettings>
): Promise<InventorySettingsResponse> {
  return apiRequest<InventorySettingsResponse>("/settings/inventory", {
    method: "PATCH",
    token,
    body: data,
  });
}
```

### 3. Crear hooks `src/hooks/useSettings.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchUserPreferences, patchUserPreferences, patchUserProfile,
  fetchCompanySettings, patchCompanySettings,
  fetchInventorySettings, patchInventorySettings
} from "@/services/settingsService";

// Hook para preferencias del usuario
export function useUserPreferences() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["user-preferences"],
    queryFn: () => fetchUserPreferences(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.item,
  });
}

export function useUpdatePreferences() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) => 
      patchUserPreferences(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
}

export function useUpdateProfile() {
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: (data: UserProfileUpdate) => 
      patchUserProfile(token!, data),
  });
}

// Hook para settings de empresa (solo admin/gerente)
export function useCompanySettings() {
  const { token, currentUser } = useAuth();
  const canAccess = currentUser?.role === 'admin' || currentUser?.role === 'gerente';
  
  return useQuery({
    queryKey: ["company-settings"],
    queryFn: () => fetchCompanySettings(token!),
    enabled: !!token && canAccess,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.item,
  });
}

export function useUpdateCompanySettings() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<CompanySettings>) => 
      patchCompanySettings(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
    },
  });
}

// Hook para settings de inventario (solo admin/gerente)
export function useInventorySettings() {
  const { token, currentUser } = useAuth();
  const canAccess = currentUser?.role === 'admin' || currentUser?.role === 'gerente';
  
  return useQuery({
    queryKey: ["inventory-settings"],
    queryFn: () => fetchInventorySettings(token!),
    enabled: !!token && canAccess,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.item,
  });
}

export function useUpdateInventorySettings() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<InventorySettings>) => 
      patchInventorySettings(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-settings"] });
    },
  });
}
```

### 4. Actualizar `ConfiguracionPage.tsx`

Cambios principales:

1. **Importar hooks**: Reemplazar estados locales con queries reales
2. **Control de acceso por rol**: 
   - Pestañas Empresa/Inventario solo visibles para admin/gerente
   - Si es cajero, solo ve Perfil, Notificaciones y Sistema
3. **Loading states**: Mostrar skeletons mientras cargan datos
4. **Manejo de errores**: Mostrar toast en caso de error
5. **Optimistic updates**: Actualizar UI inmediatamente

Ejemplo de cambio para notificaciones:

```typescript
// Antes (estado local):
const [notifications, setNotifications] = useState({ stockBajo: true, ... });

// Después (hook real):
const { data: preferences, isLoading } = useUserPreferences();
const updatePrefs = useUpdatePreferences();

const handleToggle = (key: string, value: boolean) => {
  updatePrefs.mutate({ [key]: value }, {
    onSuccess: () => showSuccessToast("Preferencia actualizada"),
    onError: () => showErrorToast("Error al guardar"),
  });
};
```

### 5. Control de Acceso Visual

```typescript
const { currentUser } = useAuth();
const isAdmin = currentUser?.role === 'admin';
const isGerente = currentUser?.role === 'gerente';
const canManageSettings = isAdmin || isGerente;

// En TabsList:
<TabsTrigger value="empresa" disabled={!canManageSettings}>
  Empresa {!canManageSettings && "(Solo admin/gerente)"}
</TabsTrigger>
```

## Flujo de Datos

```text
Usuario abre Configuración
         │
         ▼
┌────────────────────────┐
│ useUserPreferences()   │ ← GET /users/me/preferences
│ useCompanySettings()*  │ ← GET /settings/company (si admin/gerente)
│ useInventorySettings()*│ ← GET /settings/inventory (si admin/gerente)
└───────────┬────────────┘
            │
            ▼
     Renderizar UI con datos
            │
            ▼
   Usuario cambia un toggle
            │
            ▼
┌────────────────────────┐
│ updatePrefs.mutate()   │ ← PATCH /users/me/preferences
└───────────┬────────────┘
            │
            ▼
   Toast éxito + invalidar cache
```

## Resultado Esperado

| Rol | Pestañas Visibles | Puede Editar |
|-----|-------------------|--------------|
| admin | Todas (5) | Todo |
| gerente | Todas (5) | Todo excepto crear usuarios |
| cajero | Perfil, Sistema (2) | Solo su perfil y notificaciones |

## Notas Técnicas

- El cliente HTTP (apiClient.ts) ya envía `Authorization: Bearer <token>` correctamente
- El rol del usuario se obtiene del AuthContext (viene del login/me)
- React Query maneja cache y refetch automáticamente
- Los endpoints devuelven `{ ok: true, item: {...} }` según el patrón del backend
