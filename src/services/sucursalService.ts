import { apiRequest } from "./apiClient";
import type { SucursalesListResponse } from "@/types/sucursales";

export async function fetchSucursales(token: string): Promise<SucursalesListResponse> {
  return apiRequest<SucursalesListResponse>("/sucursales", { token });
}
