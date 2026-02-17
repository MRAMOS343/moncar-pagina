import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessModule, type ModuleId } from "@/utils/moduleAccess";

interface ModuleRouteProps {
  module: ModuleId;
  children: ReactNode;
}

export function ModuleRoute({ module, children }: ModuleRouteProps) {
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessModule(currentUser.role, module)) {
    return <Navigate to="/selector" replace />;
  }

  return <>{children}</>;
}
