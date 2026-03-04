import type { TipoDocUnidad } from '@/types/vehiculos';

/**
 * Infer document type from filename keywords.
 */
export function inferirTipoDocumento(nombre: string): TipoDocUnidad {
  const n = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (n.includes('tarjeta de circulacion') || n.includes('tarjeta_circulacion')) return 'tarjeta_circulacion';
  if (n.includes('poliza de seguro') || n.includes('poliza_seguro')) return 'poliza_seguro';
  if (n.includes('titulo de concesion') || n.includes('titulo_concesion')) return 'titulo_concesion';
  if (n.includes('cromatica')) return 'cromatica';
  if (n.includes('factura')) return 'factura';
  if (n.includes('verificacion')) return 'verificacion';
  if (n.includes('permiso')) return 'permiso';
  return 'otro';
}
