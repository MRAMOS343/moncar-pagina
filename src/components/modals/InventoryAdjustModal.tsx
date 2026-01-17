import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdjustInventory } from '@/hooks/useInventoryMutations';
import { Loader2 } from 'lucide-react';

const adjustInventorySchema = z.object({
  delta: z.number({ required_error: 'Cantidad requerida' }).refine(val => val !== 0, {
    message: 'La cantidad no puede ser 0',
  }),
  motivo: z.string().min(3, 'El motivo debe tener al menos 3 caracteres'),
  almacen: z.string().min(1, 'Selecciona un almacén'),
  referencia: z.string().optional(),
});

type AdjustInventoryFormData = z.infer<typeof adjustInventorySchema>;

interface InventoryAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku: string;
  almacenes: string[];
}

export function InventoryAdjustModal({
  open,
  onOpenChange,
  sku,
  almacenes,
}: InventoryAdjustModalProps) {
  const adjustMutation = useAdjustInventory();
  const [deltaInput, setDeltaInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AdjustInventoryFormData>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: {
      delta: 0,
      motivo: '',
      almacen: almacenes[0] ?? '',
      referencia: '',
    },
  });

  const selectedAlmacen = watch('almacen');

  useEffect(() => {
    if (open) {
      reset({
        delta: 0,
        motivo: '',
        almacen: almacenes[0] ?? '',
        referencia: '',
      });
      setDeltaInput('');
    }
  }, [open, almacenes, reset]);

  const onSubmit = async (data: AdjustInventoryFormData) => {
    await adjustMutation.mutateAsync({
      sku,
      almacen: data.almacen,
      delta: data.delta,
      motivo: data.motivo,
      referencia: data.referencia || undefined,
    });
    onOpenChange(false);
  };

  const handleDeltaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeltaInput(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setValue('delta', parsed, { shouldValidate: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input value={sku} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="almacen">Almacén *</Label>
            <Select
              value={selectedAlmacen}
              onValueChange={(value) => setValue('almacen', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona almacén" />
              </SelectTrigger>
              <SelectContent>
                {almacenes.map((alm) => (
                  <SelectItem key={alm} value={alm}>
                    {alm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.almacen && (
              <p className="text-sm text-destructive">{errors.almacen.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delta">Cantidad (+ agregar, - quitar) *</Label>
            <Input
              id="delta"
              type="number"
              step="any"
              value={deltaInput}
              onChange={handleDeltaChange}
              placeholder="Ej: 10 o -5"
            />
            {errors.delta && (
              <p className="text-sm text-destructive">{errors.delta.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              {...register('motivo')}
              placeholder="Describe el motivo del ajuste..."
              rows={3}
            />
            {errors.motivo && (
              <p className="text-sm text-destructive">{errors.motivo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input
              id="referencia"
              {...register('referencia')}
              placeholder="Ej: Factura #123"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adjustMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={adjustMutation.isPending}>
              {adjustMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
