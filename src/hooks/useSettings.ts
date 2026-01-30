import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchUserPreferences, patchUserPreferences, patchUserProfile,
  fetchCompanySettings, patchCompanySettings,
  fetchInventorySettings, patchInventorySettings
} from "@/services/settingsService";
import type { 
  UserPreferences, 
  UserProfileUpdate, 
  CompanySettings, 
  InventorySettings 
} from "@/types/settings";

// === Preferencias del usuario ===
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UserProfileUpdate) => 
      patchUserProfile(token!, data),
    onSuccess: () => {
      // Refrescar datos del usuario si es necesario
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
}

// === Settings de empresa (solo admin/gerente) ===
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

// === Settings de inventario (solo admin/gerente) ===
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
