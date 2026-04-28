import { Package, User as UserIcon, LogOut, ArrowLeft } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { User } from "@/types";
import type { LucideIcon } from "lucide-react";

export interface SidebarNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

interface AppSidebarProps {
  currentUser: User | null;
  onLogout: () => void;
  moduleTitle: string;
  moduleSubtitle: string;
  navItems?: SidebarNavItem[];
  navGroups?: SidebarNavGroup[];
  footerItems?: SidebarNavItem[];
  onChangeModule?: () => void;
}

export function AppSidebar({
  currentUser,
  onLogout,
  moduleTitle,
  moduleSubtitle,
  navItems,
  navGroups,
  footerItems,
  onChangeModule,
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  // Normalize: if navGroups not provided, fall back to legacy single navItems group.
  const groups: SidebarNavGroup[] = navGroups
    ? navGroups
    : [{ label: "Navegación", items: navItems ?? [] }];
  const firstItemUrl = groups[0]?.items[0]?.url;

  const isActive = (path: string) => {
    // For the base route of the module, only match exact
    const isBaseRoute = firstItemUrl === path;
    if (isBaseRoute) return currentPath === path;
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const getNavClass = (url: string) => {
    const baseClass = "w-full justify-start transition-colors duration-200 py-4 px-3";
    return isActive(url) ? `${baseClass} sidebar-item-active` : `${baseClass} sidebar-item`;
  };

  const renderItem = (item: SidebarNavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
        <NavLink
          to={item.url}
          className={`${getNavClass(item.url)} touch-target min-h-[44px] ${collapsed ? "justify-center" : ""}`}
        >
          <item.icon className={collapsed ? "w-6 h-6" : "w-5 h-5 min-w-[1.25rem]"} />
          {!collapsed && (
            <div className="flex flex-col items-start gap-0.5 min-w-0">
              <span className="font-medium truncate w-full">{item.title}</span>
              <span className="text-xs leading-tight line-clamp-1">{item.description}</span>
            </div>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={collapsed ? "p-3" : "p-4"}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 min-w-[2.5rem] bg-primary rounded-lg flex items-center justify-center touch-target">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{moduleTitle}</h2>
              <p className="text-sm text-muted-foreground truncate">{moduleSubtitle}</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={collapsed ? "px-1" : "px-2"}>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel
              className={
                collapsed
                  ? "sr-only"
                  : "text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1"
              }
            >
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className={collapsed ? "gap-3" : "gap-2"}>
                {group.items.map(renderItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {footerItems && footerItems.length > 0 && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className={collapsed ? "gap-3" : "gap-2"}>
                  {footerItems.map(renderItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className={collapsed ? "p-2" : "p-4"}>
        {currentUser && (
          <div className={collapsed ? "flex justify-center mb-2" : "bg-secondary rounded-lg p-3 mb-2"}>
            {collapsed ? (
              <div className="w-10 h-10 min-w-[2.5rem] bg-primary rounded-full flex items-center justify-center touch-target">
                <UserIcon className="w-5 h-5 text-primary-foreground" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 min-w-[2.5rem] bg-primary rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{currentUser.nombre}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">{currentUser.role}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {onChangeModule && (
          <Button
            variant="outline"
            size={collapsed ? "icon" : "default"}
            onClick={onChangeModule}
            className={`w-full touch-target min-h-[44px] mb-1 ${collapsed ? "justify-center" : "justify-start"}`}
            title={collapsed ? "Cambiar Módulo" : undefined}
          >
            <ArrowLeft className={collapsed ? "w-5 h-5" : "w-4 h-4 min-w-[1rem]"} />
            {!collapsed && <span>Cambiar Módulo</span>}
          </Button>
        )}

        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={onLogout}
          className={`w-full touch-target min-h-[44px] ${collapsed ? "justify-center" : "justify-start"}`}
          title={collapsed ? "Cerrar Sesión" : undefined}
          aria-label="Cerrar sesión"
        >
          <LogOut className={collapsed ? "w-5 h-5" : "w-4 h-4 min-w-[1rem]"} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
