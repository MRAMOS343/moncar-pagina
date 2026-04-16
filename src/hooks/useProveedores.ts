import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchProveedores,
  createProveedor,
  patchProveedor,
  deleteProveedor,
} from "@/services/proveedorService";
import type {
  FetchProveedoresParams,
  CreateProveedorRequest,
  PatchProveedorRequest,
} from "@/types/proveedores";

export function useProveedores(params: Omit<FetchProveedoresParams, "cursor"> = {}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["proveedores", params.q, params.activo],
    queryFn:  () => fetchProveedores(token!, { ...params, limit: 100 }),
    enabled:  !!token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateProveedor() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProveedorRequest) => createProveedor(token!, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["proveedores"] }),
  });
}

export function usePatchProveedor() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatchProveedorRequest }) =>
      patchProveedor(token!, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores"] }),
  });
}

export function useDeleteProveedor() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProveedor(token!, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["proveedores"] }),
  });
}
