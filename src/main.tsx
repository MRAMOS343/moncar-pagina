import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import App from "./App.tsx";
import "./index.css";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ModuleRoute } from "./components/auth/ModuleRoute";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ModuleSelectorPage = lazy(() => import("./pages/ModuleSelectorPage"));
const RefaccionariasLayout = lazy(() => import("./pages/RefaccionariasLayout").then(m => ({ default: m.RefaccionariasLayout })));
const PropiedadesLayout = lazy(() => import("./pages/PropiedadesLayout").then(m => ({ default: m.PropiedadesLayout })));
const VehiculosLayout = lazy(() => import("./pages/VehiculosLayout").then(m => ({ default: m.VehiculosLayout })));

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const InventarioPage = lazy(() => import("./pages/InventarioPage"));
const VentasPage = lazy(() => import("./pages/VentasPage"));
const ComprasPage = lazy(() => import("./pages/ComprasPage"));
const PrediccionPage = lazy(() => import("./pages/PrediccionPage"));
const EquiposPage = lazy(() => import("./pages/EquiposPage"));
const ProveedoresPage = lazy(() => import("./pages/ProveedoresPage"));
const ConfiguracionPage = lazy(() => import("./pages/ConfiguracionPage"));
const SoportePage = lazy(() => import("./pages/SoportePage"));
const PropiedadesPage = lazy(() => import("./pages/PropiedadesPage"));
const VehiculosPage = lazy(() => import("./pages/VehiculosPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <S><Index /></S> },
      { path: "login", element: <S><LoginPage /></S> },
      {
        path: "selector",
        element: (
          <ProtectedRoute>
            <S><ModuleSelectorPage /></S>
          </ProtectedRoute>
        ),
      },
      {
        path: "refaccionarias",
        element: (
          <ModuleRoute module="refaccionarias">
            <S><RefaccionariasLayout /></S>
          </ModuleRoute>
        ),
        children: [
          { index: true, element: <S><DashboardPage /></S> },
          { path: "inventario", element: <S><InventarioPage /></S> },
          { path: "ventas", element: <S><VentasPage /></S> },
          { path: "compras", element: <S><ComprasPage /></S> },
          { path: "prediccion", element: <S><PrediccionPage /></S> },
          { path: "equipos", element: <S><EquiposPage /></S> },
          { path: "proveedores", element: <S><ProveedoresPage /></S> },
          { path: "configuracion", element: <S><ConfiguracionPage /></S> },
          { path: "soporte", element: <S><SoportePage /></S> },
        ],
      },
      {
        path: "propiedades",
        element: (
          <ModuleRoute module="propiedades">
            <S><PropiedadesLayout /></S>
          </ModuleRoute>
        ),
        children: [
          { index: true, element: <S><PropiedadesPage /></S> },
        ],
      },
      {
        path: "vehiculos",
        element: (
          <ModuleRoute module="vehiculos">
            <S><VehiculosLayout /></S>
          </ModuleRoute>
        ),
        children: [
          { index: true, element: <S><VehiculosPage /></S> },
        ],
      },
      { path: "*", element: <S><NotFound /></S> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
