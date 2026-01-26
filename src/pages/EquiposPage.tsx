import { useState, useMemo } from "react";
import { Users, Plus, Edit, Trash2, Search, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/contexts/AuthContext";
import { useEquipos } from "@/hooks/useEquipos";
import { useDeleteEquipo } from "@/hooks/useEquipoMutations";
import { useDebounce } from "@/hooks/useDebounce";
import { EmptyState } from "@/components/ui/empty-state";
import { EquipoFormModal } from "@/components/modals/EquipoFormModal";
import { EquipoDetailModal } from "@/components/modals/EquipoDetailModal";
import type { EquipoListItem } from "@/types/equipos";
import { Skeleton } from "@/components/ui/skeleton";

export default function EquiposPage() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<EquipoListItem | null>(null);
  const [detailEquipoId, setDetailEquipoId] = useState<string | null>(null);
  const [deleteEquipo, setDeleteEquipo] = useState<EquipoListItem | null>(null);

  // Queries & mutations
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useEquipos({ q: debouncedSearch, limit: 20 });

  const deleteMutation = useDeleteEquipo();

  // Flatten pages into single array
  const equipos = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  // Permissions
  const isAdmin = currentUser?.role === "admin";
  const isGerente = currentUser?.role === "gerente";
  const canCreate = isAdmin || isGerente;
  const canEdit = isAdmin || isGerente;
  const canDelete = isAdmin;

  // Handlers
  const handleOpenCreate = () => {
    setEditingEquipo(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (equipo: EquipoListItem) => {
    setEditingEquipo(equipo);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (equipoId: string) => {
    setDetailEquipoId(equipoId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteEquipo) return;
    try {
      await deleteMutation.mutateAsync(deleteEquipo.equipo_id);
      setDeleteEquipo(null);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <main role="main" aria-label="Contenido principal">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Equipos de Trabajo</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los equipos y grupos de trabajo
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleOpenCreate} className="btn-hover">
              <Plus className="w-4 h-4 mr-2" />
              Crear Equipo
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="text-sm">
            {equipos.length} {equipos.length === 1 ? "equipo" : "equipos"}
          </Badge>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : isError ? (
            <div className="col-span-full py-12 text-center text-destructive">
              Error al cargar los equipos. Intenta nuevamente.
            </div>
          ) : (
            equipos.map((equipo) => (
              <Card
                key={equipo.equipo_id}
                className="card-hover hover:shadow-lg transition-shadow animate-fade-in"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{equipo.nombre}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {equipo.sucursal_nombre || "Sin sucursal"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={equipo.activo ? "default" : "secondary"}>
                      {equipo.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {equipo.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {equipo.descripcion}
                    </p>
                  )}

                  {equipo.lider_nombre && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Líder
                      </p>
                      <Badge variant="secondary">{equipo.lider_nombre}</Badge>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Miembros
                    </p>
                    <Badge variant="outline">{equipo.total_miembros} miembro(s)</Badge>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 btn-hover touch-target"
                      onClick={() => handleOpenDetail(equipo.equipo_id)}
                      aria-label={`Ver detalle de ${equipo.nombre}`}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-hover touch-target"
                        onClick={() => handleOpenEdit(equipo)}
                        aria-label={`Editar equipo ${equipo.nombre}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-hover touch-target text-destructive hover:text-destructive"
                        onClick={() => setDeleteEquipo(equipo)}
                        aria-label={`Eliminar equipo ${equipo.nombre}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cargar más
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && equipos.length === 0 && (
          <EmptyState
            icon={Users}
            title="No se encontraron equipos"
            description={
              searchTerm
                ? "Intenta con otro término de búsqueda"
                : "Crea tu primer equipo para comenzar"
            }
            action={
              canCreate
                ? {
                    label: "Crear equipo",
                    onClick: handleOpenCreate,
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Form Modal (Create/Edit) */}
      <EquipoFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        equipo={editingEquipo}
      />

      {/* Detail Modal */}
      <EquipoDetailModal
        equipoId={detailEquipoId}
        open={!!detailEquipoId}
        onOpenChange={(open) => !open && setDetailEquipoId(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteEquipo}
        onOpenChange={(open) => !open && setDeleteEquipo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar el equipo <strong>{deleteEquipo?.nombre}</strong>.
              Esta acción desactivará el equipo (soft delete).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
