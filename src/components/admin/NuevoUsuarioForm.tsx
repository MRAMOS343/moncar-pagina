import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useSucursales } from "@/hooks/useSucursales";
import { createUsuario } from "@/services/invitacionService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UserPlus, CheckCircle2, Mail } from "lucide-react";
import { showErrorToast } from "@/utils/toastHelpers";

const nuevoUsuarioSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre es requerido").max(100),
  correo: z.string().trim().email("Email inválido").max(255),
  rol: z.string().min(1, "Selecciona un rol"),
  sucursal_id: z.string().optional(),
});

type NuevoUsuarioData = z.infer<typeof nuevoUsuarioSchema>;

const roles = [
  { value: "cajero", label: "Cajero" },
  { value: "gerente", label: "Gerente" },
  { value: "admin", label: "Administrador" },
  { value: "gestor_propiedades", label: "Gestor de Propiedades" },
] as const;

export function NuevoUsuarioForm() {
  const { token } = useAuth();
  const { data: sucursales, isLoading: loadingSucursales } = useSucursales();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<NuevoUsuarioData>({
    resolver: zodResolver(nuevoUsuarioSchema),
    defaultValues: { nombre: "", correo: "", rol: "cajero", sucursal_id: "" },
  });

  async function onSubmit(data: NuevoUsuarioData) {
    if (!token) return;
    setStatus("loading");
    try {
      const payload = {
        nombre: data.nombre,
        correo: data.correo,
        rol: data.rol,
        ...(data.sucursal_id ? { sucursal_id: data.sucursal_id } : {}),
      };
      const res = await createUsuario(payload, token);
      if (res.ok) {
        setSentEmail(data.correo);
        setStatus("success");
        form.reset();
      } else {
        showErrorToast("Error", res.error ?? "No se pudo crear el usuario.");
        setStatus("idle");
      }
    } catch {
      showErrorToast("Error", "No se pudo conectar al servidor.");
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Invitación enviada</AlertTitle>
            <AlertDescription>
              Se envió un correo a <strong>{sentEmail}</strong> con las instrucciones
              para activar su cuenta.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              setStatus("idle");
              setSentEmail("");
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invitar otro usuario
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invitar nuevo usuario
        </CardTitle>
        <CardDescription>
          Se enviará un correo con un link para que el usuario active su cuenta y
          establezca su contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-nombre">Nombre completo</Label>
              <Input
                id="inv-nombre"
                {...form.register("nombre")}
                placeholder="Juan Pérez"
                disabled={status === "loading"}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-correo">Correo electrónico</Label>
              <Input
                id="inv-correo"
                type="email"
                {...form.register("correo")}
                placeholder="correo@ejemplo.com"
                disabled={status === "loading"}
              />
              {form.formState.errors.correo && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.correo.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={form.watch("rol")}
                onValueChange={(v) => form.setValue("rol", v)}
                disabled={status === "loading"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select
                value={form.watch("sucursal_id") ?? ""}
                onValueChange={(v) => form.setValue("sucursal_id", v)}
                disabled={status === "loading" || loadingSucursales}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSucursales ? "Cargando..." : "Opcional"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {sucursales?.map((s) => (
                    <SelectItem key={s.codigo} value={s.codigo}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Enviar invitación
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
