import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPrediccionProductos,
  fetchPrediccion,
} from "@/services/prediccionService";

export function usePrediccionProductos(sucursalId?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["prediccion", "productos", sucursalId],
    queryFn: () => fetchPrediccionProductos(token!, sucursalId),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function usePrediccionDetalle(
  productoSku: string | undefined,
  sucursalId?: string,
  horizonte?: number
) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["prediccion", "detalle", productoSku, sucursalId, horizonte],
    queryFn: () => fetchPrediccion(token!, productoSku!, sucursalId, horizonte),
    enabled: !!token && !!productoSku,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
