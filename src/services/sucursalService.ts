import { apiRequest } from "./apiClient";
import type { Sucursal, SucursalesListResponse } from "@/types/sucursales";

interface WarehouseResponse {
  id: string;     // Este es el código (ej: "moncar")
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export async function fetchSucursales(token: string): Promise<SucursalesListResponse> {
  // Usar el endpoint /warehouses que SÍ existe en el backend
  const warehouses = await apiRequest<WarehouseResponse[]>("/warehouses?activo=true", { token });
  
  // Mapear id -> codigo para alinear con el formato de equipos
  const items: Sucursal[] = warehouses.map(w => ({
    codigo: w.id,      // El "id" del warehouse ES el código
    nombre: w.nombre,
    direccion: w.direccion,
    telefono: w.telefono,
    activo: true,
  }));
  
  return { ok: true, items };
}
