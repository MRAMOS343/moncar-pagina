import { apiRequest } from './apiClient';
import type { Cotizacion, CotizacionEstado, CreateCotizacionPayload } from '@/types/cotizaciones';

interface ListResponse {
  items: Cotizacion[];
  total: number;
}

export async function fetchCotizaciones(params?: {
  estado?: CotizacionEstado;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<Cotizacion[]> {
  const sp = new URLSearchParams();
  if (params?.estado) sp.set('estado', params.estado);
  if (params?.q) sp.set('q', params.q);
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.offset) sp.set('offset', String(params.offset));
  const url = `/api/v1/cotizaciones${sp.toString() ? `?${sp}` : ''}`;
  const res = await apiRequest<ListResponse>(url);
  return res.items;
}

export async function createCotizacion(data: CreateCotizacionPayload): Promise<Cotizacion> {
  return apiRequest<Cotizacion>('/api/v1/cotizaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCotizacionEstado(
  id: string,
  estado: CotizacionEstado
): Promise<Cotizacion> {
  return apiRequest<Cotizacion>(`/api/v1/cotizaciones/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

export async function deleteCotizacion(id: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/v1/cotizaciones/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateCotizacion(id: string): Promise<Cotizacion> {
  return apiRequest<Cotizacion>(`/api/v1/cotizaciones/${id}/duplicar`, {
    method: 'POST',
  });
}
