import { apiRequest } from "./apiClient";
import type { Warehouse } from "@/types";

/**
 * Fetches only active warehouses from the backend.
 * @param token - JWT token for authentication
 * @returns Promise<Warehouse[]> - List of active warehouses
 */
export async function fetchActiveWarehouses(token: string): Promise<Warehouse[]> {
  return apiRequest<Warehouse[]>("/warehouses?activo=true", { token });
}
