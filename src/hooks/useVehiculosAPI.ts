import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as svc from '@/services/vehiculoService';
import * as archivoSvc from '@/services/archivoService';
import type { TipoDocUnidad } from '@/types/vehiculos';

const KEYS = {
  rutas: ['vehiculos', 'rutas'] as const,
  unidades: (rutaId: string) => ['vehiculos', 'unidades', rutaId] as const,
  unidad: (id: string) => ['vehiculos', 'unidad', id] as const,
  documentos: (unidadId: string) => ['vehiculos', 'documentos', unidadId] as const,
  alertas: (unidadId: string) => ['vehiculos', 'alertas', unidadId] as const,
  porVencer: (dias: number) => ['vehiculos', 'por-vencer', dias] as const,
};

/* ── Queries ── */

export function useRutas() {
  return useQuery({ queryKey: KEYS.rutas, queryFn: svc.fetchRutas });
}

export function useUnidades(rutaId: string, enabled = true) {
  return useQuery({
    queryKey: KEYS.unidades(rutaId),
    queryFn: () => svc.fetchUnidades(rutaId),
    enabled: !!rutaId && enabled,
  });
}

export function useUnidadDetalle(unidadId: string | null) {
  return useQuery({
    queryKey: KEYS.unidad(unidadId!),
    queryFn: () => svc.fetchUnidad(unidadId!),
    enabled: !!unidadId,
  });
}

export function useDocumentos(unidadId: string | null) {
  return useQuery({
    queryKey: KEYS.documentos(unidadId!),
    queryFn: () => svc.fetchDocumentos(unidadId!),
    enabled: !!unidadId,
  });
}

export function useAlertas(unidadId: string | null) {
  return useQuery({
    queryKey: KEYS.alertas(unidadId!),
    queryFn: () => svc.fetchAlertas(unidadId!),
    enabled: !!unidadId,
  });
}

export function useDocsPorVencer(dias: number) {
  return useQuery({
    queryKey: KEYS.porVencer(dias),
    queryFn: () => svc.fetchDocsPorVencer(dias),
  });
}

/* ── Mutations: Rutas ── */

export function useCreateRuta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string; activa?: boolean }) => svc.createRuta(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.rutas }); },
  });
}

export function useUpdateRuta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ nombre: string; descripcion: string; activa: boolean }> }) => svc.updateRuta(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.rutas }); },
  });
}

export function useDeleteRuta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.deleteRuta(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.rutas }); },
  });
}

/* ── Mutations: Unidades ── */

export function useCreateUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rutaId, data }: { rutaId: string; data: Parameters<typeof svc.createUnidad>[1] }) =>
      svc.createUnidad(rutaId, data),
    onSuccess: (_, { rutaId }) => {
      qc.invalidateQueries({ queryKey: KEYS.unidades(rutaId) });
      qc.invalidateQueries({ queryKey: KEYS.rutas });
    },
  });
}

export function useUpdateUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof svc.updateUnidad>[1] }) =>
      svc.updateUnidad(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehiculos'] });
    },
  });
}

export function useDeleteUnidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.deleteUnidad(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehiculos'] });
    },
  });
}

/* ── Mutations: Documentos ── */

export function useCreateDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unidadId, data }: { unidadId: string; data: Parameters<typeof svc.createDocumento>[1] }) =>
      svc.createDocumento(unidadId, data),
    onSuccess: (_, { unidadId }) => {
      qc.invalidateQueries({ queryKey: KEYS.documentos(unidadId) });
      qc.invalidateQueries({ queryKey: ['vehiculos', 'por-vencer'] });
    },
  });
}

export function useUpdateDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof svc.updateDocumento>[1] }) =>
      svc.updateDocumento(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehiculos'] });
    },
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.deleteDocumento(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehiculos'] });
    },
  });
}

/* ── Mutations: Alertas ── */

export function useUpsertAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unidadId, tipoDocumento, data }: {
      unidadId: string; tipoDocumento: TipoDocUnidad; data: { dias_antes: number; activa: boolean };
    }) => svc.upsertAlerta(unidadId, tipoDocumento, data),
    onSuccess: (_, { unidadId }) => {
      qc.invalidateQueries({ queryKey: KEYS.alertas(unidadId) });
    },
  });
}

/* ── Diagnóstico y prueba de alertas ── */

export function useDiagnosticoAlertas() {
  return useQuery({
    queryKey: ['vehiculos', 'alertas-diagnostico'] as const,
    queryFn: svc.fetchDiagnosticoAlertas,
  });
}

export function useEnviarPrueba() {
  return useMutation({
    mutationFn: svc.enviarPruebaAlerta,
  });
}

/* ── Re-export archivo service for convenience ── */
export { uploadFile, getDownloadUrl } from '@/services/archivoService';
