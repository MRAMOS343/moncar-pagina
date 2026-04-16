export interface Proveedor {
  proveedor_id: string;
  nombre:       string;
  contacto:     string;
  telefono:     string;
  email:        string;
  direccion:    string;
  rfc:          string;
  categorias:   string[];
  notas:        string;
  activo:       boolean;
  created_at:   string;
  updated_at:   string;
}

export interface ProveedoresListResponse {
  ok:         true;
  items:      Proveedor[];
  hasMore:    boolean;
  nextCursor: string | null;
}

export interface ProveedorDetailResponse {
  ok:   true;
  item: Proveedor;
}

export interface CreateProveedorRequest {
  nombre:      string;
  contacto?:   string;
  telefono?:   string;
  email?:      string;
  direccion?:  string;
  rfc?:        string;
  categorias?: string[];
  notas?:      string;
}

export interface PatchProveedorRequest {
  nombre?:     string;
  contacto?:   string;
  telefono?:   string;
  email?:      string;
  direccion?:  string;
  rfc?:        string;
  categorias?: string[];
  notas?:      string;
  activo?:     boolean;
}

export interface FetchProveedoresParams {
  activo?:  boolean;
  q?:       string;
  limit?:   number;
  cursor?:  string;
}
