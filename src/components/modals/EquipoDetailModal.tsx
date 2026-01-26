import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEquipoDetail } from "@/hooks/useEquipos";
import { useAddMiembro, useRemoveMiembro } from "@/hooks/useEquipoMutations";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Building,
  User,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EquipoDetailModalProps {
  equipoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipoDetailModal({
  equipoId,
  open,
  onOpenChange,
}: EquipoDetailModalProps) {
  const { currentUser } = useAuth();
  const { data, isLoading, isError } = useEquipoDetail(equipoId, open);
  const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios();
  const addMiembroMutation = useAddMiembro();
  const removeMiembroMutation = useRemoveMiembro();

  const [showAddMiembro, setShowAddMiembro] = useState(false);
  const [newMiembro, setNewMiembro] = useState({ usuario_id: "", rol_equipo: "" });
  const [miembroToRemove, setMiembroToRemove] = useState<{
    usuario_id: string;
    nombre: string;
  } | null>(null);

  // Declarar equipo PRIMERO
  const equipo = data?.equipo;
  const canManageMembers =
    currentUser?.role === "admin" || currentUser?.role === "gerente";

  // Ahora sí podemos usarlo para filtrar
  const usuariosDisponibles = usuarios.filter(
    (u) => !equipo?.miembros?.some((m) => m.usuario_id === u.usuario_id)
  );

  const handleAddMiembro = async () => {
    if (!equipoId || !newMiembro.usuario_id.trim()) return;

    try {
      await addMiembroMutation.mutateAsync({
        equipoId,
        data: {
          usuario_id: newMiembro.usuario_id.trim(),
          rol_equipo: newMiembro.rol_equipo.trim() || undefined,
        },
      });
      setNewMiembro({ usuario_id: "", rol_equipo: "" });
      setShowAddMiembro(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleRemoveMiembro = async () => {
    if (!equipoId || !miembroToRemove) return;

    try {
      await removeMiembroMutation.mutateAsync({
        equipoId,
        usuarioId: miembroToRemove.usuario_id,
      });
      setMiembroToRemove(null);
    } catch {
      // Error handled by mutation
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                equipo?.nombre || "Detalle del Equipo"
              )}
            </DialogTitle>
            <DialogDescription>
              Información del equipo y gestión de miembros
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-muted-foreground">
              Error al cargar el equipo
            </div>
          ) : equipo ? (
            <div className="space-y-6 py-4">
              {/* Info General */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Building className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sucursal</p>
                    <p className="font-medium">
                      {equipo.sucursal_nombre || "Sin asignar"}
                    </p>
                    {equipo.sucursal_codigo && (
                      <p className="text-xs text-muted-foreground">
                        Código: {equipo.sucursal_codigo}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Líder</p>
                    <p className="font-medium">
                      {equipo.lider_nombre || "Sin líder"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Creado</p>
                    <p className="font-medium">{formatDate(equipo.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={equipo.activo ? "default" : "secondary"}>
                    {equipo.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              {equipo.descripcion && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Descripción
                  </p>
                  <p className="text-sm">{equipo.descripcion}</p>
                </div>
              )}

              <Separator />

              {/* Miembros */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Miembros ({equipo.miembros?.length || 0})
                  </h3>
                  {canManageMembers && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddMiembro(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  )}
                </div>

                {showAddMiembro && (
                  <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="new_usuario_id">Usuario *</Label>
                        <Select
                          value={newMiembro.usuario_id}
                          onValueChange={(value) =>
                            setNewMiembro({ ...newMiembro, usuario_id: value })
                          }
                          disabled={addMiembroMutation.isPending || loadingUsuarios}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar usuario" />
                          </SelectTrigger>
                          <SelectContent>
                            {usuariosDisponibles.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                No hay usuarios disponibles
                              </div>
                            ) : (
                              usuariosDisponibles.map((u) => (
                                <SelectItem key={u.usuario_id} value={u.usuario_id}>
                                  {u.nombre} ({u.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new_rol_equipo">Rol (opcional)</Label>
                        <Select
                          value={newMiembro.rol_equipo || "none"}
                          onValueChange={(value) =>
                            setNewMiembro({
                              ...newMiembro,
                              rol_equipo: value === "none" ? "" : value,
                            })
                          }
                          disabled={addMiembroMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin rol específico</SelectItem>
                            <SelectItem value="Vendedor">Vendedor</SelectItem>
                            <SelectItem value="Técnico">Técnico</SelectItem>
                            <SelectItem value="Administrativo">Administrativo</SelectItem>
                            <SelectItem value="Soporte">Soporte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAddMiembro(false);
                          setNewMiembro({ usuario_id: "", rol_equipo: "" });
                        }}
                        disabled={addMiembroMutation.isPending}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddMiembro}
                        disabled={
                          addMiembroMutation.isPending ||
                          !newMiembro.usuario_id.trim()
                        }
                      >
                        {addMiembroMutation.isPending && (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        )}
                        Agregar
                      </Button>
                    </div>
                  </div>
                )}

                {equipo.miembros && equipo.miembros.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Ingreso</TableHead>
                          {canManageMembers && (
                            <TableHead className="w-12"></TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipo.miembros.map((miembro) => (
                          <TableRow key={miembro.usuario_id}>
                            <TableCell className="font-medium">
                              {miembro.nombre}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {miembro.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {miembro.rol_equipo || "Miembro"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(miembro.fecha_ingreso)}
                            </TableCell>
                            {canManageMembers && (
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setMiembroToRemove({
                                      usuario_id: miembro.usuario_id,
                                      nombre: miembro.nombre,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Este equipo no tiene miembros</p>
                    {canManageMembers && (
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => setShowAddMiembro(true)}
                      >
                        Agregar el primer miembro
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Member Dialog */}
      <AlertDialog
        open={!!miembroToRemove}
        onOpenChange={(open) => !open && setMiembroToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar miembro del equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por quitar a <strong>{miembroToRemove?.nombre}</strong> del
              equipo. Esta acción se puede revertir agregándolo nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMiembroMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMiembro}
              disabled={removeMiembroMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMiembroMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
