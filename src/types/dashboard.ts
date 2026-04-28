export interface DashboardKpisResponse {
  ok: boolean;
  ventas_totales: number;
  num_transacciones: number;
  ticket_promedio: number;
  ventas_canceladas: number;
  cambio_ventas_pct: number | null;
  cambio_ventas_tipo: 'positive' | 'negative' | 'neutral';
  total_prev: number;
  cambio_transacciones_pct: number | null;
  cambio_transacciones_tipo: 'positive' | 'negative' | 'neutral';
  cambio_ticket_pct: number | null;
  cambio_ticket_tipo: 'positive' | 'negative' | 'neutral';
  from_cache?: boolean;
}

export interface TendenciaItem {
  fecha: string;
  total: number;
  num_ventas: number;
}

export interface DashboardTendenciaResponse {
  ok: boolean;
  data: TendenciaItem[];
  from_cache?: boolean;
}

export interface MetodoPagoItem {
  metodo: string;
  total: number;
  num_pagos: number;
  porcentaje: number;
}

export interface DashboardMetodosPagoResponse {
  ok: boolean;
  data: MetodoPagoItem[];
  from_cache?: boolean;
}

export interface TopProductoItem {
  sku: string;
  nombre: string;
  marca: string;
  unidades_vendidas: number;
  ingresos_totales: number;
  num_ventas: number;
}

export interface DashboardTopProductosResponse {
  ok: boolean;
  data: TopProductoItem[];
  from_cache?: boolean;
}
