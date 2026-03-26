import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCotizaciones,
  createCotizacion,
  updateCotizacionEstado,
  deleteCotizacion,
  duplicateCotizacion,
} from '@/services/cotizacionService';
import type { CotizacionEstado, CreateCotizacionPayload } from '@/types/cotizaciones';

const KEY = ['cotizaciones'];

export function useCotizaciones() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => fetchCotizaciones({ limit: 100 }),
    staleTime: 30 * 1000,
  });
}

export function useCreateCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCotizacionPayload) => createCotizacion(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCotizacionEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: CotizacionEstado }) =>
      updateCotizacionEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => console.error('[updateCotizacionEstado]', err),
  });
}

export function useDeleteCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCotizacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => console.error('[deleteCotizacion]', err),
  });
}

export function useDuplicateCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateCotizacion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => console.error('[duplicateCotizacion]', err),
  });
}
