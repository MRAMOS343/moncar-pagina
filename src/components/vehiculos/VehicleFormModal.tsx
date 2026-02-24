import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Unidad, EstadoVehiculo } from '@/types/vehiculos';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Unidad, 'id' | 'createdAt'>) => void;
  vehiculo?: Unidad | null;
  defaultRutaId?: string;
}

const estadoOptions: { value: EstadoVehiculo; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'taller', label: 'En Taller' },
  { value: 'baja', label: 'Baja' },
];

export function VehicleFormModal({ open, onClose, onSave, vehiculo, defaultRutaId }: Props) {
  const [form, setForm] = useState({
    rutaId: vehiculo?.rutaId ?? defaultRutaId ?? '',
    numero: vehiculo?.numero ?? '',
    placa: vehiculo?.placa ?? '',
    marca: vehiculo?.marca ?? '',
    modelo: vehiculo?.modelo ?? '',
    anio: vehiculo?.anio ?? new Date().getFullYear(),
    color: vehiculo?.color ?? '',
    km: vehiculo?.km ?? 0,
    estado: vehiculo?.estado ?? 'activo' as EstadoVehiculo,
    descripcion: vehiculo?.descripcion ?? '',
  });

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Placa *</Label>
              <Input value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase())} required placeholder="DGO-000-X" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => set('estado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {estadoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca *</Label>
              <Input value={form.marca} onChange={e => set('marca', e.target.value)} required />
            </div>
            <div>
              <Label>Modelo *</Label>
              <Input value={form.modelo} onChange={e => set('modelo', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Año</Label>
              <Input type="number" min={1990} max={2030} value={form.anio} onChange={e => set('anio', +e.target.value)} />
            </div>
            <div>
              <Label>Color</Label>
              <Input value={form.color} onChange={e => set('color', e.target.value)} />
            </div>
            <div>
              <Label>Kilometraje</Label>
              <Input type="number" min={0} value={form.km} onChange={e => set('km', +e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{vehiculo ? 'Guardar Cambios' : 'Crear Vehículo'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
