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
  return apiRequest<InvitationValidation>(`/api/v1/auth/invitation/${encodeURIComponent(token)}`);
}

export async function setPassword(token: string, password: string): Promise<SetPasswordResponse> {
  return apiRequest<SetPasswordResponse>("/api/v1/auth/set-password", {
    method: "POST",
    body: { token, password },
  });
}

export async function createUsuario(
  data: CreateUsuarioPayload,
  authToken: string
): Promise<CreateUsuarioResponse> {
  return apiRequest<CreateUsuarioResponse>("/api/v1/admin/usuarios", {
    method: "POST",
    token: authToken,
    body: data,
  });
}

export async function resendInvitation(
  usuario_id: string,
  authToken: string
): Promise<{ ok: boolean; error?: string }> {
  return apiRequest<{ ok: boolean; error?: string }>(
    `/api/v1/admin/usuarios/${encodeURIComponent(usuario_id)}/resend-invite`,
    { method: "POST", token: authToken }
  );
}

export async function setUsuarioActivo(
  usuario_id: string,
  activo: boolean,
  authToken: string
): Promise<{ ok: boolean; usuario_id?: string; activo?: boolean; reason?: string }> {
  return apiRequest(
    `/api/v1/admin/usuarios/${encodeURIComponent(usuario_id)}/activo`,
    { method: "PATCH", token: authToken, body: { activo } }
  );
}
