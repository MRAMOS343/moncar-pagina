import { useState } from "react";
import { ShoppingCart, DollarSign, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, SupplierFormData } from "@/schemas/supplierSchema";
import { sanitizeHtml, sanitizePhone } from "@/utils/sanitize";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProveedores, useCreateProveedor, usePatchProveedor, useDeleteProveedor } from "@/hooks/useProveedores";
import type { Proveedor } from "@/types/proveedores";
import { EmptyState } from "@/components/ui/empty-state";
import { KPISkeleton } from "@/components/ui/kpi-skeleton";
import { PageLayout } from "@/components/layout/PageLayout";

export default function ProveedoresPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "gerente";

  const [search, setSearch]               = useState("");
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  const { data, isLoading } = useProveedores({ q: search || undefined });
  const createProveedor = useCreateProveedor();
  const patchProveedor  = usePatchProveedor();
  const deleteProveedor = useDeleteProveedor();

  const proveedores: Proveedor[] = data?.items ?? [];

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { nombre: "", contacto: "", telefono: "", email: "", direccion: "", rfc: "", categorias: "", activo: true },
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({ nombre: "", contacto: "", telefono: "", email: "", direccion: "", rfc: "", categorias: "", activo: true });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (p: Proveedor) => {
    setEditingId(p.proveedor_id);
    form.reset({
      nombre:     p.nombre,
      contacto:   p.contacto,
      telefono:   p.telefono,
      email:      p.email,
      direccion:  p.direccion ?? "",
      rfc:        p.rfc ?? "",
      categorias: p.categorias.join(", "),
      activo:     p.activo,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (raw: SupplierFormData) => {
    const data = {
      nombre:     sanitizeHtml(raw.nombre),
      contacto:   sanitizeHtml(raw.contacto),
      telefono:   sanitizePhone(raw.telefono),
      email:      raw.email,
      direccion:  raw.direccion ? sanitizeHtml(raw.direccion) : "",
      rfc:        raw.rfc ?? "",
      categorias: sanitizeHtml(raw.categorias).split(",").map(c => c.trim()).filter(Boolean),
    };

    if (editingId) {
      patchProveedor.mutate(
        { id: editingId, data },
        {
          onSuccess: () => { toast.success("Proveedor actualizado"); setIsDialogOpen(false); },
          onError:   () => toast.error("Error al actualizar el proveedor"),
        }
      );
    } else {
      createProveedor.mutate(data, {
        onSuccess: () => { toast.success("Proveedor creado"); setIsDialogOpen(false); },
        onError:   () => toast.error("Error al crear el proveedor"),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteProveedor.mutate(id, {
      onSuccess: () => { toast.success("Proveedor desactivado"); setDeletingId(null); },
      onError:   () => toast.error("Error al desactivar el proveedor"),
    });
  };

  const isMutating = createProveedor.isPending || patchProveedor.isPending;

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">Directorio de proveedores y seguimiento de operaciones</p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      <Tabs defaultValue="directorio">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="directorio"><ShoppingCart className="h-4 w-4 mr-2" />Directorio</TabsTrigger>
          <TabsTrigger value="pagos"><DollarSign className="h-4 w-4 mr-2" />Pagos</TabsTrigger>
        </TabsList>

        {/* ── Directorio ── */}
        <TabsContent value="directorio" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proveedor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            {isLoading ? (
              <CardContent className="pt-6 grid grid-cols-1 gap-4">
                <KPISkeleton /><KPISkeleton /><KPISkeleton />
              </CardContent>
            ) : proveedores.length === 0 ? (
              <CardContent className="py-12">
                <EmptyState
                  icon={ShoppingCart}
                  title={search ? "Sin resultados" : "Sin proveedores registrados"}
                  description={search ? "No se encontraron proveedores con esa búsqueda." : "Agrega tus proveedores para registrar compras y rastrear pagos pendientes."}
                  action={isAdmin && !search ? { label: "Agregar proveedor", onClick: handleOpenCreate } : undefined}
                />
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Categorías</TableHead>
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proveedores.map(p => (
                    <TableRow key={p.proveedor_id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>{p.contacto || "—"}</TableCell>
                      <TableCell>{p.telefono || "—"}</TableCell>
                      <TableCell>{p.email || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.rfc || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.categorias.length > 0
                            ? p.categorias.map(c => <Badge key={c} variant="secondary">{c}</Badge>)
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.activo ? "default" : "outline"}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(p.proveedor_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* ── Pagos (placeholder) ── */}
        <TabsContent value="pagos">
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground">
              Módulo de pagos a proveedores — próximamente
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog crear / editar ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos del proveedor." : "Completa los datos del nuevo proveedor."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Nombre *</Label>
                <Input {...form.register("nombre")} placeholder="Bosch MX" />
                {form.formState.errors.nombre && (
                  <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Contacto *</Label>
                <Input {...form.register("contacto")} placeholder="Juan Pérez" />
                {form.formState.errors.contacto && (
                  <p className="text-xs text-destructive">{form.formState.errors.contacto.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Teléfono *</Label>
                <Input {...form.register("telefono")} placeholder="5512345678" />
                {form.formState.errors.telefono && (
                  <p className="text-xs text-destructive">{form.formState.errors.telefono.message}</p>
                )}
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Email *</Label>
                <Input {...form.register("email")} type="email" placeholder="contacto@proveedor.com" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>RFC</Label>
                <Input {...form.register("rfc")} placeholder="ABC123456XYZ" className="uppercase" />
                {form.formState.errors.rfc && (
                  <p className="text-xs text-destructive">{form.formState.errors.rfc.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Categorías</Label>
                <Input {...form.register("categorias")} placeholder="frenos, filtros, eléctrico" />
                <p className="text-xs text-muted-foreground">Separadas por coma</p>
              </div>

              <div className="col-span-2 space-y-1">
                <Label>Dirección</Label>
                <Textarea {...form.register("direccion")} placeholder="Av. Ejemplo 123, Col. Centro" rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isMutating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Guardar cambios" : "Crear Proveedor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog confirmar desactivar ── */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Desactivar proveedor?</DialogTitle>
            <DialogDescription>
              El proveedor se marcará como inactivo y no aparecerá en el directorio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteProveedor.isPending}
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {deleteProveedor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
