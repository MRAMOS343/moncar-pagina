import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTechSheetBySku } from "@/services/techSheetService";

export function useTechSheet(sku: string | null, enabled: boolean = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["tech-sheet", sku],
    queryFn: () => fetchTechSheetBySku(token!, sku!),
    enabled: !!token && !!sku && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
