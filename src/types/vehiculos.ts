export type EstadoVehiculo = 'activo' | 'taller' | 'baja';
export type TipoDocVehiculo = 'seguro' | 'verificacion' | 'tarjeta_circulacion' | 'factura' | 'permiso' | 'otro';
export type TipoMantenimientoVeh = 'preventivo' | 'correctivo';
export type TipoGastoVeh = 'combustible' | 'casetas' | 'estacionamiento' | 'multa' | 'otro';

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  km: number;
  estado: EstadoVehiculo;
  descripcion: string;
  createdAt: string;
}

export interface DocumentoVehiculo {
  id: string;
  vehiculoId: string;
  nombre: string;
  tipo: TipoDocVehiculo;
  vigencia: string | null; // fecha de expiración
  archivo: string | null;
  fechaSubida: string;
  notas: string;
}

export interface MantenimientoVehiculo {
  id: string;
  vehiculoId: string;
  fecha: string;
  tipo: TipoMantenimientoVeh;
  descripcion: string;
  km: number;
  costo: number;
  proveedor: string;
  notas: string;
}

export interface GastoVehiculo {
  id: string;
  vehiculoId: string;
  fecha: string;
  tipo: TipoGastoVeh;
  monto: number;
  descripcion: string;
  evidencia: string | null;
}
