import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchTickets,
  createTicket,
  patchTicket,
  deleteTicket,
} from "@/services/ticketService";
import type { FetchTicketsParams, CreateTicketRequest, PatchTicketRequest } from "@/types/tickets";

export function useTickets(params: Omit<FetchTicketsParams, "cursor"> = {}) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["tickets", params.estado, params.prioridad, params.categoria],
    queryFn:  () => fetchTickets(token!, { ...params, limit: 100 }),
    enabled:  !!token,
    staleTime: 30 * 1000,
  });
}

export function useCreateTicket() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => createTicket(token!, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function usePatchTicket() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatchTicketRequest }) =>
      patchTicket(token!, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useDeleteTicket() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTicket(token!, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}
