import { apiRequest } from "./apiClient";
import type { UsuariosListResponse } from "@/types/usuarios";

export async function fetchUsuarios(token: string): Promise<UsuariosListResponse> {
  return apiRequest<UsuariosListResponse>("/users", { token });
}
