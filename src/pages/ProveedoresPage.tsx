import { useState } from "react";
import { Package, ShoppingCart, TrendingDown, RotateCcw, DollarSign, Upload, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, SupplierFormData } from '@/schemas/supplierSchema';
import { sanitizeHtml, sanitizePhone } from '@/utils/sanitize';
import { toast } from "sonner";
import { useData } from '@/contexts/DataContext';
import { Supplier } from "@/types";
import { formatCurrency } from "@/utils/formatters";

interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  banco: string;
  cuenta: string;
  saldo: number;
  pagosProgramados: number;
  estadoSemana: 'pendiente' | 'pagado';
  comprobantes: string[];
}

export default function ProveedoresPage() {
  const { suppliers: initialSuppliers } = useData();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [supplierPayments] = useState<SupplierPayment[]>([
    {
      id: "1",
      supplierId: "1",
      supplierName: "Bosch MX",
      banco: "BBVA",
      cuenta: "CLABE 012 345 678901234",
      saldo: 18760,
      pagosProgramados: 12000,
      estadoSemana: 'pendiente',
      comprobantes: []
    },
    {
      id: "2",
      supplierId: "2",
      supplierName: "Brembo MX",
      banco: "Banorte",
      cuenta: "CLABE 072 123 456789012",
      saldo: 24490,
      pagosProgramados: 15000,
      estadoSemana: 'pagado',
      comprobantes: ["comprobante_brembo_2025-10-22.pdf"]
    },
    {
      id: "3",
      supplierId: "3",
      supplierName: "Mann Filter",
      banco: "Santander",
      cuenta: "CLABE 014 987 654321098",
      saldo: 9800,
      pagosProgramados: 8000,
      estadoSemana: 'pendiente',
      comprobantes: []
    }
  ]);

  const inventoryData = [
    { sku: "CM-001", articulo: "Cilindro Maestro", linea: "Frenos", marca: "Bosch", existencia: 18, min: 10, max: 35, costo: 540, precio: 899, rotacion: "A" },
    { sku: "AC-210", articulo: "Aceite 5W30 1L", linea: "Lubricantes", marca: "Mobil", existencia: 72, min: 40, max: 120, costo: 95, precio: 169, rotacion: "A" },
    { sku: "LS-512", articulo: "Limpiaparabrisas 21\"", linea: "Accesorios", marca: "Trico", existencia: 9, min: 15, max: 60, costo: 48, precio: 99, rotacion: "B" },
    { sku: "PB-404", articulo: "Pastillas de freno", linea: "Frenos", marca: "Brembo", existencia: 4, min: 12, max: 40, costo: 780, precio: 1249, rotacion: "A" },
    { sku: "FS-331", articulo: "Filtro de aceite", linea: "Filtros", marca: "Mann", existencia: 3, min: 8, max: 30, costo: 110, precio: 199, rotacion: "B" }
  ];

  const purchaseOrders = [
    { folio: "PO-8791", fecha: "2025-10-22", sucursal: "MonCar Pachuca", proveedor: "RefaExpress", items: 42, montoETA: "$38,210 2 días", estado: "en-transito" },
    { folio: "PO-8790", fecha: "2025-10-22", sucursal: "Monzalvo Centro", proveedor: "Distrib. Hidalgo", items: 15, montoETA: "$12,990 Hoy", estado: "recibiendo" },
    { folio: "PO-8787", fecha: "2025-10-21", sucursal: "MonCar Pachuca", proveedor: "Bosch MX", items: 8, montoETA: "$18,760 3 días", estado: "ordenado" }
  ];

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      nombre: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
      rfc: "",
      categorias: "",
      activo: true
    }
  });

  const totalAdeudado = supplierPayments.reduce((sum, p) => sum + p.saldo, 0);
  const programadoSemana = supplierPayments.reduce((sum, p) => sum + p.pagosProgramados, 0);
  const pagadoSemana = supplierPayments
    .filter(p => p.estadoSemana === 'pagado')
    .reduce((sum, p) => sum + p.pagosProgramados, 0);

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.reset({
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
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: SupplierFormData) => {
    const sanitizedData = {
      ...data,
      nombre: sanitizeHtml(data.nombre),
      contacto: sanitizeHtml(data.contacto),
      telefono: sanitizePhone(data.telefono),
      direccion: data.direccion ? sanitizeHtml(data.direccion) : "",
      categorias: sanitizeHtml(data.categorias)
    };

    const categoriasArray = sanitizedData.categorias.split(",").map(c => c.trim()).filter(c => c.length > 0);

    if (editingSupplier) {
      setSuppliers(suppliers.map(s =>
        s.id === editingSupplier.id
          ? { ...editingSupplier, ...sanitizedData, categorias: categoriasArray }
          : s
      ));
      toast.success("Proveedor actualizado");
    } else {
      const newSupplier: Supplier = {
        id: String(suppliers.length + 1),
        ...sanitizedData,
        categorias: categoriasArray
      };
      setSuppliers([...suppliers, newSupplier]);
      toast.success("Proveedor creado");
    }

    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Operación – Refaccionarias</h1>
          <p className="text-muted-foreground">
            Monitoreo de inventario, pedidos, backorders, devoluciones y pagos a proveedores.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? "Editar" : "Nuevo"} Proveedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input {...form.register("nombre")} />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
                  )}
                </div>
                <div>
                  <Label>Contacto *</Label>
                  <Input {...form.register("contacto")} />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input {...form.register("telefono")} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input {...form.register("email")} type="email" />
                </div>
              </div>
              <div>
                <Label>Dirección</Label>
                <Textarea {...form.register("direccion")} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>RFC</Label>
                  <Input {...form.register("rfc")} />
                </div>
                <div>
                  <Label>Categorías *</Label>
                  <Input {...form.register("categorias")} placeholder="Frenos, Filtros..." />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.watch("activo")} onCheckedChange={(v) => form.setValue("activo", v)} />
                <Label>Activo</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingSupplier ? "Actualizar" : "Crear"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="inventario">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventario"><Package className="h-4 w-4 mr-2" />Inventario</TabsTrigger>
          <TabsTrigger value="ordenes"><ShoppingCart className="h-4 w-4 mr-2" />Órdenes</TabsTrigger>
          <TabsTrigger value="backorder"><TrendingDown className="h-4 w-4 mr-2" />Backorder</TabsTrigger>
          <TabsTrigger value="devoluciones"><RotateCcw className="h-4 w-4 mr-2" />Devoluciones</TabsTrigger>
          <TabsTrigger value="pagos"><DollarSign className="h-4 w-4 mr-2" />Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="inventario" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Inventario por SKU</h2>
            <div className="flex gap-2">
              <Badge variant="outline">Bajo mínimo: 2</Badge>
              <Badge variant="outline">Sobrante: 1</Badge>
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Línea</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Existencia</TableHead>
                  <TableHead>Mín/Máx</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Rotación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map(i => (
                  <TableRow key={i.sku}>
                    <TableCell className="font-medium">{i.sku}</TableCell>
                    <TableCell>{i.articulo}</TableCell>
                    <TableCell>{i.linea}</TableCell>
                    <TableCell>{i.marca}</TableCell>
                    <TableCell>{i.existencia}</TableCell>
                    <TableCell>{i.min}/{i.max}</TableCell>
                    <TableCell>{formatCurrency(i.costo)}</TableCell>
                    <TableCell>{formatCurrency(i.precio)}</TableCell>
                    <TableCell><Badge variant={i.rotacion === 'A' ? 'default' : 'secondary'}>{i.rotacion}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="ordenes" className="space-y-4">
          <h2 className="text-2xl font-bold">Órdenes de compra</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Monto/ETA</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(o => (
                  <TableRow key={o.folio}>
                    <TableCell className="font-medium">{o.folio}</TableCell>
                    <TableCell>{o.fecha}</TableCell>
                    <TableCell>{o.sucursal}</TableCell>
                    <TableCell>{o.proveedor}</TableCell>
                    <TableCell>{o.items}</TableCell>
                    <TableCell>{o.montoETA}</TableCell>
                    <TableCell><Badge>{o.estado}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="backorder"><Card><CardContent className="py-20 text-center text-muted-foreground">Sin backorders</CardContent></Card></TabsContent>
        <TabsContent value="devoluciones"><Card><CardContent className="py-20 text-center text-muted-foreground">Sin devoluciones</CardContent></Card></TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          <h2 className="text-2xl font-bold">Pagos a Proveedores</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Adeudado total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalAdeudado)}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Programado semana</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(programadoSemana)}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Pagado semana</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(pagadoSemana)}</div></CardContent></Card>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Programado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Comprobantes</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.supplierName}</TableCell>
                    <TableCell>{p.banco}</TableCell>
                    <TableCell>{p.cuenta}</TableCell>
                    <TableCell>{formatCurrency(p.saldo)}</TableCell>
                    <TableCell>{formatCurrency(p.pagosProgramados)}</TableCell>
                    <TableCell><Badge variant={p.estadoSemana === 'pagado' ? 'default' : 'outline'}>{p.estadoSemana}</Badge></TableCell>
                    <TableCell>{p.comprobantes.length > 0 ? <><FileText className="h-4 w-4 inline mr-1"/>{p.comprobantes[0]}</> : '—'}</TableCell>
                    <TableCell><div className="flex gap-2"><Button size="sm" variant="outline"><Upload className="h-4 w-4"/></Button><Button size="sm" disabled={p.estadoSemana === 'pagado'}>Marcar pagado</Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
