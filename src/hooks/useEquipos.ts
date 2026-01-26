import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEquipos, fetchEquipoById } from "@/services/equipoService";
import type { FetchEquiposParams } from "@/types/equipos";

/**
 * Hook para listar equipos con paginación por cursor
 */
export function useEquipos(params: Omit<FetchEquiposParams, "cursor"> = {}) {
  const { token } = useAuth();

  return useInfiniteQuery({
    queryKey: ["equipos", params.q, params.limit],
    queryFn: ({ pageParam }) =>
      fetchEquipos(token!, { ...params, cursor: pageParam }),
    enabled: !!token,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener detalle de un equipo con sus miembros
 */
export function useEquipoDetail(id: string | null, enabled: boolean = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["equipo", id],
    queryFn: () => fetchEquipoById(token!, id!),
    enabled: !!token && !!id && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
