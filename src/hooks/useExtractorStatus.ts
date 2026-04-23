import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/services/apiClient";

export interface ExtractorStatusItem {
  source: string;
  tipo: "ventas" | "cancelaciones";
  estado: "OK" | "LAG" | "OFFLINE";
  cursor: number | null;
  max_in_pos: number | null;
  lag: number | null;
  ultimo_reporte_hace_segundos: number | null;
  last_error: string | null;
  hostname: string | null;
}

export function useExtractorStatus() {
  const { token } = useAuth();
  return useQuery<ExtractorStatusItem[]>({
    queryKey: ["extractor-status"],
    queryFn: () => apiRequest<ExtractorStatusItem[]>("/api/v1/extractor/status", { token }),
    enabled: !!token,
    refetchInterval: 30000,
    staleTime: 25000,
    retry: (failureCount, error) => {
      // Don't retry on 404 (module not yet deployed)
      if ((error as { status?: number })?.status === 404) return false;
      return failureCount < 2;
    },
  });
}
