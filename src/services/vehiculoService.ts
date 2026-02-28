import { apiRequest } from './apiClient';
import type { Ruta, Unidad, DocumentoUnidad, AlertaDocumento } from '@/types/vehiculos';

/* ── Mappers snake_case → camelCase ── */

function mapRuta(r: Record<string, unknown>): Ruta {
  return {
    id: r.ruta_id as string,
    nombre: r.nombre as string,
    descripcion: (r.descripcion as string) ?? '',
    activa: r.activa as boolean,
    creadoEn: r.creado_en as string,
    actualizadoEn: r.actualizado_en as string,
    unidadesCount: (r.unidades_count as number) ?? 0,
  };
}

function mapUnidad(u: Record<string, unknown>): Unidad {
  const raw = (u.estado as string) ?? 'activa';
  const estado: Unidad['estado'] = (raw === 'activa' || raw === 'taller' || raw === 'baja') ? raw : 'activa';
  return {
    id: u.unidad_id as string,
    rutaId: u.ruta_id as string,
    rutaNombre: u.ruta_nombre as string | undefined,
    numero: u.numero as string,
    placa: u.placa as string,
    marca: (u.marca as string) ?? '',
    modelo: (u.modelo as string) ?? '',
    anio: (u.anio as number) ?? 0,
    color: (u.color as string) ?? '',
    km: (u.km as number) ?? 0,
    estado,
    descripcion: (u.descripcion as string) ?? '',
    creadoEn: u.creado_en as string,
    actualizadoEn: u.actualizado_en as string,
  };
}

function mapDocumento(d: Record<string, unknown>): DocumentoUnidad {
  return {
    id: d.documento_id as string,
    unidadId: d.unidad_id as string,
    nombre: d.nombre as string,
    tipo: d.tipo as DocumentoUnidad['tipo'],
    notas: (d.notas as string) ?? '',
    fechaDocumento: (d.fecha_documento as string) ?? null,
    vigenciaHasta: (d.vigencia_hasta as string) ?? null,
    archivoId: (d.archivo_id as string) ?? null,
    creadoEn: d.creado_en as string,
    archivoNombre: (d.archivo_nombre as string) ?? null,
    archivoMime: (d.archivo_mime as string) ?? null,
    archivoBytes: (d.archivo_bytes as number) ?? null,
    archivoEstado: (d.archivo_estado as string) ?? null,
  };
}

function mapAlerta(a: Record<string, unknown>): AlertaDocumento {
  return {
    id: a.alerta_id as string,
    unidadId: a.unidad_id as string,
    tipoDocumento: a.tipo_documento as AlertaDocumento['tipoDocumento'],
    diasAntes: a.dias_antes as number,
    activa: a.activa as boolean,
    creadoEn: a.creado_en as string,
    actualizadoEn: a.actualizado_en as string,
  };
}

function getToken() {
  return localStorage.getItem('moncar_token');
}

/* ── Rutas ── */

export async function fetchRutas(): Promise<Ruta[]> {
  const res = await apiRequest<{ items: Record<string, unknown>[] }>('/vehiculos/rutas', { token: getToken() });
  return res.items.map(mapRuta);
}

export async function createRuta(data: { nombre: string; descripcion?: string; activa?: boolean }): Promise<string> {
  const res = await apiRequest<{ ok: boolean; ruta_id: string }>('/vehiculos/rutas', { method: 'POST', token: getToken(), body: data });
  return res.ruta_id;
}

export async function updateRuta(id: string, data: Partial<{ nombre: string; descripcion: string; activa: boolean }>): Promise<void> {
  await apiRequest(`/vehiculos/rutas/${id}`, { method: 'PATCH', token: getToken(), body: data });
}

export async function deleteRuta(id: string): Promise<void> {
  await apiRequest(`/vehiculos/rutas/${id}`, { method: 'DELETE', token: getToken() });
}

/* ── Unidades ── */

export async function fetchUnidades(rutaId: string): Promise<Unidad[]> {
  const res = await apiRequest<{ items: Record<string, unknown>[] }>(`/vehiculos/rutas/${rutaId}/unidades`, { token: getToken() });
  return res.items.map(mapUnidad);
}

export async function fetchUnidad(id: string): Promise<Unidad> {
  const res = await apiRequest<{ item: Record<string, unknown> }>(`/vehiculos/unidades/${id}`, { token: getToken() });
  return mapUnidad(res.item);
}

export async function createUnidad(rutaId: string, data: {
  numero: string; placa: string; marca?: string; modelo?: string;
  anio?: number; color?: string; km?: number; estado?: string; descripcion?: string;
}): Promise<string> {
  const res = await apiRequest<{ ok: boolean; unidad_id: string }>(`/vehiculos/rutas/${rutaId}/unidades`, { method: 'POST', token: getToken(), body: data });
  return res.unidad_id;
}

export async function updateUnidad(id: string, data: Partial<{
  numero: string; placa: string; marca: string; modelo: string;
  anio: number; color: string; km: number; estado: string; descripcion: string;
}>): Promise<void> {
  await apiRequest(`/vehiculos/unidades/${id}`, { method: 'PATCH', token: getToken(), body: data });
}

export async function deleteUnidad(id: string): Promise<void> {
  await apiRequest(`/vehiculos/unidades/${id}`, { method: 'DELETE', token: getToken() });
}

/* ── Documentos ── */

export async function fetchDocumentos(unidadId: string): Promise<DocumentoUnidad[]> {
  const res = await apiRequest<{ items: Record<string, unknown>[] }>(`/vehiculos/unidades/${unidadId}/documentos`, { token: getToken() });
  return res.items.map(mapDocumento);
}

export async function createDocumento(unidadId: string, data: {
  tipo: string; nombre: string; notas?: string; fecha_documento?: string; vigencia_hasta?: string; archivo_id?: string;
}): Promise<string> {
  const res = await apiRequest<{ ok: boolean; documento_id: string }>(`/vehiculos/unidades/${unidadId}/documentos`, { method: 'POST', token: getToken(), body: data });
  return res.documento_id;
}

export async function updateDocumento(id: string, data: Partial<{
  tipo: string; nombre: string; notas: string; fecha_documento: string; vigencia_hasta: string;
}>): Promise<void> {
  await apiRequest(`/vehiculos/documentos/${id}`, { method: 'PATCH', token: getToken(), body: data });
}

export async function deleteDocumento(id: string): Promise<void> {
  await apiRequest(`/vehiculos/documentos/${id}`, { method: 'DELETE', token: getToken() });
}

/* ── Alertas ── */

export async function fetchAlertas(unidadId: string): Promise<AlertaDocumento[]> {
  const res = await apiRequest<{ items: Record<string, unknown>[] }>(`/vehiculos/unidades/${unidadId}/alertas`, { token: getToken() });
  return res.items.map(mapAlerta);
}

export async function upsertAlerta(unidadId: string, tipoDocumento: string, data: { dias_antes: number; activa: boolean }): Promise<void> {
  await apiRequest(`/vehiculos/unidades/${unidadId}/alertas/${tipoDocumento}`, { method: 'PUT', token: getToken(), body: data });
}

/* ── KPI por vencer ── */

export interface DocPorVencer {
  items: DocumentoUnidad[];
  dias: number;
}

export async function fetchDocsPorVencer(dias: number): Promise<DocPorVencer> {
  const res = await apiRequest<{ items: Record<string, unknown>[]; dias: number }>(`/vehiculos/documentos/por-vencer?dias=${dias}`, { token: getToken() });
  return { items: res.items.map(mapDocumento), dias: res.dias };
}
