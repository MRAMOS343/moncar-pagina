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
