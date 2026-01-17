import { apiRequest } from "./apiClient";
import type { ProductsListResponse, ProductDetailResponse } from "@/types/products";

interface FetchProductsParams {
  limit?: number;
  cursor?: string;
  q?: string;
}

export async function fetchProducts(
  token: string,
  params: FetchProductsParams = {}
): Promise<ProductsListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.limit ?? 100));
  
  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }
  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  return apiRequest<ProductsListResponse>(`/products?${searchParams}`, { token });
}

export async function fetchProductBySku(
  token: string,
  sku: string
): Promise<ProductDetailResponse> {
  return apiRequest<ProductDetailResponse>(`/products/${encodeURIComponent(sku)}`, { token });
}
