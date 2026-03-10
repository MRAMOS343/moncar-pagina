import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCompraSugerida } from "@/services/compraService";

export function useCompraSugerida(sucursalId?: string, prioridad?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["compras", "sugerida", sucursalId, prioridad],
    queryFn: () =>
      fetchCompraSugerida(token!, {
        sucursal_id: sucursalId || undefined,
        prioridad: prioridad || undefined,
      }),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
