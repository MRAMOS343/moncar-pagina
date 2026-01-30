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
