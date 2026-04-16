import { apiRequest } from "./apiClient";
import type {
  ProveedoresListResponse,
  ProveedorDetailResponse,
  CreateProveedorRequest,
  PatchProveedorRequest,
  FetchProveedoresParams,
} from "@/types/proveedores";

export async function fetchProveedores(
  token: string,
  params: FetchProveedoresParams = {}
): Promise<ProveedoresListResponse> {
  const sp = new URLSearchParams();
  if (params.limit !== undefined) sp.set("limit", String(params.limit));
  if (params.cursor)              sp.set("cursor", params.cursor);
  if (params.q?.trim())           sp.set("q",      params.q.trim());
  if (params.activo === false)    sp.set("activo",  "false");

  return apiRequest<ProveedoresListResponse>(`/api/v1/proveedores?${sp}`, { token });
}

export async function fetchProveedorById(
  token: string,
  id: string
): Promise<ProveedorDetailResponse> {
  return apiRequest<ProveedorDetailResponse>(`/api/v1/proveedores/${id}`, { token });
}

export async function createProveedor(
  token: string,
  data: CreateProveedorRequest
): Promise<ProveedorDetailResponse> {
  return apiRequest<ProveedorDetailResponse>(`/api/v1/proveedores`, {
    method: "POST",
    token,
    body: data,
  });
}

export async function patchProveedor(
  token: string,
  id: string,
  data: PatchProveedorRequest
): Promise<ProveedorDetailResponse> {
  return apiRequest<ProveedorDetailResponse>(`/api/v1/proveedores/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function deleteProveedor(
  token: string,
  id: string
): Promise<{ ok: true }> {
  return apiRequest(`/api/v1/proveedores/${id}`, { method: "DELETE", token });
}
