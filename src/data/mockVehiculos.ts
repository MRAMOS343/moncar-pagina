import type { Vehiculo, DocumentoVehiculo, MantenimientoVehiculo, GastoVehiculo } from '@/types/vehiculos';

export const mockVehiculos: Vehiculo[] = [
  {
    id: 'veh-1', placa: 'DGO-123-A', marca: 'Chevrolet', modelo: 'Silverado 1500', anio: 2022,
    color: 'Blanco', km: 45200, estado: 'activo',
    descripcion: 'Camioneta de reparto principal', createdAt: '2022-03-15',
  },
  {
    id: 'veh-2', placa: 'DGO-456-B', marca: 'Nissan', modelo: 'NP300', anio: 2021,
    color: 'Gris', km: 68300, estado: 'activo',
    descripcion: 'Entregas zona metropolitana', createdAt: '2021-08-20',
  },
  {
    id: 'veh-3', placa: 'DGO-789-C', marca: 'Ford', modelo: 'Transit', anio: 2023,
    color: 'Azul', km: 22100, estado: 'taller',
    descripcion: 'Van de carga — en reparación de transmisión', createdAt: '2023-01-10',
  },
  {
    id: 'veh-4', placa: 'DGO-321-D', marca: 'Toyota', modelo: 'Hilux', anio: 2020,
    color: 'Rojo', km: 95000, estado: 'baja',
    descripcion: 'Unidad dada de baja por antigüedad', createdAt: '2020-06-01',
  },
];

export const mockDocumentosVeh: DocumentoVehiculo[] = [
  { id: 'dveh-1', vehiculoId: 'veh-1', nombre: 'Seguro GNP 2026', tipo: 'seguro', vigencia: '2026-06-30', archivo: null, fechaSubida: '2026-01-05', notas: 'Cobertura amplia' },
  { id: 'dveh-2', vehiculoId: 'veh-1', nombre: 'Verificación Semestral', tipo: 'verificacion', vigencia: '2026-03-15', archivo: null, fechaSubida: '2025-09-18', notas: '' },
  { id: 'dveh-3', vehiculoId: 'veh-2', nombre: 'Seguro Qualitas 2026', tipo: 'seguro', vigencia: '2026-04-10', archivo: null, fechaSubida: '2026-01-12', notas: '' },
  { id: 'dveh-4', vehiculoId: 'veh-3', nombre: 'Tarjeta de circulación', tipo: 'tarjeta_circulacion', vigencia: '2026-12-31', archivo: null, fechaSubida: '2025-01-20', notas: '' },
];

export const mockMantenimientoVeh: MantenimientoVehiculo[] = [
  { id: 'mveh-1', vehiculoId: 'veh-1', fecha: '2026-01-10', tipo: 'preventivo', descripcion: 'Cambio de aceite y filtros', km: 45000, costo: 2800, proveedor: 'Taller Durango', notas: '' },
  { id: 'mveh-2', vehiculoId: 'veh-1', fecha: '2025-07-15', tipo: 'preventivo', descripcion: 'Afinación mayor', km: 40000, costo: 5500, proveedor: 'Servicio Chevrolet', notas: 'Garantía incluida' },
  { id: 'mveh-3', vehiculoId: 'veh-2', fecha: '2025-11-22', tipo: 'correctivo', descripcion: 'Cambio de frenos delanteros', km: 65000, costo: 4200, proveedor: 'Frenos y Más', notas: '' },
  { id: 'mveh-4', vehiculoId: 'veh-3', fecha: '2026-02-01', tipo: 'correctivo', descripcion: 'Reparación de transmisión', km: 22000, costo: 18500, proveedor: 'Taller Ford', notas: 'En proceso' },
];

export const mockGastosVeh: GastoVehiculo[] = [
  { id: 'gveh-1', vehiculoId: 'veh-1', fecha: '2026-02-20', tipo: 'combustible', monto: 1200, descripcion: 'Tanque lleno', evidencia: null },
  { id: 'gveh-2', vehiculoId: 'veh-1', fecha: '2026-02-15', tipo: 'casetas', monto: 350, descripcion: 'Durango-Mazatlán', evidencia: null },
  { id: 'gveh-3', vehiculoId: 'veh-2', fecha: '2026-02-18', tipo: 'combustible', monto: 980, descripcion: 'Tanque lleno', evidencia: null },
  { id: 'gveh-4', vehiculoId: 'veh-2', fecha: '2026-02-10', tipo: 'estacionamiento', monto: 80, descripcion: 'Centro comercial', evidencia: null },
  { id: 'gveh-5', vehiculoId: 'veh-1', fecha: '2026-01-25', tipo: 'combustible', monto: 1150, descripcion: 'Tanque lleno', evidencia: null },
  { id: 'gveh-6', vehiculoId: 'veh-3', fecha: '2026-01-20', tipo: 'multa', monto: 2200, descripcion: 'Infracción estacionamiento', evidencia: null },
];
