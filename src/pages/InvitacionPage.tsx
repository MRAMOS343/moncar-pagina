import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, CheckCircle2, XCircle } from "lucide-react";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { validateInvitation, setPassword } from "@/services/invitacionService";
import { BuildInfo } from "@/components/BuildInfo";

type State = "loading" | "valid" | "invalid" | "success";

const errorMessages: Record<string, string> = {
  TOKEN_INVALID: "Este link no es válido.",
  TOKEN_EXPIRED: "Este link expiró. Solicita uno nuevo a IT.",
  TOKEN_ALREADY_USED: "Este link ya fue usado. Intenta iniciar sesión.",
};

export default function InvitacionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<State>("loading");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    validateInvitation(token)
      .then((data) => {
        if (data.ok) {
          setNombre(data.nombre);
          setCorreo(data.correo);
          setState("valid");
        } else {
          setState("invalid");
        }
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleSetPassword(password: string) {
    setError(null);
    try {
      const data = await setPassword(token, password);
      if (data.ok) {
        setState("success");
        setTimeout(() => navigate("/login?activated=true"), 2500);
      } else {
        setError(
          errorMessages[data.error ?? ""] ?? "Error desconocido. Intenta de nuevo."
        );
      }
    } catch {
      setError("No se pudo conectar al servidor. Intenta de nuevo.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in border-0 shadow-none bg-transparent">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-red-600">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Moncar</CardTitle>
            <CardDescription>Activación de cuenta</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {state === "loading" && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          )}

          {state === "invalid" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Link inválido o expirado</AlertTitle>
              <AlertDescription>
                Este link ya fue usado o expiró. Pide a IT que te reenvíe la
                invitación.
              </AlertDescription>
            </Alert>
          )}

          {state === "success" && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">¡Cuenta activada!</AlertTitle>
              <AlertDescription>
                Redirigiendo al inicio de sesión...
              </AlertDescription>
            </Alert>
          )}

          {state === "valid" && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-lg font-medium">
                  Bienvenido, {nombre}
                </p>
                <p className="text-sm text-muted-foreground">
                  Estás activando tu cuenta para{" "}
                  <strong className="text-foreground">{correo}</strong>
                </p>
              </div>
              <SetPasswordForm onSubmit={handleSetPassword} error={error} />
            </div>
          )}
        </CardContent>

        <div className="flex justify-center pb-4">
          <BuildInfo />
        </div>
      </Card>
    </div>
  );
}
