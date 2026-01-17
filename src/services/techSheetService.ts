import { apiRequest, ApiError } from "./apiClient";
import type { 
  TechSheetDetailResponse, 
  TechSheetListResponse, 
  TechSheetUpdateRequest,
  TechSheetAttributeRequest,
  TechSheetAttributeResponse,
  TechSheetBulkAttributesRequest,
  TechSheetBulkAttributesResponse
} from "@/types/products";

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

export async function updateTechSheet(
  token: string,
  sku: string,
  data: TechSheetUpdateRequest
): Promise<TechSheetDetailResponse> {
  return apiRequest<TechSheetDetailResponse>(
    `/tech-sheets/${encodeURIComponent(sku)}`,
    { method: 'PATCH', token, body: data }
  );
}

export async function upsertTechSheetAttribute(
  token: string,
  sku: string,
  data: TechSheetAttributeRequest
): Promise<TechSheetAttributeResponse> {
  return apiRequest<TechSheetAttributeResponse>(
    `/tech-sheets/${encodeURIComponent(sku)}/attributes`,
    { method: 'POST', token, body: data }
  );
}

export async function bulkUpsertTechSheetAttributes(
  token: string,
  sku: string,
  data: TechSheetBulkAttributesRequest
): Promise<TechSheetBulkAttributesResponse> {
  return apiRequest<TechSheetBulkAttributesResponse>(
    `/tech-sheets/${encodeURIComponent(sku)}/attributes`,
    { method: 'PUT', token, body: data }
  );
}

export async function deleteTechSheetAttribute(
  token: string,
  sku: string,
  attributeId: number
): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(
    `/tech-sheets/${encodeURIComponent(sku)}/attributes/${attributeId}`,
    { method: 'DELETE', token }
  );
}
