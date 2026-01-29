/**
 * Configuración centralizada de React Query
 * Asegura consistencia en staleTime, gcTime y refetch policies
 */

export const QUERY_CONFIG = {
  // Tabla de ventas: siempre fresco, refetch al montar
  SALES_TABLE: { 
    staleTime: 0, 
    refetchOnMount: 'always' as const 
  },
  
  // KPIs de ventas: siempre fresco, refetch al montar  
  SALES_KPI: { 
    staleTime: 0, 
    refetchOnMount: true 
  },
  
  // Dashboard: datos frescos por 5 minutos
  DASHBOARD: { 
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000 
  },
  
  // Catálogos (warehouses, productos): frescos por 10 minutos
  CATALOG: {
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  },
  
  // Catálogo de productos: cache agresivo (10 minutos)
  PRODUCTS: {
    staleTime: 10 * 60 * 1000, // 10 minutos frescos
    gcTime: 15 * 60 * 1000,    // Mantener en cache 15 minutos
    refetchOnMount: false,     // No refetch al montar si está fresh
  },
} as const;
