import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, type SidebarNavItem } from '../components/layout/AppSidebar';
import { AppTopbar } from '../components/layout/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';
import { Truck, Settings } from 'lucide-react';
import { useDocsPorVencer } from '@/hooks/useVehiculosAPI';
import { Badge } from '@/components/ui/badge';

function FlotillaIcon({ className }: { className?: string }) {
  const { data } = useDocsPorVencer(7);
  const count = data?.items?.length ?? 0;
  return (
    <span className="relative inline-flex">
      <Truck className={className} />
      {count > 0 && (
        <Badge variant="destructive" className="absolute -top-2 -right-3 h-4 min-w-[16px] px-1 text-[10px] leading-none flex items-center justify-center">
          {count}
        </Badge>
      )}
    </span>
  );
}

function buildNavItems(rol: string): SidebarNavItem[] {
  const items: SidebarNavItem[] = [
    { title: "Flotilla", url: "/vehiculos", icon: FlotillaIcon as any, description: "Gestión de vehículos de transporte" },
  ];
  if (rol === 'admin') {
    items.push({
      title: "Config. Alertas",
      url: "/vehiculos/alertas-config",
      icon: Settings as any,
      description: "Diagnóstico y prueba del sistema de alertas",
    });
  }
  return items;
}

export function VehiculosLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useLocalStorage('autoparts_dark_mode', false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          currentUser={currentUser}
          onLogout={handleLogout}
          moduleTitle="Grupo Monzalvo"
          moduleSubtitle="Vehículos"
          navItems={buildNavItems(currentUser.rol ?? '')}
          onChangeModule={() => navigate('/selector')}
        />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <AppTopbar
            breadcrumbs={[{ label: 'Vehículos', href: '/vehiculos' }]}
            warehouses={[]}
            warehousesLoading={false}
            currentWarehouse="all"
            onWarehouseChange={() => {}}
            currentUser={currentUser}
            onRoleChange={() => {}}
            showSearch={false}
            showWarehouseSelector={false}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            <Outlet context={{ currentUser }} />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
