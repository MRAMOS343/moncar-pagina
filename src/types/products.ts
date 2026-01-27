// Tipos para la API de productos
export interface ApiProduct {
  sku: string;
  descrip: string | null;
  marca: string | null;
  linea: string | null;
  unidad: string | null;
  ubicacion?: string | null;
  precio1: number | null;
  impuesto: number | null;
  minimo: number | null;
  maximo: number | null;
  image_url?: string | null;
  notes?: string | null;
}

export interface ProductsListResponse {
  ok: boolean;
  items: ApiProduct[];
  next_cursor: string | null;
}

export interface ProductDetailResponse {
  ok: boolean;
  item: ApiProduct;
}

// Tipos para inventario
export interface ApiInventoryItem {
  sku: string;
  almacen: string;
  existencia: number;
  actualizado_el: string;
}

export interface InventoryCursor {
  cursor_sku: string;
  cursor_almacen: string;
}

export interface InventoryResponse {
  ok: boolean;
  items: ApiInventoryItem[];
  next_cursor?: InventoryCursor | null;
}

// Tipos para fichas técnicas
export interface TechSheetAttribute {
  id: number;
  nombre_atributo: string;
  valor: string;
  unidad?: string;
}

export interface TechSheet {
  id: number;
  sku: string;
  notas_generales?: string;
  created_at: string;
  updated_at: string;
}

export interface TechSheetDetailResponse {
  ok: boolean;
  ficha: TechSheet;
  atributos: TechSheetAttribute[];
}

export interface TechSheetListResponse {
  ok: boolean;
  items: TechSheet[];
  next_cursor: number | null;
}

// === INVENTARIO - Ajuste de stock ===
export interface InventoryAdjustRequest {
  sku: string;
  almacen: string;
  delta: number;
  motivo: string;
  referencia?: string;
}

export interface InventoryAdjustResponse {
  ok: boolean;
  sku: string;
  almacen: string;
  existencia: string;
  movimiento_id: string;
}

// === PRODUCTOS - Edición parcial ===
export interface ProductUpdateRequest {
  descrip?: string;
  marca?: string;
  linea?: string;
  unidad?: string;
  ubicacion?: string;
  clasificacion?: string;
  notes?: string;
  image_url?: string;
  precio1?: number;
  impuesto?: number;
  minimo?: number;
  maximo?: number;
  costo_u?: number;
}

export interface ProductUpdateResponse {
  ok: boolean;
  item: ApiProduct;
}

// === FICHAS TÉCNICAS - Edición ===
export interface TechSheetUpdateRequest {
  notas_generales?: string;
}

export interface TechSheetAttributeRequest {
  nombre_atributo: string;
  valor: string;
  unidad?: string;
}

export interface TechSheetAttributeResponse {
  ok: boolean;
  atributo: TechSheetAttribute;
}

export interface TechSheetBulkAttributesRequest {
  atributos: TechSheetAttributeRequest[];
}

export interface TechSheetBulkAttributesResponse {
  ok: boolean;
  atributos: TechSheetAttribute[];
}
