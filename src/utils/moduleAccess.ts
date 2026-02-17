import type { User } from "@/types";

export type ModuleId = 'refaccionarias' | 'propiedades' | 'vehiculos';

export interface ModuleInfo {
  id: ModuleId;
  title: string;
  description: string;
  icon: string; // lucide icon name
  basePath: string;
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'refaccionarias',
    title: 'Refaccionarias',
    description: 'Inventario, ventas, predicción y compra sugerida',
    icon: 'Package',
    basePath: '/refaccionarias',
  },
  {
    id: 'propiedades',
    title: 'Propiedades',
    description: 'Inmuebles en renta, pagos, contratos y documentos',
    icon: 'Building2',
    basePath: '/propiedades',
  },
  {
    id: 'vehiculos',
    title: 'Vehículos',
    description: 'Flotilla de transporte, mantenimiento y gastos',
    icon: 'Truck',
    basePath: '/vehiculos',
  },
];

const MODULE_ACCESS: Record<User['role'], ModuleId[]> = {
  admin: ['refaccionarias', 'propiedades', 'vehiculos'],
  developer: ['refaccionarias', 'propiedades', 'vehiculos'],
  gerente: ['refaccionarias'],
  cajero: ['refaccionarias'],
  gestor_propiedades: ['propiedades'],
  gestor_vehiculos: ['vehiculos'],
};

export function getUserModules(role: User['role']): ModuleId[] {
  return MODULE_ACCESS[role] ?? [];
}

export function canAccessModule(role: User['role'], module: ModuleId): boolean {
  return getUserModules(role).includes(module);
}
