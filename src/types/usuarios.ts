export interface UsuarioListItem {
  usuario_id: string;
  nombre: string;
  email: string;
}

export interface UsuariosListResponse {
  ok: true;
  items: UsuarioListItem[];
}
