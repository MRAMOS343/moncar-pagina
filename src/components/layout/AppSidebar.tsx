import { useState } from "react";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  ShoppingBag,
  Settings,
  User,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainNavItems = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: LayoutDashboard,
    description: "Resumen general del sistema"
  },
  { 
    title: "Inventario", 
    url: "/dashboard/inventario", 
    icon: Package,
    description: "Gestión de productos y stock"
  },
  { 
    title: "Ventas", 
    url: "/dashboard/ventas", 
    icon: ShoppingCart,
    description: "Registro y consulta de ventas"
  },
  { 
    title: "Predicción", 
    url: "/dashboard/prediccion", 
    icon: TrendingUp,
    description: "Pronósticos de demanda"
  },
  { 
    title: "Compra Sugerida", 
    url: "/dashboard/compras", 
    icon: ShoppingBag,
    description: "Sugerencias de reabastecimiento"
  },
];

interface AppSidebarProps {
  currentUser: any;
  onLogout: () => void;
}

export function AppSidebar({ currentUser, onLogout }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    // Para el dashboard principal, solo activar si es exactamente esa ruta
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    // Para otras rutas, activar si coincide exactamente o es una subruta
    return currentPath === path || currentPath.startsWith(path + '/');
  };
  
  const getNavClass = (url: string) => {
    const baseClass = "w-full justify-start transition-colors duration-200 py-4 px-3";
    return isActive(url) 
      ? `${baseClass} sidebar-item-active` 
      : `${baseClass} sidebar-item`;
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-72"}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-foreground">AutoParts Pro</h2>
              <p className="text-sm text-muted-foreground">Sistema de refaccionaria</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <item.icon className="w-5 h-5" />
                      {!collapsed && (
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <>
            <Separator className="my-4" />
            <SidebarGroup>
              <SidebarGroupLabel>Configuración</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/configuracion" className={getNavClass('/configuracion')}>
                        <Settings className="w-5 h-5" />
                        <span>Configuración</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && currentUser && (
          <div className="bg-secondary rounded-lg p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {currentUser.nombre}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}