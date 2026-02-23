import { useState, useCallback } from 'react';
import type { Vehiculo, DocumentoVehiculo, MantenimientoVehiculo, GastoVehiculo } from '@/types/vehiculos';
import { mockVehiculos, mockDocumentosVeh, mockMantenimientoVeh, mockGastosVeh } from '@/data/mockVehiculos';

export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(mockVehiculos);
  const [documentos, setDocumentos] = useState<DocumentoVehiculo[]>(mockDocumentosVeh);
  const [mantenimientos, setMantenimientos] = useState<MantenimientoVehiculo[]>(mockMantenimientoVeh);
  const [gastos, setGastos] = useState<GastoVehiculo[]>(mockGastosVeh);

  // ── Vehiculos CRUD ──
  const addVehiculo = useCallback((data: Omit<Vehiculo, 'id' | 'createdAt'>) => {
    const nuevo: Vehiculo = { ...data, id: `veh-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setVehiculos(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updateVehiculo = useCallback((id: string, data: Partial<Vehiculo>) => {
    setVehiculos(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  }, []);

  const deleteVehiculo = useCallback((id: string) => {
    setVehiculos(prev => prev.filter(v => v.id !== id));
    setDocumentos(prev => prev.filter(d => d.vehiculoId !== id));
    setMantenimientos(prev => prev.filter(m => m.vehiculoId !== id));
    setGastos(prev => prev.filter(g => g.vehiculoId !== id));
  }, []);

  // ── Documentos CRUD ──
  const addDocumento = useCallback((data: Omit<DocumentoVehiculo, 'id'>) => {
    const nuevo: DocumentoVehiculo = { ...data, id: `dveh-${Date.now()}` };
    setDocumentos(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const deleteDocumento = useCallback((id: string) => {
    setDocumentos(prev => prev.filter(d => d.id !== id));
  }, []);

  // ── Mantenimiento CRUD ──
  const addMantenimiento = useCallback((data: Omit<MantenimientoVehiculo, 'id'>) => {
    const nuevo: MantenimientoVehiculo = { ...data, id: `mveh-${Date.now()}` };
    setMantenimientos(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updateMantenimiento = useCallback((id: string, data: Partial<MantenimientoVehiculo>) => {
    setMantenimientos(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  // ── Gastos CRUD ──
  const addGasto = useCallback((data: Omit<GastoVehiculo, 'id'>) => {
    const nuevo: GastoVehiculo = { ...data, id: `gveh-${Date.now()}` };
    setGastos(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const deleteGasto = useCallback((id: string) => {
    setGastos(prev => prev.filter(g => g.id !== id));
  }, []);

  return {
    vehiculos, documentos, mantenimientos, gastos,
    addVehiculo, updateVehiculo, deleteVehiculo,
    addDocumento, deleteDocumento,
    addMantenimiento, updateMantenimiento,
    addGasto, deleteGasto,
  };
}
