import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types";

const productSchema = z.object({
  sku: z.string()
    .min(1, "SKU es requerido")
    .max(50, "SKU debe tener máximo 50 caracteres")
    .regex(/^[A-Z0-9-]+$/i, "SKU solo puede contener letras, números y guiones")
    .trim(),
  nombre: z.string()
    .min(1, "Nombre es requerido")
    .max(200, "Nombre debe tener máximo 200 caracteres")
    .trim(),
  marca: z.string()
    .min(1, "Marca es requerida")
    .max(100, "Marca debe tener máximo 100 caracteres")
    .trim(),
  categoria: z.string().min(1, "Categoría es requerida"),
  unidad: z.string().min(1, "Unidad es requerida"),
  precio: z.number()
    .min(0.01, "El precio debe ser mayor a 0")
    .max(999999.99, "El precio excede el límite permitido"),
  iva: z.number()
    .min(0, "IVA no puede ser negativo")
    .max(100, "IVA no puede ser mayor a 100%"),
  reorderPoint: z.number()
    .int("Punto de reorden debe ser un número entero")
    .min(0, "Punto de reorden no puede ser negativo")
    .max(9999, "Punto de reorden excede el límite"),
  safetyStock: z.number()
    .int("Stock de seguridad debe ser un número entero")
    .min(0, "Stock de seguridad no puede ser negativo")
    .max(9999, "Stock de seguridad excede el límite"),
  descripcion: z.string()
    .max(500, "Descripción debe tener máximo 500 caracteres")
    .optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: ProductFormData) => void;
}

const categorias = [
  "Motor", "Suspensión", "Frenos", "Transmisión", "Eléctrico", 
  "Carrocería", "Filtros", "Lubricantes", "Llantas", "Accesorios"
];

const unidades = [
  "pza", "kit", "par", "litro", "galón", "metro", "caja", "juego"
];

export function ProductModal({ open, onOpenChange, product, onSave }: ProductModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      nombre: "",
      marca: "",
      categoria: "",
      unidad: "pza",
      precio: 0,
      iva: 16,
      reorderPoint: 10,
      safetyStock: 5,
      descripcion: "",
    },
  });

  // Reset form when product changes or modal opens
  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          sku: product.sku,
          nombre: product.nombre,
          marca: product.marca,
          categoria: product.categoria,
          unidad: product.unidad,
          precio: product.precio,
          iva: product.iva,
          reorderPoint: product.reorderPoint,
          safetyStock: product.safetyStock,
          descripcion: product.descripcion || "",
        });
      } else {
        form.reset({
          sku: "",
          nombre: "",
          marca: "",
          categoria: "",
          unidad: "pza",
          precio: 0,
          iva: 16,
          reorderPoint: 10,
          safetyStock: 5,
          descripcion: "",
        });
      }
    }
  }, [open, product, form]);

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: `${data.nombre} ha sido ${product ? "actualizado" : "creado"} exitosamente.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar el producto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? "Modifica la información del producto existente." 
              : "Agrega un nuevo producto al catálogo."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: MOT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidades.map((unidad) => (
                          <SelectItem key={unidad} value={unidad}>
                            {unidad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Filtro de aceite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Bosch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IVA (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="16"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reorderPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punto de Reorden</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="safetyStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock de Seguridad</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="5"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción detallada del producto..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : (product ? "Actualizar" : "Crear")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}