import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdateProduct } from '@/hooks/useProductMutations';
import type { ApiProduct, ProductUpdateRequest } from '@/types/products';
import { Loader2 } from 'lucide-react';

// Helper para campos numéricos: convierte '' a undefined, strings a números
const optionalNumber = (min = 0, max?: number, message?: string) =>
  z.union([
    z.literal('').transform(() => undefined),
    z.coerce.number()
      .min(min, message ?? `El valor debe ser al menos ${min}`)
      .pipe(max !== undefined ? z.number().max(max, `El valor no puede exceder ${max}`) : z.number())
  ]).optional();

const productEditSchema = z.object({
  descrip: z.string().min(1, 'La descripción es requerida').optional(),
  marca: z.string().optional(),
  linea: z.string().optional(),
  unidad: z.string().optional(),
  ubicacion: z.string().optional(),
  notes: z.string().optional(),
  image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  precio1: optionalNumber(0, undefined, 'El precio debe ser positivo'),
  impuesto: optionalNumber(0, 100, 'El impuesto debe ser entre 0 y 100'),
  minimo: optionalNumber(0, undefined, 'El mínimo debe ser positivo'),
  maximo: optionalNumber(0, undefined, 'El máximo debe ser positivo'),
  costo_u: optionalNumber(0, undefined, 'El costo debe ser positivo'),
});

type ProductEditFormData = z.infer<typeof productEditSchema>;

interface ProductEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ApiProduct | null;
}

export function ProductEditModal({
  open,
  onOpenChange,
  product,
}: ProductEditModalProps) {
  const updateMutation = useUpdateProduct();

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    setValue,
  } = useForm<ProductEditFormData>({
    resolver: zodResolver(productEditSchema),
  });

  useEffect(() => {
    if (open && product) {
      reset({
        descrip: product.descrip ?? '',
        marca: product.marca ?? '',
        linea: product.linea ?? '',
        unidad: product.unidad ?? '',
        ubicacion: product.ubicacion ?? '',
        notes: '',
        image_url: product.image_url ?? '',
        precio1: product.precio1 ?? undefined,
        impuesto: product.impuesto ?? undefined,
        minimo: product.minimo ?? undefined,
        maximo: product.maximo ?? undefined,
        costo_u: undefined,
      });
    }
  }, [open, product, reset]);

  const onSubmit = async (data: ProductEditFormData) => {
    if (!product) return;

    // Solo enviar campos que cambiaron
    const changedData: ProductUpdateRequest = {};
    
    (Object.keys(dirtyFields) as Array<keyof ProductEditFormData>).forEach((key) => {
      const value = data[key];
      if (value !== undefined && value !== '') {
        (changedData as Record<string, unknown>)[key] = value;
      }
    });

    if (Object.keys(changedData).length === 0) {
      onOpenChange(false);
      return;
    }

    await updateMutation.mutateAsync({
      sku: product.sku,
      data: changedData,
    });
    onOpenChange(false);
  };


  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Editar Producto</DialogTitle>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <form id="product-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">INFORMACIÓN BÁSICA</h3>
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="descrip">Descripción</Label>
                <Textarea
                  id="descrip"
                  {...register('descrip')}
                  placeholder="Descripción del producto..."
                  rows={2}
                />
                {errors.descrip && (
                  <p className="text-sm text-destructive">{errors.descrip.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input id="marca" {...register('marca')} placeholder="Ej: Roshfrans" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linea">Línea</Label>
                  <Input id="linea" {...register('linea')} placeholder="Ej: Aceite" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidad">Unidad</Label>
                  <Input id="unidad" {...register('unidad')} placeholder="Ej: PZA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input id="ubicacion" {...register('ubicacion')} placeholder="Ej: A1-B2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de Imagen</Label>
                <Input
                  id="image_url"
                  {...register('image_url')}
                  placeholder="https://..."
                  type="url"
                />
                {errors.image_url && (
                  <p className="text-sm text-destructive">{errors.image_url.message}</p>
                )}
              </div>
            </div>

            {/* Precios */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">PRECIOS</h3>
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio1">Precio</Label>
                  <Input
                    id="precio1"
                    type="number"
                    step="0.01"
                    {...register('precio1')}
                    placeholder="0.00"
                  />
                  {errors.precio1 && (
                    <p className="text-sm text-destructive">{String(errors.precio1.message ?? '')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impuesto">Impuesto (%)</Label>
                  <Input
                    id="impuesto"
                    type="number"
                    step="0.01"
                    {...register('impuesto')}
                    placeholder="16"
                  />
                  {errors.impuesto && (
                    <p className="text-sm text-destructive">{String(errors.impuesto.message ?? '')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo_u">Costo Unitario</Label>
                  <Input
                    id="costo_u"
                    type="number"
                    step="0.01"
                    {...register('costo_u')}
                    placeholder="0.00"
                  />
                  {errors.costo_u && (
                    <p className="text-sm text-destructive">{String(errors.costo_u.message ?? '')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">NIVELES DE STOCK</h3>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimo">Mínimo</Label>
                  <Input
                    id="minimo"
                    type="number"
                    step="1"
                    {...register('minimo')}
                    placeholder="0"
                  />
                  {errors.minimo && (
                    <p className="text-sm text-destructive">{String(errors.minimo.message ?? '')}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximo">Máximo</Label>
                  <Input
                    id="maximo"
                    type="number"
                    step="1"
                    {...register('maximo')}
                    placeholder="0"
                  />
                  {errors.maximo && (
                    <p className="text-sm text-destructive">{String(errors.maximo.message ?? '')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">NOTAS</h3>
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Notas internas sobre el producto..."
                  rows={3}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="product-edit-form"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
