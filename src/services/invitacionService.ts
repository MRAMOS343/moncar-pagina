import { apiRequest } from "./apiClient";

export interface InvitationValidation {
  ok: boolean;
  nombre: string;
  correo: string;
}

export interface SetPasswordResponse {
  ok: boolean;
  error?: string;
}

export interface CreateUsuarioPayload {
  nombre: string;
  correo: string;
  rol: string;
  sucursal_id?: string;
}

export interface CreateUsuarioResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export async function validateInvitation(token: string): Promise<InvitationValidation> {
  return apiRequest<InvitationValidation>(`/auth/invitation/${encodeURIComponent(token)}`);
}

export async function setPassword(token: string, password: string): Promise<SetPasswordResponse> {
  return apiRequest<SetPasswordResponse>("/auth/set-password", {
    method: "POST",
    body: { token, password },
  });
}

export async function createUsuario(
  data: CreateUsuarioPayload,
  authToken: string
): Promise<CreateUsuarioResponse> {
  return apiRequest<CreateUsuarioResponse>("/admin/usuarios", {
    method: "POST",
    token: authToken,
    body: data,
  });
}
