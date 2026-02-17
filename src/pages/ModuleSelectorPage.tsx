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
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grupo Monzalvo</h1>
          <p className="text-sm text-muted-foreground">Portal de Gestión</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {currentUser.nombre} · <span className="capitalize">{currentUser.role}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Module cards */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Selecciona un módulo de trabajo
            </h2>
            <p className="text-muted-foreground">
              Elige la sección a la que deseas acceder
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MODULES.map((mod) => {
              const Icon = ICON_MAP[mod.icon] ?? Package;
              const hasAccess = allowedModules.includes(mod.id);

              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelect(mod.id, mod.basePath)}
                  disabled={!hasAccess}
                  className={`group relative flex flex-col items-center gap-4 rounded-xl border p-8 text-center transition-all duration-300
                    ${hasAccess
                      ? "border-border bg-card hover:border-primary hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                      : "border-border/50 bg-muted/30 cursor-not-allowed opacity-60"
                    }`}
                >
                  {!hasAccess && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                    ${hasAccess
                      ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
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
