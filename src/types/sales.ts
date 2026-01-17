/**
 * Tipos para la API de Ventas
 * Los montos vienen como string desde Postgres (numeric)
 */

// Cursor compuesto para paginación
export interface SalesCursor {
  cursor_fecha: string;
  cursor_venta_id: number;
}

// Respuesta de GET /sales (lista)
export interface SalesListResponse {
  ok: boolean;
  items: SaleListItem[];
  next_cursor: SalesCursor | null;
  limit: number;
}

// SOLO campos que realmente devuelve /sales (lista)
export interface SaleListItem {
  venta_id: number;
  fecha_emision: string;
  sucursal_id: string;
  caja_id: string;
  subtotal: string;      // Postgres numeric viene como string
  impuesto: string;
  total: string;
  cancelada: boolean;
}

// Respuesta de GET /sales/:venta_id (detalle)
export interface SaleDetailResponse {
  ok: boolean;
  venta: SaleDetail;
  lineas: SaleLineItem[];
  pagos: SalePayment[];
}

// Detalle SÍ incluye campos extra de cancelación
export interface SaleDetail extends SaleListItem {
  fecha_cancelacion?: string;
  motivo_cancelacion?: string;
}

export interface SaleLineItem {
  renglon: number;
  articulo: string;
  cantidad: string;
  precio_unitario: string;
  descuento: string;
  importe_linea: string;
  almacen_id: string;
}

export interface SalePayment {
  idx: number;
  metodo: string;
  monto: string;
}

export interface FetchSalesParams {
  from?: string;
  to?: string;
  sucursal_id?: string;
  include_cancelled?: boolean;
  cursor_fecha?: string;
  cursor_venta_id?: number;
  limit?: number;
}
