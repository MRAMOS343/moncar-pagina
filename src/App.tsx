import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos por defecto
      gcTime: 10 * 60 * 1000,   // Mantener en cache 10 minutos
      refetchOnWindowFocus: false, // Evitar refetch al cambiar de pestaña
      retry: 1, // Solo 1 reintento en errores
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <Outlet />
          </ErrorBoundary>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
