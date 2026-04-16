export interface UsuarioListItem {
  usuario_id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  activated_at: string | null;
  sucursal_id: string | null;
  sucursal_nombre: string | null;
}

export interface UsuariosListResponse {
  ok: true;
  items: UsuarioListItem[];
}
