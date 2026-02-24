export type EstadoVehiculo = 'activo' | 'taller' | 'baja';
export type TipoDocUnidad = 'cromatica' | 'factura' | 'poliza_seguro' | 'tarjeta_circulacion' | 'titulo_concesion' | 'verificacion' | 'permiso' | 'otro';

/* ── Ruta ── */
export interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  creadoEn: string;
  actualizadoEn: string;
  unidadesCount: number;
}

/* ── Unidad ── */
export interface Unidad {
  id: string;
  rutaId: string;
  rutaNombre?: string;
  numero: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  km: number;
  estado: EstadoVehiculo;
  descripcion: string;
  creadoEn: string;
  actualizadoEn: string;
}

/* ── Documento de Unidad ── */
export interface DocumentoUnidad {
  id: string;
  unidadId: string;
  nombre: string;
  tipo: TipoDocUnidad;
  notas: string;
  fechaDocumento: string | null;
  vigenciaHasta: string | null;
  archivoId: string | null;
  creadoEn: string;
  archivoNombre: string | null;
  archivoMime: string | null;
  archivoBytes: number | null;
  archivoEstado: string | null;
}

/* ── Alerta de Documento ── */
export interface AlertaDocumento {
  id: string;
  unidadId: string;
  tipoDocumento: TipoDocUnidad;
  diasAntes: number;
  activa: boolean;
  creadoEn: string;
  actualizadoEn: string;
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

// Legacy aliases
export type Vehiculo = Unidad;
export type DocumentoVehiculo = DocumentoUnidad;
export type TipoDocVehiculo = TipoDocUnidad;
