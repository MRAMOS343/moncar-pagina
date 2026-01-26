import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSucursales } from "@/services/sucursalService";

/**
 * Hook to fetch sucursales from the backend.
 * Uses React Query for caching and automatic refetching.
 */
export function useSucursales() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["sucursales"],
    queryFn: () => fetchSucursales(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    select: (data) => data.items,
  });
}
