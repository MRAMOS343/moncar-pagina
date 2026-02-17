import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar, type SidebarNavItem } from '../components/layout/AppSidebar';
import { AppTopbar } from '../components/layout/AppTopbar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from '@/hooks/use-toast';
import { Building2 } from 'lucide-react';

const navItems: SidebarNavItem[] = [
  { title: "Inmuebles", url: "/propiedades", icon: Building2, description: "Gestión de propiedades en renta" },
];

const routeLabels: Record<string, string> = {
  '/propiedades': 'Inmuebles en Renta',
};

export function PropiedadesLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useLocalStorage('autoparts_dark_mode', false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ label: 'Propiedades', href: '/propiedades' }];
    const label = routeLabels[location.pathname];
    if (label && location.pathname !== '/propiedades') {
      breadcrumbs.push({ label, href: location.pathname });
    }
    return breadcrumbs;
  };

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
          moduleSubtitle="Propiedades"
          navItems={navItems}
          onChangeModule={() => navigate('/selector')}
        />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <AppTopbar
            breadcrumbs={generateBreadcrumbs()}
            warehouses={[]}
            warehousesLoading={false}
            currentWarehouse="all"
            onWarehouseChange={() => {}}
            currentUser={currentUser}
            onRoleChange={() => {}}
            onSearch={() => {}}
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
