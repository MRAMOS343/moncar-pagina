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
