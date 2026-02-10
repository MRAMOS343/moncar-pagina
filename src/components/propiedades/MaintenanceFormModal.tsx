import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SolicitudMantenimiento, Propiedad, PrioridadMantenimiento, EstadoMantenimiento } from '@/types/propiedades';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<SolicitudMantenimiento, 'id'>) => void;
  propiedades: Propiedad[];
  solicitud?: SolicitudMantenimiento | null;
}

export function MaintenanceFormModal({ open, onClose, onSave, propiedades, solicitud }: Props) {
  const [form, setForm] = useState({
    propiedadId: solicitud?.propiedadId ?? '',
    titulo: solicitud?.titulo ?? '',
    descripcion: solicitud?.descripcion ?? '',
    prioridad: solicitud?.prioridad ?? 'media' as PrioridadMantenimiento,
    estado: solicitud?.estado ?? 'pendiente' as EstadoMantenimiento,
    costoEstimado: solicitud?.costoEstimado ?? 0,
    costoReal: solicitud?.costoReal ?? null,
    proveedor: solicitud?.proveedor ?? '',
    fechaSolicitud: solicitud?.fechaSolicitud ?? new Date().toISOString().slice(0, 10),
    fechaResolucion: solicitud?.fechaResolucion ?? null,
  });

  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{solicitud ? 'Editar Solicitud' : 'Nueva Solicitud de Mantenimiento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Propiedad *</Label>
            <Select value={form.propiedadId} onValueChange={v => set('propiedadId', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {propiedades.map(p => <SelectItem key={p.id} value={p.id}>{p.direccion}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Título *</Label><Input value={form.titulo} onChange={e => set('titulo', e.target.value)} required /></div>
          <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridad</Label>
              <Select value={form.prioridad} onValueChange={v => set('prioridad', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => set('estado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Costo estimado ($)</Label><Input type="number" min={0} value={form.costoEstimado} onChange={e => set('costoEstimado', +e.target.value)} /></div>
            <div><Label>Costo real ($)</Label><Input type="number" min={0} value={form.costoReal ?? ''} onChange={e => set('costoReal', e.target.value ? +e.target.value : null)} /></div>
          </div>
          <div><Label>Proveedor</Label><Input value={form.proveedor} onChange={e => set('proveedor', e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{solicitud ? 'Guardar' : 'Crear Solicitud'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
