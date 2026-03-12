import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCotizaciones,
  createCotizacion,
  updateCotizacionEstado,
  duplicateCotizacion,
} from '@/services/cotizacionService';
import type { Cotizacion, CotizacionEstado } from '@/types/cotizaciones';

const KEY = ['cotizaciones'];

export function useCotizaciones() {
  return useQuery({
    queryKey: KEY,
    queryFn: fetchCotizaciones,
    staleTime: 0, // localStorage, always fresh
  });
}

export function useCreateCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Cotizacion, 'id' | 'folio' | 'creadaEn'>) => 
      Promise.resolve(createCotizacion(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCotizacionEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: CotizacionEstado }) =>
      Promise.resolve(updateCotizacionEstado(id, estado)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDuplicateCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(duplicateCotizacion(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
