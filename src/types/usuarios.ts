export interface UsuarioListItem {
  id: string;
  nombre: string;
  email: string;
  role?: string;
}

export interface UsuariosListResponse {
  ok: true;
  items: UsuarioListItem[];
}
