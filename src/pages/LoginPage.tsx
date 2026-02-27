import { Navigate, useSearchParams } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const activated = searchParams.get("activated") === "true";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/selector" replace />;
  }

  return (
    <>
      <LoginForm onLogin={login} />
      {activated && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert className="border-green-500/50 bg-green-500/10 shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600 font-medium">
              ¡Cuenta activada! Ahora puedes iniciar sesión.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
