import { apiRequest } from "./apiClient";
import type {
  TicketsListResponse,
  TicketDetailResponse,
  CreateTicketRequest,
  PatchTicketRequest,
  FetchTicketsParams,
} from "@/types/tickets";

export async function fetchTickets(
  token: string,
  params: FetchTicketsParams = {}
): Promise<TicketsListResponse> {
  const sp = new URLSearchParams();
  if (params.limit)    sp.set("limit",    String(params.limit));
  if (params.cursor)   sp.set("cursor",   params.cursor);
  if (params.estado)   sp.set("estado",   params.estado);
  if (params.prioridad) sp.set("prioridad", params.prioridad);
  if (params.categoria) sp.set("categoria", params.categoria);

  return apiRequest<TicketsListResponse>(`/api/v1/tickets?${sp}`, { token });
}

export async function fetchTicketById(
  token: string,
  id: string
): Promise<TicketDetailResponse> {
  return apiRequest<TicketDetailResponse>(`/api/v1/tickets/${id}`, { token });
}

export async function createTicket(
  token: string,
  data: CreateTicketRequest
): Promise<TicketDetailResponse> {
  return apiRequest<TicketDetailResponse>(`/api/v1/tickets`, {
    method: "POST",
    token,
    body: data,
  });
}

export async function patchTicket(
  token: string,
  id: string,
  data: PatchTicketRequest
): Promise<TicketDetailResponse> {
  return apiRequest<TicketDetailResponse>(`/api/v1/tickets/${id}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function deleteTicket(
  token: string,
  id: string
): Promise<{ ok: true }> {
  return apiRequest(`/api/v1/tickets/${id}`, { method: "DELETE", token });
}
