export interface DashboardKpisResponse {
  ok: boolean;
  ventas_totales: number;
  num_transacciones: number;
  ticket_promedio: number;
  ventas_canceladas: number;
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
