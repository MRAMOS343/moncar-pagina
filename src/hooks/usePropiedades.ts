import { useState, useCallback } from 'react';
import type { Propiedad, Contrato, Pago, SolicitudMantenimiento } from '@/types/propiedades';
import { mockPropiedades, mockContratos, mockPagos, mockMantenimiento } from '@/data/mockPropiedades';

export function usePropiedades() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>(mockPropiedades);
  const [contratos, setContratos] = useState<Contrato[]>(mockContratos);
  const [pagos, setPagos] = useState<Pago[]>(mockPagos);
  const [mantenimiento, setMantenimiento] = useState<SolicitudMantenimiento[]>(mockMantenimiento);

  // ── Propiedades CRUD ──
  const addPropiedad = useCallback((data: Omit<Propiedad, 'id' | 'createdAt'>) => {
    const nueva: Propiedad = { ...data, id: `prop-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setPropiedades(prev => [...prev, nueva]);
    return nueva;
  }, []);

  const updatePropiedad = useCallback((id: string, data: Partial<Propiedad>) => {
    setPropiedades(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePropiedad = useCallback((id: string) => {
    setPropiedades(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Contratos CRUD ──
  const addContrato = useCallback((data: Omit<Contrato, 'id' | 'createdAt'>) => {
    const nuevo: Contrato = { ...data, id: `cont-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setContratos(prev => [...prev, nuevo]);
    // Mark property as rented
    setPropiedades(prev => prev.map(p => p.id === data.propiedadId ? { ...p, estado: 'rentada' as const } : p));
    return nuevo;
  }, []);

  const updateContrato = useCallback((id: string, data: Partial<Contrato>) => {
    setContratos(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  // ── Pagos CRUD ──
  const addPago = useCallback((data: Omit<Pago, 'id' | 'createdAt'>) => {
    const nuevo: Pago = { ...data, id: `pago-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    setPagos(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updatePago = useCallback((id: string, data: Partial<Pago>) => {
    setPagos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  // ── Mantenimiento CRUD ──
  const addMantenimiento = useCallback((data: Omit<SolicitudMantenimiento, 'id'>) => {
    const nuevo: SolicitudMantenimiento = { ...data, id: `mant-${Date.now()}` };
    setMantenimiento(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updateMantenimiento = useCallback((id: string, data: Partial<SolicitudMantenimiento>) => {
    setMantenimiento(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  return {
    propiedades, contratos, pagos, mantenimiento,
    addPropiedad, updatePropiedad, deletePropiedad,
    addContrato, updateContrato,
    addPago, updatePago,
    addMantenimiento, updateMantenimiento,
  };
}
