import { useState } from "react";
import { Truck, Search, Mail, Phone, MapPin, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockSuppliers } from "@/data/mockData";
import { Supplier } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProveedoresPage() {
  const isMobile = useIsMobile();
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    rfc: "",
    categorias: "",
    activo: true
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "todos" || 
      (statusFilter === "activos" && supplier.activo) ||
      (statusFilter === "inactivos" && !supplier.activo);

    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        nombre: supplier.nombre,
        contacto: supplier.contacto,
        telefono: supplier.telefono,
        email: supplier.email,
        direccion: supplier.direccion || "",
        rfc: supplier.rfc || "",
        categorias: supplier.categorias.join(", "),
        activo: supplier.activo
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        nombre: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
        rfc: "",
        categorias: "",
        activo: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveSupplier = () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre del proveedor es requerido");
      return;
    }
    if (!formData.contacto.trim()) {
      toast.error("El nombre de contacto es requerido");
      return;
    }
    if (!formData.telefono.trim()) {
      toast.error("El teléfono es requerido");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return;
    }

    const categoriasArray = formData.categorias
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (editingSupplier) {
      setSuppliers(suppliers.map(s =>
        s.id === editingSupplier.id
          ? {
              ...editingSupplier,
              nombre: formData.nombre,
              contacto: formData.contacto,
              telefono: formData.telefono,
              email: formData.email,
              direccion: formData.direccion,
              rfc: formData.rfc,
              categorias: categoriasArray,
              activo: formData.activo
            }
          : s
      ));
      toast.success("Proveedor actualizado correctamente");
    } else {
      const newSupplier: Supplier = {
        id: `s${suppliers.length + 1}`,
        nombre: formData.nombre,
        contacto: formData.contacto,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        rfc: formData.rfc,
        categorias: categoriasArray,
        activo: formData.activo
      };
      setSuppliers([...suppliers, newSupplier]);
      toast.success("Proveedor creado correctamente");
    }

    setIsDialogOpen(false);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter(s => s.id !== supplierId));
    toast.success("Proveedor eliminado correctamente");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Proveedores</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Directorio de proveedores y contactos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="touch-target w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {isMobile ? "Agregar" : "Agregar Proveedor"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}</DialogTitle>
              <DialogDescription>
                {editingSupplier ? "Actualiza los datos del proveedor" : "Completa la información del nuevo proveedor"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Proveedor *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Autopartes del Bajío S.A. de C.V."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contacto">Nombre de Contacto *</Label>
                  <Input
                    id="contacto"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    placeholder="Ej: Ing. Roberto González"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="555-1234-567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ventas@proveedor.com.mx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Av. Industria 456, León, Guanajuato"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                  placeholder="ABC890123-XYZ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorias">Categorías (separadas por coma)</Label>
                <Textarea
                  id="categorias"
                  value={formData.categorias}
                  onChange={(e) => setFormData({ ...formData, categorias: e.target.value })}
                  placeholder="Frenos, Suspensión, Motor"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Proveedor Activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSupplier}>
                {editingSupplier ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 touch-target"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 touch-target">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-sm self-center sm:self-auto">
          {filteredSuppliers.length} {filteredSuppliers.length === 1 ? "proveedor" : "proveedores"}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <ResponsiveTable
            data={filteredSuppliers}
            columns={[
              { key: 'nombre', header: 'Proveedor' },
              { key: 'contacto', header: 'Contacto' },
              { key: 'telefono', header: 'Teléfono' },
              { key: 'email', header: 'Email' },
              { key: 'categorias', header: 'Categorías' },
              { key: 'rfc', header: 'RFC' },
              { key: 'activo', header: 'Estado' },
            ]}
            mobileCardRender={(supplier) => (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 min-w-[3rem] bg-primary/10 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{supplier.nombre}</h3>
                    <p className="text-sm text-muted-foreground truncate">{supplier.contacto}</p>
                    <Badge variant={supplier.activo ? "default" : "secondary"} className="mt-1">
                      {supplier.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${supplier.telefono}`} className="text-primary hover:underline truncate">
                      {supplier.telefono}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${supplier.email}`} className="text-primary hover:underline truncate">
                      {supplier.email}
                    </a>
                  </div>

                  {supplier.direccion && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground line-clamp-2">{supplier.direccion}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="font-mono text-muted-foreground">{supplier.rfc}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {supplier.categorias.map((cat, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(supplier)}
                    className="flex-1 touch-target"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="touch-target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No se encontraron proveedores</p>
            <p className="text-sm text-muted-foreground mt-1">
              Intenta con otro término de búsqueda o ajusta los filtros
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
