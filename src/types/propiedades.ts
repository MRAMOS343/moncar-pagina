export type TipoPropiedad = 'casa' | 'departamento' | 'local_comercial' | 'bodega' | 'terreno' | 'oficina';
export type EstadoPropiedad = 'disponible' | 'rentada' | 'mantenimiento';
export type EstadoPago = 'pendiente' | 'pagado' | 'atrasado' | 'parcial';
export type PrioridadMantenimiento = 'baja' | 'media' | 'alta' | 'urgente';
export type EstadoMantenimiento = 'pendiente' | 'en_progreso' | 'completado';
export type TipoDocumento = 'recibo_luz' | 'recibo_agua' | 'predial' | 'contrato_firmado' | 'identificacion' | 'comprobante_domicilio' | 'otro';

export interface DocumentoPropiedad {
  id: string;
  propiedadId: string;
  nombre: string;
  tipo: TipoDocumento;
  archivo: string | null;
  fechaSubida: string;
  notas: string;
}

export interface Propiedad {
  id: string;
  direccion: string;
  tipo: TipoPropiedad;
  metrosCuadrados: number;
  habitaciones: number;
  banos: number;
  estacionamientos: number;
  estado: EstadoPropiedad;
  descripcion: string;
  fotos: string[];
  costoMensual: number;
  createdAt: string;
}

export interface Contrato {
  id: string;
  propiedadId: string;
  arrendatarioNombre: string;
  arrendatarioContacto: string;
  arrendatarioEmail: string;
  arrendatarioRFC: string;
  arrendatarioIdentificacion: string;
  fechaInicio: string;
  fechaFin: string;
  montoMensual: number;
  diaPago: number;
  deposito: number;
  condicionesEspeciales: string;
  activo: boolean;
  createdAt: string;
}

export interface Pago {
  id: string;
  contratoId: string;
  propiedadId: string;
  mesCorrespondiente: string;
  montoEsperado: number;
  montoPagado: number;
  fechaEsperada: string;
  fechaPago: string | null;
  estado: EstadoPago;
  comprobante: string | null;
  notas: string;
  createdAt: string;
}

export interface SolicitudMantenimiento {
  id: string;
  propiedadId: string;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadMantenimiento;
  estado: EstadoMantenimiento;
  costoEstimado: number;
  costoReal: number | null;
  proveedor: string;
  fechaSolicitud: string;
  fechaResolucion: string | null;
}
