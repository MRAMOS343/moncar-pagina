export interface CotizacionItem {
  sku: string;
  descripcion: string;
  pieza: string;
  precioUnitario: number;
  cantidad: number;
  total: number;
}

export type CotizacionEstado = 'pendiente' | 'concretada' | 'cancelada';

export interface Cotizacion {
  id: string;
  folio: string;
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
