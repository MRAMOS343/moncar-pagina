import type { TicketStatus, TicketPriority, TicketCategory } from "./index";

export interface TicketDB {
  ticket_id:      string;
  usuario_id:     string;
  usuario_nombre: string;
  titulo:         string;
  descripcion:    string;
  categoria:      TicketCategory;
  prioridad:      TicketPriority;
  estado:         TicketStatus;
  metadata:       Record<string, unknown>;
  created_at:     string;
  updated_at:     string;
}

export interface TicketsListResponse {
  ok:         true;
  items:      TicketDB[];
  hasMore:    boolean;
  nextCursor: string | null;
}

export interface TicketDetailResponse {
  ok:   true;
  item: TicketDB;
}

export interface CreateTicketRequest {
  titulo:      string;
  descripcion: string;
  categoria:   TicketCategory;
  prioridad:   TicketPriority;
  metadata?:   Record<string, unknown>;
}

export interface PatchTicketRequest {
  titulo?:      string;
  descripcion?: string;
  categoria?:   TicketCategory;
  prioridad?:   TicketPriority;
  estado?:      TicketStatus;
}

export interface FetchTicketsParams {
  estado?:    TicketStatus;
  prioridad?: TicketPriority;
  categoria?: TicketCategory;
  limit?:     number;
  cursor?:    string;
}
