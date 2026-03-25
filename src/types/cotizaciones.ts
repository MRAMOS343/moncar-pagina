export interface CotizacionItem {
  sku: string;
  descripcion: string;
  pieza: string;
  precioUnitario: number;
  precioOriginal: number;
  cantidad: number;
  total: number;
}

export type CotizacionEstado = 'pendiente' | 'concretada' | 'cancelada';

export interface Cotizacion {
  id: string;
  folio: string;
  estado: CotizacionEstado;
  fecha: string;
  vendedorId: string;
  vendedorNombre: string;
  sucursal: string;
  cliente: string | null;
  cliente_nombre: string | null;
  cliente_empresa: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  subtotal: number;
  iva: number;
  total: number;
  creadaEn: string;
  items: CotizacionItem[];
}

export interface CreateCotizacionPayload {
  sucursal: string;
  cliente_nombre: string | null;
  cliente_empresa: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  subtotal: number;
  impuesto: number;
  total: number;
  lineas: {
    articulo: string;
    descripcion: string;
    pieza: string;
    cantidad: number;
    precio_unitario: number;
    precio_original: number;
    importe_linea: number;
  }[];
}
