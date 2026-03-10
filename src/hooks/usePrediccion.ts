import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPrediccionDiaria } from "@/services/prediccionService";

export function usePrediccionDiaria(
  sucursalId?: string,
  horizonte?: number
) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["prediccion", "diaria", sucursalId, horizonte],
    queryFn: () => fetchPrediccionDiaria(token!, sucursalId, horizonte),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
