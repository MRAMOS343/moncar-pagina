export interface CotizacionItem {
  sku: string;
  descripcion: string;
  pieza: string;
  precioUnitario: number;
  cantidad: number;
  total: number;
}

export type CotizacionEstado = 'pendiente' | 'concretada' | 'cancelada';

export interface CotizacionCliente {
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  cliente_email: string | null;
  cliente_empresa: string | null;
}

export interface Cotizacion extends CotizacionCliente {
  id: string;
  folio: string;
  /** @deprecated use cliente_nombre */
  cliente: string;
  sucursal: string;
  vendedorId: string;
  vendedorNombre: string;
  fecha: string;
  items: CotizacionItem[];
  subtotal: number;
  iva: number;
  total: number;
  estado: CotizacionEstado;
  creadaEn: string;
}
