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
  searchParams.set("limit", String(params.limit ?? 50));
  searchParams.set("include_cancelled", params.include_cancelled ? "1" : "0");
  
  if (params.sucursal_id) {
    searchParams.set("sucursal_id", params.sucursal_id);
  }
  if (params.to) {
    searchParams.set("to", params.to);
  }
  
  // Cursor compuesto: enviar ambos campos si existen
  if (params.cursor_fecha) {
    searchParams.set("cursor_fecha", params.cursor_fecha);
  }
  if (params.cursor_venta_id !== undefined) {
    searchParams.set("cursor_venta_id", String(params.cursor_venta_id));
  }

  const url = `/sales?${searchParams.toString()}`;
  
  // Logging de desarrollo
  if (import.meta.env.DEV) {
    console.log('[Sales API] Request:', url);
  }

  const response = await apiRequest<SalesListResponse>(url, { token });

  if (import.meta.env.DEV) {
    console.log('[Sales API] Items recibidos:', response.items.length);
  }

  return response;
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
