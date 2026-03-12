import type { Cotizacion, CotizacionEstado } from '@/types/cotizaciones';

const STORAGE_KEY = 'moncar_cotizaciones';

function readAll(): Cotizacion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(data: Cotizacion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextFolio(existing: Cotizacion[]): string {
  const max = existing.reduce((m, c) => {
    const num = parseInt(c.folio.replace('MC-', ''), 10);
    return isNaN(num) ? m : Math.max(m, num);
  }, 0);
  return `MC-${String(max + 1).padStart(4, '0')}`;
}

export function fetchCotizaciones(): Cotizacion[] {
  return readAll().sort((a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime());
}

export function createCotizacion(data: Omit<Cotizacion, 'id' | 'folio' | 'creadaEn'>): Cotizacion {
  const all = readAll();
  const cotizacion: Cotizacion = {
    ...data,
    id: crypto.randomUUID(),
    folio: nextFolio(all),
    creadaEn: new Date().toISOString(),
  };
  all.push(cotizacion);
  writeAll(all);
  return cotizacion;
}

export function updateCotizacionEstado(id: string, estado: CotizacionEstado): Cotizacion | null {
  const all = readAll();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return null;
  all[idx].estado = estado;
  writeAll(all);
  return all[idx];
}

export function duplicateCotizacion(id: string): Cotizacion | null {
  const all = readAll();
  const original = all.find(c => c.id === id);
  if (!original) return null;
  const copy: Cotizacion = {
    ...original,
    id: crypto.randomUUID(),
    folio: nextFolio(all),
    estado: 'pendiente',
    fecha: new Date().toISOString().split('T')[0],
    creadaEn: new Date().toISOString(),
  };
  all.push(copy);
  writeAll(all);
  return copy;
}
