import { useState, useCallback } from 'react';
import type { Ruta, Unidad, DocumentoUnidad, MantenimientoVehiculo, GastoVehiculo, AlertaDocumento } from '@/types/vehiculos';
import { mockRutas, mockUnidades, mockDocumentos, mockMantenimientoVeh, mockGastosVeh, mockAlertas } from '@/data/mockVehiculos';

export function useVehiculos() {
  const [rutas, setRutas] = useState<Ruta[]>(mockRutas);
  const [unidades, setUnidades] = useState<Unidad[]>(mockUnidades);
  const [documentos, setDocumentos] = useState<DocumentoUnidad[]>(mockDocumentos);
  const [mantenimientos, setMantenimientos] = useState<MantenimientoVehiculo[]>(mockMantenimientoVeh);
  const [gastos, setGastos] = useState<GastoVehiculo[]>(mockGastosVeh);
  const [alertas, setAlertas] = useState<AlertaDocumento[]>(mockAlertas);

  // ── Rutas CRUD ──
  const addRuta = useCallback((data: Omit<Ruta, 'id' | 'createdAt'>) => {
    const nueva: Ruta = { ...data, id: `ruta-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setRutas(prev => [...prev, nueva]);
    return nueva;
  }, []);

  const updateRuta = useCallback((id: string, data: Partial<Ruta>) => {
    setRutas(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  }, []);

  const deleteRuta = useCallback((id: string) => {
    const unidadIds = unidades.filter(u => u.rutaId === id).map(u => u.id);
    setRutas(prev => prev.filter(r => r.id !== id));
    setUnidades(prev => prev.filter(u => u.rutaId !== id));
    setDocumentos(prev => prev.filter(d => !unidadIds.includes(d.unidadId)));
    setMantenimientos(prev => prev.filter(m => !unidadIds.includes(m.unidadId)));
    setGastos(prev => prev.filter(g => !unidadIds.includes(g.unidadId)));
    setAlertas(prev => prev.filter(a => !unidadIds.includes(a.unidadId)));
  }, [unidades]);

  // ── Unidades CRUD ──
  const addUnidad = useCallback((data: Omit<Unidad, 'id' | 'createdAt'>) => {
    const nueva: Unidad = { ...data, id: `u-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setUnidades(prev => [...prev, nueva]);
    return nueva;
  }, []);

  const updateUnidad = useCallback((id: string, data: Partial<Unidad>) => {
    setUnidades(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  }, []);

  const deleteUnidad = useCallback((id: string) => {
    setUnidades(prev => prev.filter(u => u.id !== id));
    setDocumentos(prev => prev.filter(d => d.unidadId !== id));
    setMantenimientos(prev => prev.filter(m => m.unidadId !== id));
    setGastos(prev => prev.filter(g => g.unidadId !== id));
    setAlertas(prev => prev.filter(a => a.unidadId !== id));
  }, []);

  // ── Documentos CRUD ──
  const addDocumento = useCallback((data: Omit<DocumentoUnidad, 'id'>) => {
    const nuevo: DocumentoUnidad = { ...data, id: `d-${Date.now()}` };
    setDocumentos(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const deleteDocumento = useCallback((id: string) => {
    setDocumentos(prev => prev.filter(d => d.id !== id));
  }, []);

  // ── Alertas CRUD ──
  const upsertAlerta = useCallback((data: Omit<AlertaDocumento, 'id'>) => {
    setAlertas(prev => {
      const existing = prev.find(a => a.unidadId === data.unidadId && a.tipoDocumento === data.tipoDocumento);
      if (existing) {
        return prev.map(a => a.id === existing.id ? { ...a, ...data } : a);
      }
      return [...prev, { ...data, id: `al-${Date.now()}` }];
    });
  }, []);

  const deleteAlerta = useCallback((id: string) => {
    setAlertas(prev => prev.filter(a => a.id !== id));
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
    rutas, unidades, documentos, mantenimientos, gastos, alertas,
    addRuta, updateRuta, deleteRuta,
    addUnidad, updateUnidad, deleteUnidad,
    addDocumento, deleteDocumento,
    upsertAlerta, deleteAlerta,
    addMantenimiento, updateMantenimiento,
    addGasto, deleteGasto,
  };
}
