import { useState, useEffect } from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, type SidebarNavItem } from '../components/layout/AppSidebar';
import { AppTopbar } from '../components/layout/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useWarehouses } from '@/hooks/useWarehouses';
import { toast } from '@/hooks/use-toast';
import { LayoutDashboard, Package, ShoppingCart, FileText, TrendingUp, ShoppingBag, Users, Truck, Settings, LifeBuoy } from 'lucide-react';

const navGroups = [
  {
    label: "Operaciones",
    items: [
      { title: "Dashboard", url: "/refaccionarias", icon: LayoutDashboard, description: "Resumen general del sistema" },
      { title: "Inventario", url: "/refaccionarias/inventario", icon: Package, description: "Gestión de productos y stock" },
      { title: "Ventas", url: "/refaccionarias/ventas", icon: ShoppingCart, description: "Registro y consulta de ventas" },
      { title: "Cotizaciones", url: "/refaccionarias/cotizaciones", icon: FileText, description: "Generación y seguimiento de cotizaciones" },
    ],
  },
  {
    label: "Planeación",
    items: [
      { title: "Predicción", url: "/refaccionarias/prediccion", icon: TrendingUp, description: "Pronósticos de demanda" },
      { title: "Compra Sugerida", url: "/refaccionarias/compras", icon: ShoppingBag, description: "Sugerencias de reabastecimiento" },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Equipos", url: "/refaccionarias/equipos", icon: Users, description: "Gestión de equipos de trabajo" },
      { title: "Proveedores", url: "/refaccionarias/proveedores", icon: Truck, description: "Directorio de proveedores" },
    ],
  },
];

const footerNavItems: SidebarNavItem[] = [
  { title: "Configuración", url: "/refaccionarias/configuracion", icon: Settings, description: "Preferencias del sistema" },
  { title: "Soporte", url: "/refaccionarias/soporte", icon: LifeBuoy, description: "Tickets y ayuda" },
];

const routeLabels: Record<string, string> = {
  '/refaccionarias': 'Dashboard',
  '/refaccionarias/inventario': 'Inventario',
  '/refaccionarias/ventas': 'Ventas',
  '/refaccionarias/cotizaciones': 'Cotizaciones',
  '/refaccionarias/prediccion': 'Predicción de Ventas',
  '/refaccionarias/compras': 'Compra Sugerida',
  '/refaccionarias/equipos': 'Equipos',
  '/refaccionarias/proveedores': 'Proveedores',
  '/refaccionarias/configuracion': 'Configuración',
  '/refaccionarias/soporte': 'Soporte',
};

export function RefaccionariasLayout() {
  const { currentUser, updateUserRole, logout } = useAuth();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentWarehouse, setCurrentWarehouse] = useLocalStorage('autoparts_warehouse', 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useLocalStorage('autoparts_dark_mode', false);

  useEffect(() => {
    if (warehousesLoading) return;
    if (currentWarehouse === 'all') return;
    const exists = warehouses.some(w => w.id === currentWarehouse);
    if (!exists) setCurrentWarehouse('all');
  }, [warehousesLoading, warehouses, currentWarehouse, setCurrentWarehouse]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ label: 'Refaccionarias', href: '/refaccionarias' }];
    const label = routeLabels[location.pathname];
    if (label && location.pathname !== '/refaccionarias') {
      breadcrumbs.push({ label, href: location.pathname });
    }
    return breadcrumbs;
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
    navigate('/login');
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setCurrentWarehouse(warehouseId);
    if (warehouseId === 'all') {
      toast({ title: "Vista global", description: "Mostrando información de todas las sucursales" });
    } else {
      const warehouse = warehouses.find(w => w.id === warehouseId);
      toast({ title: "Sucursal cambiada", description: `Ahora trabajando en ${warehouse?.nombre}` });
    }
  };

  const handleRoleChange = (role: 'admin' | 'gerente' | 'cajero') => {
    updateUserRole(role);
    toast({ title: "Rol simulado cambiado", description: `Ahora trabajando como ${role}` });
  };

  const handleToggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleSearch = (query: string) => setSearchQuery(query);

  if (!currentUser) return null;

  return (
    <DataProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar
            currentUser={currentUser}
            onLogout={handleLogout}
            moduleTitle="Grupo Monzalvo"
            moduleSubtitle="Refaccionarias"
            navGroups={navGroups}
            footerItems={footerNavItems}
            onChangeModule={() => navigate('/selector')}
          />
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            <AppTopbar
              breadcrumbs={generateBreadcrumbs()}
              warehouses={warehouses}
              warehousesLoading={warehousesLoading}
              currentWarehouse={currentWarehouse}
              onWarehouseChange={handleWarehouseChange}
              currentUser={currentUser}
              onRoleChange={handleRoleChange}
              onSearch={handleSearch}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
            <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
              <Outlet context={{ currentWarehouse, searchQuery, currentUser, warehouses }} />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </DataProvider>
  );
}

// Keep backward compatibility
export { RefaccionariasLayout as DashboardLayout };
