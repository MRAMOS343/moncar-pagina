import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchActiveWarehouses } from "@/services/warehouseService";

/**
 * Hook to fetch active warehouses from the backend.
 * Uses React Query for caching and automatic refetching.
 */
export function useWarehouses() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["warehouses", "active"],
    queryFn: () => fetchActiveWarehouses(token!),
    enabled: !!token, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (warehouses change infrequently)
    retry: 2,
  });
}
