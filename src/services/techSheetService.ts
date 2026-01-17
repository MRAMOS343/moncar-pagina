import { apiRequest, ApiError } from "./apiClient";
import type { TechSheetDetailResponse, TechSheetListResponse } from "@/types/products";

export async function fetchTechSheetBySku(
  token: string,
  sku: string
): Promise<TechSheetDetailResponse | null> {
  try {
    return await apiRequest<TechSheetDetailResponse>(
      `/tech-sheets/${encodeURIComponent(sku)}`, 
      { token }
    );
  } catch (error) {
    // Si es 404, retornar null (sin ficha técnica)
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchTechSheets(
  token: string,
  params: { limit?: number; cursor?: number; sku?: string } = {}
): Promise<TechSheetListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit ?? 100));
  searchParams.set("cursor", String(params.cursor ?? 0));
  
  if (params.sku) {
    searchParams.set("sku", params.sku);
  }

  return apiRequest<TechSheetListResponse>(`/tech-sheets?${searchParams}`, { token });
}
