import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Contrato, Propiedad } from '@/types/propiedades';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Contrato, 'id' | 'createdAt'>) => void;
  propiedades: Propiedad[];
  contrato?: Contrato | null;
}

export function ContractFormModal({ open, onClose, onSave, propiedades, contrato }: Props) {
  const disponibles = propiedades.filter(p => p.estado === 'disponible' || p.id === contrato?.propiedadId);
  const [form, setForm] = useState({
    propiedadId: contrato?.propiedadId ?? '',
    arrendatarioNombre: contrato?.arrendatarioNombre ?? '',
    arrendatarioContacto: contrato?.arrendatarioContacto ?? '',
    arrendatarioEmail: contrato?.arrendatarioEmail ?? '',
    arrendatarioRFC: contrato?.arrendatarioRFC ?? '',
    arrendatarioIdentificacion: contrato?.arrendatarioIdentificacion ?? 'INE',
    fechaInicio: contrato?.fechaInicio ?? '',
    fechaFin: contrato?.fechaFin ?? '',
    montoMensual: contrato?.montoMensual ?? 0,
    diaPago: contrato?.diaPago ?? 1,
    deposito: contrato?.deposito ?? 0,
    condicionesEspeciales: contrato?.condicionesEspeciales ?? '',
    activo: contrato?.activo ?? true,
  });

  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contrato ? 'Editar Contrato' : 'Nuevo Contrato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Propiedad *</Label>
            <Select value={form.propiedadId} onValueChange={v => set('propiedadId', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar propiedad" /></SelectTrigger>
              <SelectContent>
                {disponibles.map(p => <SelectItem key={p.id} value={p.id}>{p.direccion}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nombre del arrendatario *</Label><Input value={form.arrendatarioNombre} onChange={e => set('arrendatarioNombre', e.target.value)} required /></div>
            <div><Label>Teléfono</Label><Input value={form.arrendatarioContacto} onChange={e => set('arrendatarioContacto', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={form.arrendatarioEmail} onChange={e => set('arrendatarioEmail', e.target.value)} /></div>
            <div><Label>RFC</Label><Input value={form.arrendatarioRFC} onChange={e => set('arrendatarioRFC', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fecha inicio *</Label><Input type="date" value={form.fechaInicio} onChange={e => set('fechaInicio', e.target.value)} required /></div>
            <div><Label>Fecha fin *</Label><Input type="date" value={form.fechaFin} onChange={e => set('fechaFin', e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Renta mensual ($) *</Label><Input type="number" min={0} value={form.montoMensual} onChange={e => set('montoMensual', +e.target.value)} required /></div>
            <div><Label>Día de pago</Label><Input type="number" min={1} max={31} value={form.diaPago} onChange={e => set('diaPago', +e.target.value)} /></div>
            <div><Label>Depósito ($)</Label><Input type="number" min={0} value={form.deposito} onChange={e => set('deposito', +e.target.value)} /></div>
          </div>
          <div>
            <Label>Condiciones especiales</Label>
            <Textarea value={form.condicionesEspeciales} onChange={e => set('condicionesEspeciales', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{contrato ? 'Guardar' : 'Crear Contrato'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
