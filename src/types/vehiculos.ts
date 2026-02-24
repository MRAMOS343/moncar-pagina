export type EstadoVehiculo = 'activo' | 'taller' | 'baja';
export type TipoDocUnidad = 'cromatica' | 'factura' | 'poliza_seguro' | 'tarjeta_circulacion' | 'titulo_concesion' | 'verificacion' | 'permiso' | 'otro';
export type TipoMantenimientoVeh = 'preventivo' | 'correctivo';
export type TipoGastoVeh = 'combustible' | 'casetas' | 'estacionamiento' | 'multa' | 'otro';

/* ── Ruta ── */
export interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  createdAt: string;
}

/* ── Unidad (antes Vehiculo) ── */
export interface Unidad {
  id: string;
  rutaId: string;
  numero: string;       // "04", "07", etc.
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

/* ── Documento de Unidad ── */
export interface DocumentoUnidad {
  id: string;
  unidadId: string;
  nombre: string;
  tipo: TipoDocUnidad;
  vigencia: string | null;
  archivoUrl: string | null;
  tamanoBytes: number | null;
  fechaSubida: string;
  notas: string;
}

/* ── Alerta de Documento ── */
export interface AlertaDocumento {
  id: string;
  unidadId: string;
  tipoDocumento: TipoDocUnidad;
  diasAntes: number;
  activa: boolean;
}

/* ── Mantenimiento (sin cambios) ── */
export interface MantenimientoVehiculo {
  id: string;
  unidadId: string;
  fecha: string;
  tipo: TipoMantenimientoVeh;
  descripcion: string;
  km: number;
  costo: number;
  proveedor: string;
  notas: string;
}

/* ── Gasto (sin cambios en estructura, solo renombrado FK) ── */
export interface GastoVehiculo {
  id: string;
  unidadId: string;
  fecha: string;
  tipo: TipoGastoVeh;
  monto: number;
  descripcion: string;
  evidencia: string | null;
}

/* ── Labels helper ── */
export const TIPO_DOC_LABELS: Record<TipoDocUnidad, string> = {
  cromatica: 'Cromática',
  factura: 'Factura',
  poliza_seguro: 'Póliza de Seguro',
  tarjeta_circulacion: 'Tarjeta de Circulación',
  titulo_concesion: 'Título de Concesión',
  verificacion: 'Verificación',
  permiso: 'Permiso',
  otro: 'Otro',
};

// Keep legacy aliases for backward compat during transition
export type Vehiculo = Unidad;
export type DocumentoVehiculo = DocumentoUnidad;
export type TipoDocVehiculo = TipoDocUnidad;
