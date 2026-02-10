import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Pago, Contrato, EstadoPago } from '@/types/propiedades';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Pago, 'id' | 'createdAt'>) => void;
  contratos: Contrato[];
  pago?: Pago | null;
}

const estadoOptions: { value: EstadoPago; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'parcial', label: 'Pago Parcial' },
];

export function PaymentFormModal({ open, onClose, onSave, contratos, pago }: Props) {
  const [form, setForm] = useState({
    contratoId: pago?.contratoId ?? '',
    propiedadId: pago?.propiedadId ?? '',
    mesCorrespondiente: pago?.mesCorrespondiente ?? '',
    montoEsperado: pago?.montoEsperado ?? 0,
    montoPagado: pago?.montoPagado ?? 0,
    fechaEsperada: pago?.fechaEsperada ?? '',
    fechaPago: pago?.fechaPago ?? null,
    estado: pago?.estado ?? 'pendiente' as EstadoPago,
    comprobante: pago?.comprobante ?? null,
    notas: pago?.notas ?? '',
  });

  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const handleContratoChange = (contratoId: string) => {
    const c = contratos.find(ct => ct.id === contratoId);
    set('contratoId', contratoId);
    if (c) {
      setForm(prev => ({ ...prev, contratoId, propiedadId: c.propiedadId, montoEsperado: c.montoMensual }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pago ? 'Editar Pago' : 'Registrar Pago'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Contrato *</Label>
            <Select value={form.contratoId} onValueChange={handleContratoChange}>
              <SelectTrigger><SelectValue placeholder="Seleccionar contrato" /></SelectTrigger>
              <SelectContent>
                {contratos.filter(c => c.activo).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.arrendatarioNombre} - ${c.montoMensual.toLocaleString()}/mes</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mes (YYYY-MM) *</Label><Input type="month" value={form.mesCorrespondiente} onChange={e => set('mesCorrespondiente', e.target.value)} required /></div>
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
            <div><Label>Monto esperado</Label><Input type="number" min={0} value={form.montoEsperado} readOnly className="bg-muted" /></div>
            <div><Label>Monto pagado ($)</Label><Input type="number" min={0} value={form.montoPagado} onChange={e => set('montoPagado', +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fecha esperada</Label><Input type="date" value={form.fechaEsperada} onChange={e => set('fechaEsperada', e.target.value)} /></div>
            <div><Label>Fecha de pago</Label><Input type="date" value={form.fechaPago ?? ''} onChange={e => set('fechaPago', e.target.value || null)} /></div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{pago ? 'Guardar' : 'Registrar Pago'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
