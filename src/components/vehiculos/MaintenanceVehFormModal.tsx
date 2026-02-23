import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MantenimientoVehiculo, TipoMantenimientoVeh, Vehiculo } from '@/types/vehiculos';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<MantenimientoVehiculo, 'id'>) => void;
  vehiculos: Vehiculo[];
  mantenimiento?: MantenimientoVehiculo | null;
}

export function MaintenanceVehFormModal({ open, onClose, onSave, vehiculos, mantenimiento }: Props) {
  const [form, setForm] = useState({
    vehiculoId: mantenimiento?.vehiculoId ?? vehiculos[0]?.id ?? '',
    fecha: mantenimiento?.fecha ?? new Date().toISOString().slice(0, 10),
    tipo: mantenimiento?.tipo ?? 'preventivo' as TipoMantenimientoVeh,
    descripcion: mantenimiento?.descripcion ?? '',
    km: mantenimiento?.km ?? 0,
    costo: mantenimiento?.costo ?? 0,
    proveedor: mantenimiento?.proveedor ?? '',
    notas: mantenimiento?.notas ?? '',
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
          <DialogTitle>{mantenimiento ? 'Editar Servicio' : 'Registrar Servicio'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vehículo *</Label>
              <Select value={form.vehiculoId} onValueChange={v => set('vehiculoId', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventivo">Preventivo</SelectItem>
                  <SelectItem value="correctivo">Correctivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div>
              <Label>Kilometraje</Label>
              <Input type="number" min={0} value={form.km} onChange={e => set('km', +e.target.value)} />
            </div>
            <div>
              <Label>Costo ($)</Label>
              <Input type="number" min={0} value={form.costo} onChange={e => set('costo', +e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descripción *</Label>
            <Input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} required />
          </div>
          <div>
            <Label>Proveedor</Label>
            <Input value={form.proveedor} onChange={e => set('proveedor', e.target.value)} />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{mantenimiento ? 'Guardar' : 'Registrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
