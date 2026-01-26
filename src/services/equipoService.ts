import { apiRequest } from "./apiClient";
import type {
  EquiposListResponse,
  EquipoDetailResponse,
  CreateEquipoRequest,
  UpdateEquipoRequest,
  AddMiembroRequest,
  FetchEquiposParams,
} from "@/types/equipos";

// GET /equipos?limit=&cursor=&q=
export async function fetchEquipos(
  token: string,
  params: FetchEquiposParams = {}
): Promise<EquiposListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit ?? 20));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.q?.trim()) searchParams.set("q", params.q.trim());

  return apiRequest<EquiposListResponse>(`/equipos?${searchParams}`, { token });
}

// GET /equipos/:id
export async function fetchEquipoById(
  token: string,
  id: string
): Promise<EquipoDetailResponse> {
  return apiRequest<EquipoDetailResponse>(`/equipos/${id}`, { token });
}

// POST /equipos
export async function createEquipo(
  token: string,
  data: CreateEquipoRequest
): Promise<{ ok: true; equipo: { equipo_id: string } }> {
  return apiRequest(`/equipos`, { method: "POST", token, body: data });
}

// PATCH /equipos/:id
export async function updateEquipo(
  token: string,
  id: string,
  data: UpdateEquipoRequest
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${id}`, { method: "PATCH", token, body: data });
}

// DELETE /equipos/:id (soft delete)
export async function deleteEquipo(
  token: string,
  id: string
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${id}`, { method: "DELETE", token });
}

// POST /equipos/:id/miembros
export async function addMiembro(
  token: string,
  equipoId: string,
  data: AddMiembroRequest
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${equipoId}/miembros`, {
    method: "POST",
    token,
    body: data,
  });
}

// DELETE /equipos/:id/miembros/:usuario_id
export async function removeMiembro(
  token: string,
  equipoId: string,
  usuarioId: string
): Promise<{ ok: true }> {
  return apiRequest(`/equipos/${equipoId}/miembros/${usuarioId}`, {
    method: "DELETE",
    token,
  });
}
