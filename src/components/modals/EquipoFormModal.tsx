import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateEquipo, useUpdateEquipo } from "@/hooks/useEquipoMutations";
import type { EquipoListItem } from "@/types/equipos";
import { Loader2 } from "lucide-react";

interface EquipoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipo?: EquipoListItem | null;
}

export function EquipoFormModal({
  open,
  onOpenChange,
  equipo,
}: EquipoFormModalProps) {
  const { currentUser } = useAuth();
  const { data: warehouses = [], isLoading: loadingWarehouses } = useWarehouses();
  const createMutation = useCreateEquipo();
  const updateMutation = useUpdateEquipo();

  const isEditing = !!equipo;
  const isAdmin = currentUser?.role === "admin";
  const isGerente = currentUser?.role === "gerente";

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    lider_usuario_id: "",
    sucursal_id: "",
    activo: true,
  });

  const [errors, setErrors] = useState<{ sucursal?: string }>({});

  // Reset form when modal opens/closes or equipo changes
  useEffect(() => {
    if (open) {
      if (equipo) {
        setFormData({
          nombre: equipo.nombre,
          descripcion: equipo.descripcion || "",
          lider_usuario_id: equipo.lider_usuario_id || "",
          sucursal_id: equipo.sucursal_id || "",
          activo: equipo.activo,
        });
      } else {
        // For new equipo, default to user's warehouse if gerente
        setFormData({
          nombre: "",
          descripcion: "",
          lider_usuario_id: "",
          sucursal_id: isGerente && currentUser?.warehouseId ? currentUser.warehouseId : "",
          activo: true,
        });
      }
    }
  }, [open, equipo, isGerente, currentUser?.warehouseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      return;
    }

    if (!formData.sucursal_id) {
      setErrors({ sucursal: "Debes seleccionar una sucursal" });
      return;
    }

    setErrors({});

    const payload = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      lider_usuario_id: formData.lider_usuario_id.trim() || null,
      sucursal_id: formData.sucursal_id,
      ...(isEditing && { activo: formData.activo }),
    };

    try {
      if (isEditing && equipo) {
        await updateMutation.mutateAsync({ id: equipo.equipo_id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Equipo" : "Crear Nuevo Equipo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos del equipo"
              : "Completa la información para crear un nuevo equipo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Equipo *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Ej: Equipo Ventas Norte"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Descripción del equipo y sus responsabilidades"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lider_usuario_id">ID del Líder (opcional)</Label>
            <Input
              id="lider_usuario_id"
              value={formData.lider_usuario_id}
              onChange={(e) =>
                setFormData({ ...formData, lider_usuario_id: e.target.value })
              }
              placeholder="UUID del usuario líder"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el ID del usuario que será líder del equipo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sucursal">Sucursal *</Label>
            <Select
              value={formData.sucursal_id}
              onValueChange={(value) => {
                setFormData({ ...formData, sucursal_id: value });
                if (errors.sucursal) setErrors({ ...errors, sucursal: undefined });
              }}
              disabled={isPending || loadingWarehouses || (!isAdmin && isGerente)}
            >
              <SelectTrigger className={errors.sucursal ? "border-destructive" : ""}>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sucursal && (
              <p className="text-sm text-destructive">{errors.sucursal}</p>
            )}
            {!isAdmin && isGerente && (
              <p className="text-xs text-muted-foreground">
                Solo puedes crear equipos en tu sucursal asignada
              </p>
            )}
          </div>

          {isEditing && (isAdmin || isGerente) && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="activo">Estado del equipo</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.activo ? "Activo" : "Inactivo"}
                </p>
              </div>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, activo: checked })
                }
                disabled={isPending}
              />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formData.nombre.trim() || !formData.sucursal_id}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
