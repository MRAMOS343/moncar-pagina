import { apiRequest } from "./apiClient";
import type { InventoryResponse } from "@/types/products";

interface FetchInventoryParams {
  sku?: string;
  limit?: number;
  cursor_sku?: string;
  cursor_almacen?: string;
}

export async function fetchInventory(
  token: string,
  params: FetchInventoryParams = {}
): Promise<InventoryResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit ?? 200));
  
  if (params.sku) {
    searchParams.set("sku", params.sku);
  }
  if (params.cursor_sku) {
    searchParams.set("cursor_sku", params.cursor_sku);
  }
  if (params.cursor_almacen) {
    searchParams.set("cursor_almacen", params.cursor_almacen);
  }

  return apiRequest<InventoryResponse>(`/inventario?${searchParams}`, { token });
}
