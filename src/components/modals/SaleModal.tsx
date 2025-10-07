import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockProducts } from "@/data/mockData";
import { Product, SaleItem } from "@/types";
import { Trash2, Plus, Search } from "lucide-react";

// Esquema de validación para cada producto en la venta
const esquemaProductoVenta = z.object({
  productId: z.string().min(1, "Producto es requerido"),
  qty: z.number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad debe ser mayor a 0")
    .max(9999, "La cantidad no puede exceder 9999 unidades"),
  unitPrice: z.number()
    .min(0.01, "El precio debe ser mayor a 0")
    .max(999999.99, "El precio excede el límite permitido"),
  discount: z.number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento no puede ser mayor a 100%")
    .optional(),
});

// Esquema principal de validación para la venta completa
const esquemaVenta = z.object({
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia', 'credito'], {
    required_error: "Método de pago es requerido",
  }),
  cliente: z.string().max(100, "Nombre del cliente debe tener máximo 100 caracteres").optional(),
  items: z.array(esquemaProductoVenta).min(1, "Debe agregar al menos un producto"),
});

type DatosFormularioVenta = z.infer<typeof esquemaVenta>;

interface SaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  onSave: (sale: DatosFormularioVenta) => void;
}

export function SaleModal({ open, onOpenChange, warehouseId, onSave }: SaleModalProps) {
  const { toast } = useToast();
  const [enviandoFormulario, setEnviandoFormulario] = useState(false);
  const [productos, setProductos] = useState<SaleItem[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const busquedaDebounced = useDebounce(busquedaProducto, 300);

  // Configuración del formulario con validación
  const formulario = useForm<DatosFormularioVenta>({
    resolver: zodResolver(esquemaVenta),
    defaultValues: {
      metodoPago: 'efectivo',
      cliente: "",
      items: [],
    },
  });

  // Filtrar productos basado en la búsqueda con debounce
  const productosFiltrados = useMemo(() => {
    if (!busquedaDebounced.trim()) {
      return mockProducts;
    }
    const busquedaLower = busquedaDebounced.toLowerCase();
    return mockProducts.filter(producto =>
      producto.nombre.toLowerCase().includes(busquedaLower) ||
      producto.sku.toLowerCase().includes(busquedaLower) ||
      producto.marca.toLowerCase().includes(busquedaLower)
    );
  }, [busquedaDebounced]);

  // Calcular totales de la venta
  const totales = useMemo(() => {
    const subtotal = productos.reduce((suma, producto) => {
      const descuento = producto.discount || 0;
      const totalProducto = producto.qty * producto.unitPrice;
      return suma + (totalProducto - (totalProducto * descuento / 100));
    }, 0);
    
    const iva = subtotal * 0.16; // 16% IVA
    const total = subtotal + iva;

    return { subtotal, iva, total };
  }, [productos]);

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      formulario.reset({
        metodoPago: 'efectivo',
        cliente: "",
        items: [],
      });
      setProductos([]);
      setProductoSeleccionadoId("");
      setCantidad(1);
      setBusquedaProducto("");
    }
  }, [open, formulario]);

  const agregarProducto = () => {
    if (!productoSeleccionadoId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un producto.",
        variant: "destructive",
      });
      return;
    }

    if (cantidad <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    if (cantidad > 9999) {
      toast({
        title: "Error",
        description: "La cantidad no puede exceder 9999 unidades.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isInteger(cantidad)) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número entero.",
        variant: "destructive",
      });
      return;
    }

    const producto = mockProducts.find(p => p.id === productoSeleccionadoId);
    if (!producto) return;

    // Verificar si el producto ya existe en la lista
    const indiceProductoExistente = productos.findIndex(item => item.productId === productoSeleccionadoId);
    
    if (indiceProductoExistente >= 0) {
      // Actualizar producto existente
      const productosActualizados = [...productos];
      productosActualizados[indiceProductoExistente].qty += cantidad;
      setProductos(productosActualizados);
    } else {
      // Agregar nuevo producto
      const nuevoProducto: SaleItem = {
        productId: productoSeleccionadoId,
        qty: cantidad,
        unitPrice: producto.precio,
        discount: 0,
      };
      setProductos([...productos, nuevoProducto]);
    }

    setProductoSeleccionadoId("");
    setCantidad(1);
    setBusquedaProducto("");
  };

  const eliminarProducto = (indice: number) => {
    setProductos(productos.filter((_, i) => i !== indice));
  };

  const actualizarCantidadProducto = (indice: number, qty: number) => {
    if (qty <= 0 || qty > 9999 || !Number.isInteger(qty)) return;
    const productosActualizados = [...productos];
    productosActualizados[indice].qty = qty;
    setProductos(productosActualizados);
  };

  const actualizarDescuentoProducto = (indice: number, descuento: number) => {
    if (descuento < 0 || descuento > 100) return;
    const productosActualizados = [...productos];
    productosActualizados[indice].discount = descuento;
    setProductos(productosActualizados);
  };

  const enviarFormulario = async (datos: DatosFormularioVenta) => {
    if (productos.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto a la venta.",
        variant: "destructive",
      });
      return;
    }

    setEnviandoFormulario(true);
    try {
      const datosVenta = {
        ...datos,
        items: productos,
      };
      await onSave(datosVenta);
      toast({
        title: "Venta registrada",
        description: `Venta por ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totales.total)} registrada exitosamente.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error al registrar venta:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al registrar la venta.",
        variant: "destructive",
      });
    } finally {
      setEnviandoFormulario(false);
    }
  };

  const getProductName = (productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    return product ? `${product.nombre} - ${product.marca}` : "Producto no encontrado";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
          <DialogDescription>
            Registra una nueva venta agregando productos y especificando el método de pago.
          </DialogDescription>
        </DialogHeader>

        <Form {...formulario}>
          <form onSubmit={formulario.handleSubmit(enviarFormulario)} className="space-y-6">
            {/* Detalles de la venta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formulario.control}
                name="metodoPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formulario.control}
                name="cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Add Product Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Agregar Productos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Buscar Producto</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, SKU o marca..."
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {busquedaProducto && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {productosFiltrados.slice(0, 5).map((producto) => (
                        <button
                          key={producto.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            setProductoSeleccionadoId(producto.id);
                            setBusquedaProducto(`${producto.nombre} - ${producto.marca}`);
                          }}
                        >
                          <div>
                            <span className="font-medium">{producto.nombre}</span>
                            <span className="text-muted-foreground"> - {producto.marca}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {producto.sku} | ${producto.precio}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>

                <Button type="button" onClick={agregarProducto} disabled={!productoSeleccionadoId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Tabla de productos */}
            {productos.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="w-24">Cantidad</TableHead>
                      <TableHead className="w-28">Precio Unit.</TableHead>
                      <TableHead className="w-24">Desc. %</TableHead>
                      <TableHead className="w-28">Subtotal</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productos.map((producto, indice) => {
                      const subtotal = producto.qty * producto.unitPrice;
                      const descuento = producto.discount || 0;
                      const total = subtotal - (subtotal * descuento / 100);
                      
                      return (
                        <TableRow key={indice}>
                          <TableCell>
                            <div className="text-sm">
                              {getProductName(producto.productId)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={producto.qty}
                              onChange={(e) => actualizarCantidadProducto(indice, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              ${producto.unitPrice.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={producto.discount || 0}
                              onChange={(e) => actualizarDescuentoProducto(indice, parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              ${total.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarProducto(indice)}
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Totales de la venta */}
            {productos.length > 0 && (
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${totales.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA (16%):</span>
                    <span>${totales.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${totales.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={enviandoFormulario}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={enviandoFormulario || productos.length === 0}>
                {enviandoFormulario ? "Registrando..." : "Registrar Venta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}