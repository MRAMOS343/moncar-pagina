import { apiRequest } from "./apiClient";
import type { SalesListResponse, SaleDetailResponse, FetchSalesParams } from "@/types/sales";

/**
 * Obtiene lista de ventas con paginación por cursor
 */
export async function fetchSales(
  token: string,
  params: FetchSalesParams = {}
): Promise<SalesListResponse> {
  const searchParams = new URLSearchParams();
  
  searchParams.set("from", params.from ?? "2025-01-01");
  searchParams.set("limit", String(params.limit ?? 20));
  searchParams.set("include_cancelled", params.include_cancelled ? "1" : "0");
  
  if (params.sucursal_id) {
    searchParams.set("sucursal_id", params.sucursal_id);
  }
  if (params.to) {
    searchParams.set("to", params.to);
  }
  
  // Cursor robusto: no usar if(cursor) porque omite 0
  if (params.cursor !== undefined && params.cursor !== null) {
    searchParams.set("cursor", String(params.cursor));
  }

  return apiRequest<SalesListResponse>(`/sales?${searchParams.toString()}`, { token });
}

/**
 * Obtiene detalle de una venta específica (con líneas y pagos)
 */
export async function fetchSaleDetail(
  token: string,
  ventaId: number
): Promise<SaleDetailResponse> {
  return apiRequest<SaleDetailResponse>(`/sales/${ventaId}`, { token });
}
