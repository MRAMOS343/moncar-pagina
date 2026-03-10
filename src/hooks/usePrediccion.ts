import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPrediccion } from "@/services/prediccionService";
import type { PrediccionResponse } from "@/services/prediccionService";

export function usePrediccion(
  vista: "semanal" | "diaria",
  sucursalId?: string,
  horizonte?: number
) {
  const { token } = useAuth();
  return useQuery<PrediccionResponse>({
    queryKey: ["prediccion", vista, sucursalId, horizonte],
    queryFn: () => fetchPrediccion(token!, vista, sucursalId, horizonte),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
