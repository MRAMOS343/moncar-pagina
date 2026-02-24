import type { Ruta, Unidad, DocumentoUnidad, MantenimientoVehiculo, GastoVehiculo, AlertaDocumento } from '@/types/vehiculos';

/* ════════════════════════════════════════════
   RUTAS
   ════════════════════════════════════════════ */
export const mockRutas: Ruta[] = [
  { id: 'ruta-1', nombre: 'Paseos de Chavarría 2026', descripcion: 'Ruta principal zona residencial', activa: true, createdAt: '2026-01-05' },
  { id: 'ruta-2', nombre: 'Centro Histórico 2026', descripcion: 'Cobertura centro de la ciudad', activa: true, createdAt: '2026-01-10' },
];

/* ════════════════════════════════════════════
   UNIDADES
   ════════════════════════════════════════════ */
export const mockUnidades: Unidad[] = [
  // Ruta 1 — Paseos de Chavarría
  { id: 'u-04', rutaId: 'ruta-1', numero: '04', placa: 'DGO-104-A', marca: 'Chevrolet', modelo: 'Silverado', anio: 2022, color: 'Blanco', km: 45200, estado: 'activo', descripcion: '', createdAt: '2022-03-15' },
  { id: 'u-07', rutaId: 'ruta-1', numero: '07', placa: 'DGO-107-B', marca: 'Nissan', modelo: 'NP300', anio: 2021, color: 'Gris', km: 68300, estado: 'activo', descripcion: '', createdAt: '2021-08-20' },
  { id: 'u-08', rutaId: 'ruta-1', numero: '08', placa: 'DGO-108-C', marca: 'Ford', modelo: 'Transit', anio: 2023, color: 'Azul', km: 22100, estado: 'taller', descripcion: 'En reparación de transmisión', createdAt: '2023-01-10' },
  { id: 'u-09', rutaId: 'ruta-1', numero: '09', placa: 'DGO-109-D', marca: 'Toyota', modelo: 'Hilux', anio: 2020, color: 'Rojo', km: 95000, estado: 'activo', descripcion: '', createdAt: '2020-06-01' },
  { id: 'u-11', rutaId: 'ruta-1', numero: '11', placa: 'DGO-111-E', marca: 'Chevrolet', modelo: 'Silverado', anio: 2023, color: 'Negro', km: 18500, estado: 'activo', descripcion: '', createdAt: '2023-05-12' },
  { id: 'u-12', rutaId: 'ruta-1', numero: '12', placa: 'DGO-112-F', marca: 'Nissan', modelo: 'NP300', anio: 2022, color: 'Blanco', km: 52000, estado: 'activo', descripcion: '', createdAt: '2022-09-01' },
  // Ruta 2 — Centro Histórico
  { id: 'u-14', rutaId: 'ruta-2', numero: '14', placa: 'DGO-214-A', marca: 'Ford', modelo: 'Ranger', anio: 2024, color: 'Gris', km: 8200, estado: 'activo', descripcion: '', createdAt: '2024-02-10' },
  { id: 'u-16', rutaId: 'ruta-2', numero: '16', placa: 'DGO-216-B', marca: 'Chevrolet', modelo: 'S10', anio: 2021, color: 'Plata', km: 71000, estado: 'activo', descripcion: '', createdAt: '2021-11-05' },
  { id: 'u-17', rutaId: 'ruta-2', numero: '17', placa: 'DGO-217-C', marca: 'Toyota', modelo: 'Hilux', anio: 2023, color: 'Blanco', km: 29400, estado: 'baja', descripcion: 'Dada de baja por siniestro', createdAt: '2023-03-20' },
];

/* ════════════════════════════════════════════
   DOCUMENTOS
   ════════════════════════════════════════════ */
function doc(id: string, unidadId: string, nombre: string, tipo: DocumentoUnidad['tipo'], vigencia: string | null, tamano: number | null, fecha: string): DocumentoUnidad {
  return { id, unidadId, nombre, tipo, vigencia, archivoUrl: null, tamanoBytes: tamano, fechaSubida: fecha, notas: '' };
}

export const mockDocumentos: DocumentoUnidad[] = [
  // Unidad 04
  doc('d-04-1', 'u-04', 'Cromatica 04 Chavarria.pdf', 'cromatica', null, 807_000, '2026-02-09'),
  doc('d-04-2', 'u-04', 'Factura 04 Chavarria.pdf', 'factura', null, 1_900_000, '2026-02-09'),
  doc('d-04-3', 'u-04', 'Poliza de Seguro 04 Chavarria.pdf', 'poliza_seguro', '2026-03-15', 2_000_000, '2026-02-13'),
  doc('d-04-4', 'u-04', 'Tarjeta de Circulacion 04 Chavarria.pdf', 'tarjeta_circulacion', '2025-07-04', 730_000, '2025-07-04'),
  doc('d-04-5', 'u-04', 'Titulo de Concesion 04 Chavarria.pdf', 'titulo_concesion', '2027-02-17', 1_500_000, '2026-02-17'),
  // Unidad 07
  doc('d-07-1', 'u-07', 'Cromatica 07 Chavarria.pdf', 'cromatica', null, 692_000, '2026-02-09'),
  doc('d-07-2', 'u-07', 'Factura 07 Chavarria.pdf', 'factura', null, 1_900_000, '2026-02-09'),
  doc('d-07-3', 'u-07', 'Poliza de Seguro 07 Chavarria.pdf', 'poliza_seguro', '2026-04-10', 2_300_000, '2026-02-13'),
  doc('d-07-4', 'u-07', 'Tarjeta de Circulacion 07 Chavarria.pdf', 'tarjeta_circulacion', '2025-07-03', 722_000, '2025-07-03'),
  doc('d-07-5', 'u-07', 'Titulo de Concesion 07 Chavarria.pdf', 'titulo_concesion', '2027-02-17', 1_500_000, '2026-02-17'),
  // Unidad 08 — solo un doc
  doc('d-08-1', 'u-08', 'Poliza de Seguro 08 Chavarria.pdf', 'poliza_seguro', '2026-06-01', 1_800_000, '2026-01-15'),
  // Unidad 14 (Centro Hist.)
  doc('d-14-1', 'u-14', 'Cromatica 14 Centro.pdf', 'cromatica', null, 750_000, '2026-02-10'),
  doc('d-14-2', 'u-14', 'Poliza de Seguro 14 Centro.pdf', 'poliza_seguro', '2026-05-20', 2_100_000, '2026-02-12'),
  doc('d-14-3', 'u-14', 'Tarjeta de Circulacion 14 Centro.pdf', 'tarjeta_circulacion', '2026-12-31', 680_000, '2026-01-20'),
  // Unidad 16
  doc('d-16-1', 'u-16', 'Factura 16 Centro.pdf', 'factura', null, 1_600_000, '2026-02-08'),
  doc('d-16-2', 'u-16', 'Poliza de Seguro 16 Centro.pdf', 'poliza_seguro', '2026-03-01', 2_400_000, '2026-01-05'),
];

/* ════════════════════════════════════════════
   ALERTAS
   ════════════════════════════════════════════ */
export const mockAlertas: AlertaDocumento[] = [
  { id: 'al-1', unidadId: 'u-04', tipoDocumento: 'poliza_seguro', diasAntes: 30, activa: true },
  { id: 'al-2', unidadId: 'u-04', tipoDocumento: 'tarjeta_circulacion', diasAntes: 60, activa: true },
  { id: 'al-3', unidadId: 'u-07', tipoDocumento: 'poliza_seguro', diasAntes: 30, activa: true },
  { id: 'al-4', unidadId: 'u-14', tipoDocumento: 'poliza_seguro', diasAntes: 30, activa: true },
  { id: 'al-5', unidadId: 'u-16', tipoDocumento: 'poliza_seguro', diasAntes: 15, activa: true },
];

/* ════════════════════════════════════════════
   MANTENIMIENTO (legacy)
   ════════════════════════════════════════════ */
export const mockMantenimientoVeh: MantenimientoVehiculo[] = [
  { id: 'mveh-1', unidadId: 'u-04', fecha: '2026-01-10', tipo: 'preventivo', descripcion: 'Cambio de aceite y filtros', km: 45000, costo: 2800, proveedor: 'Taller Durango', notas: '' },
  { id: 'mveh-2', unidadId: 'u-04', fecha: '2025-07-15', tipo: 'preventivo', descripcion: 'Afinación mayor', km: 40000, costo: 5500, proveedor: 'Servicio Chevrolet', notas: 'Garantía incluida' },
  { id: 'mveh-3', unidadId: 'u-07', fecha: '2025-11-22', tipo: 'correctivo', descripcion: 'Cambio de frenos delanteros', km: 65000, costo: 4200, proveedor: 'Frenos y Más', notas: '' },
  { id: 'mveh-4', unidadId: 'u-08', fecha: '2026-02-01', tipo: 'correctivo', descripcion: 'Reparación de transmisión', km: 22000, costo: 18500, proveedor: 'Taller Ford', notas: 'En proceso' },
];

/* ════════════════════════════════════════════
   GASTOS (legacy)
   ════════════════════════════════════════════ */
export const mockGastosVeh: GastoVehiculo[] = [
  { id: 'gveh-1', unidadId: 'u-04', fecha: '2026-02-20', tipo: 'combustible', monto: 1200, descripcion: 'Tanque lleno', evidencia: null },
  { id: 'gveh-2', unidadId: 'u-04', fecha: '2026-02-15', tipo: 'casetas', monto: 350, descripcion: 'Durango-Mazatlán', evidencia: null },
  { id: 'gveh-3', unidadId: 'u-07', fecha: '2026-02-18', tipo: 'combustible', monto: 980, descripcion: 'Tanque lleno', evidencia: null },
  { id: 'gveh-4', unidadId: 'u-07', fecha: '2026-02-10', tipo: 'estacionamiento', monto: 80, descripcion: 'Centro comercial', evidencia: null },
  { id: 'gveh-5', unidadId: 'u-04', fecha: '2026-01-25', tipo: 'combustible', monto: 1150, descripcion: 'Tanque lleno', evidencia: null },
  { id: 'gveh-6', unidadId: 'u-08', fecha: '2026-01-20', tipo: 'multa', monto: 2200, descripcion: 'Infracción estacionamiento', evidencia: null },
];

// Legacy re-exports for backward compat
export const mockVehiculos = mockUnidades;
export const mockDocumentosVeh = mockDocumentos;
