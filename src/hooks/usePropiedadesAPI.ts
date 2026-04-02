import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPropiedades,
  createPropiedad,
  updatePropiedad,
  deletePropiedad,
  fetchContratos,
  createContrato,
  updateContrato,
  fetchPagos,
  createPago,
  updatePago,
  fetchMantenimiento,
  createMantenimiento,
  updateMantenimiento,
  deleteMantenimiento,
} from '@/services/propiedadesService';
import type { Propiedad, Contrato, Pago, SolicitudMantenimiento } from '@/types/propiedades';

const KEYS = {
  propiedades: ['rentas', 'propiedades'] as const,
  contratos:   ['rentas', 'contratos']   as const,
  pagos:       ['rentas', 'pagos']       as const,
  mantenimiento: ['rentas', 'mantenimiento'] as const,
};

// ── Propiedades ──────────────────────────────────────────────────────────────

export function usePropiedadesAPI() {
  return useQuery({
    queryKey: KEYS.propiedades,
    queryFn: fetchPropiedades,
    staleTime: 30 * 1000,
  });
}

export function useCreatePropiedad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Propiedad, 'id' | 'createdAt'>) => createPropiedad(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.propiedades }),
  });
}

export function useUpdatePropiedad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Propiedad> }) =>
      updatePropiedad(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.propiedades }),
  });
}

export function useDeletePropiedad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePropiedad(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.propiedades }),
  });
}

// ── Contratos ─────────────────────────────────────────────────────────────────

export function useContratosAPI() {
  return useQuery({
    queryKey: KEYS.contratos,
    queryFn: fetchContratos,
    staleTime: 30 * 1000,
  });
}

export function useCreateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Contrato, 'id' | 'createdAt'>) => createContrato(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.contratos });
      qc.invalidateQueries({ queryKey: KEYS.propiedades });
    },
  });
}

export function useUpdateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contrato> }) =>
      updateContrato(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.contratos });
      qc.invalidateQueries({ queryKey: KEYS.propiedades });
    },
  });
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export function usePagosAPI() {
  return useQuery({
    queryKey: KEYS.pagos,
    queryFn: fetchPagos,
    staleTime: 30 * 1000,
  });
}

export function useCreatePago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Pago, 'id' | 'createdAt'>) => createPago(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pagos }),
  });
}

export function useUpdatePago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pago> }) =>
      updatePago(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pagos }),
  });
}

// ── Mantenimiento ─────────────────────────────────────────────────────────────

export function useMantenimientoAPI() {
  return useQuery({
    queryKey: KEYS.mantenimiento,
    queryFn: fetchMantenimiento,
    staleTime: 30 * 1000,
  });
}

export function useCreateMantenimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SolicitudMantenimiento, 'id'>) => createMantenimiento(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.mantenimiento }),
  });
}

export function useUpdateMantenimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SolicitudMantenimiento> }) =>
      updateMantenimiento(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.mantenimiento }),
  });
}

export function useDeleteMantenimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMantenimiento(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.mantenimiento }),
  });
}
