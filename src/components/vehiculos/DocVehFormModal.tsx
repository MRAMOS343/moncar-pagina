import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DocumentoVehiculo, TipoDocVehiculo, Vehiculo } from '@/types/vehiculos';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<DocumentoVehiculo, 'id'>) => void;
  vehiculos: Vehiculo[];
  defaultVehiculoId?: string;
  defaultTipo?: TipoDocVehiculo;
}

const tipoDocOptions: { value: TipoDocVehiculo; label: string }[] = [
  { value: 'seguro', label: 'Seguro' },
  { value: 'verificacion', label: 'Verificación' },
  { value: 'tarjeta_circulacion', label: 'Tarjeta de Circulación' },
  { value: 'factura', label: 'Factura' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'otro', label: 'Otro' },
];

export function DocVehFormModal({ open, onClose, onSave, vehiculos, defaultVehiculoId, defaultTipo }: Props) {
  const [form, setForm] = useState({
    vehiculoId: defaultVehiculoId ?? vehiculos[0]?.id ?? '',
    nombre: '',
    tipo: defaultTipo ?? 'seguro' as TipoDocVehiculo,
    vigencia: '',
    archivo: null as string | null,
    fechaSubida: new Date().toISOString().slice(0, 10),
    notas: '',
  });

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, vigencia: form.vigencia || null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Vehículo *</Label>
            <Select value={form.vehiculoId} onValueChange={v => set('vehiculoId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {vehiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoDocOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vigencia</Label>
              <Input type="date" value={form.vigencia} onChange={e => set('vigencia', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Seguro GNP 2026" />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
