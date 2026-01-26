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
