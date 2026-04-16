import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUsuarios } from "@/services/usuarioService";
import {
  resendInvitation,
  setUsuarioActivo,
} from "@/services/invitacionService";

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

export function useResendInvitation() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (usuario_id: string) => resendInvitation(usuario_id, token!),
  });
}

export function useToggleUsuarioActivo() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ usuario_id, activo }: { usuario_id: string; activo: boolean }) =>
      setUsuarioActivo(usuario_id, activo, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}
