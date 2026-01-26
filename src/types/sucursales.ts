export interface Sucursal {
  codigo: string;     // "moncar"
  nombre: string;     // "Moncar"
  direccion?: string;
  telefono?: string;
  activo: boolean;
}

export interface SucursalesListResponse {
  ok: true;
  items: Sucursal[];
}
