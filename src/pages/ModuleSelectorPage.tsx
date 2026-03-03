import { useNavigate } from "react-router-dom";
import { Package, Building2, Truck, LogOut, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserModules, MODULES, type ModuleId } from "@/utils/moduleAccess";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ICON_MAP: Record<string, React.ElementType> = {
  Package,
  Building2,
  Truck,
};

export default function ModuleSelectorPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const allowedModules = getUserModules(currentUser.role);

  const handleSelect = (moduleId: ModuleId, basePath: string) => {
    if (!allowedModules.includes(moduleId)) return;
    navigate(basePath);
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Grupo Monzalvo</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Portal de Gestión</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[180px] md:max-w-none">
            {currentUser.nombre} · <span className="capitalize">{currentUser.role}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0">
            <LogOut className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
          </Button>
        </div>
      </header>

      {/* Module cards */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Selecciona un módulo
            </h2>
            <p className="text-sm text-muted-foreground">
              Elige la sección a la que deseas acceder
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {MODULES.map((mod) => {
              const Icon = ICON_MAP[mod.icon] ?? Package;
              const hasAccess = allowedModules.includes(mod.id);

              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelect(mod.id, mod.basePath)}
                  disabled={!hasAccess}
                  className={`group relative flex flex-col items-center gap-3 md:gap-4 rounded-xl border p-6 md:p-8 text-center transition-all duration-300
                    ${hasAccess
                      ? "border-border bg-card hover:border-primary hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.98]"
                      : "border-border/50 bg-muted/30 cursor-not-allowed opacity-60"
                    }`}
                >
                  {!hasAccess && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-colors
                    ${hasAccess
                      ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}>
                    <Icon className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">{mod.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{mod.description}</p>
                  </div>
                  {hasAccess && (
                    <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Entrar →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
