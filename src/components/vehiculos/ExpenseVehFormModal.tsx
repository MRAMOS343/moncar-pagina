import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GastoVehiculo, TipoGastoVeh, Unidad } from '@/types/vehiculos';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<GastoVehiculo, 'id'>) => void;
  unidades: Unidad[];
}

const tipoGastoOptions: { value: TipoGastoVeh; label: string }[] = [
  { value: 'combustible', label: 'Combustible' },
  { value: 'casetas', label: 'Casetas' },
  { value: 'estacionamiento', label: 'Estacionamiento' },
  { value: 'multa', label: 'Multa' },
  { value: 'otro', label: 'Otro' },
];

export function ExpenseVehFormModal({ open, onClose, onSave, unidades }: Props) {
  const [form, setForm] = useState({
    unidadId: unidades[0]?.id ?? '',
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'combustible' as TipoGastoVeh,
    monto: 0,
    descripcion: '',
    evidencia: null as string | null,
  });

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Unidad *</Label>
            <Select value={form.unidadId} onValueChange={v => set('unidadId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {unidades.map(u => <SelectItem key={u.id} value={u.id}>Unidad {u.numero} — {u.placa}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoGastoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto ($) *</Label>
              <Input type="number" min={0} value={form.monto} onChange={e => set('monto', +e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
