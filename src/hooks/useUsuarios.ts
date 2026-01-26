import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUsuarios } from "@/services/usuarioService";

export function useUsuarios() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: () => fetchUsuarios(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.items,
  });
}
