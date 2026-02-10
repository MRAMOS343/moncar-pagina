import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Propiedad, TipoPropiedad, EstadoPropiedad } from '@/types/propiedades';

interface PropertyFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Propiedad, 'id' | 'createdAt'>) => void;
  propiedad?: Propiedad | null;
}

const tipoOptions: { value: TipoPropiedad; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'local_comercial', label: 'Local Comercial' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'oficina', label: 'Oficina' },
];

const estadoOptions: { value: EstadoPropiedad; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'rentada', label: 'Rentada' },
  { value: 'mantenimiento', label: 'En Mantenimiento' },
];

export function PropertyFormModal({ open, onClose, onSave, propiedad }: PropertyFormModalProps) {
  const [form, setForm] = useState({
    direccion: propiedad?.direccion ?? '',
    tipo: propiedad?.tipo ?? 'casa' as TipoPropiedad,
    metrosCuadrados: propiedad?.metrosCuadrados ?? 0,
    habitaciones: propiedad?.habitaciones ?? 0,
    banos: propiedad?.banos ?? 0,
    estacionamientos: propiedad?.estacionamientos ?? 0,
    estado: propiedad?.estado ?? 'disponible' as EstadoPropiedad,
    descripcion: propiedad?.descripcion ?? '',
    costoMensual: propiedad?.costoMensual ?? 0,
    fotos: propiedad?.fotos ?? [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{propiedad ? 'Editar Propiedad' : 'Nueva Propiedad'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Dirección *</Label>
            <Input value={form.direccion} onChange={e => set('direccion', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Label>Metros²</Label>
              <Input type="number" min={0} value={form.metrosCuadrados} onChange={e => set('metrosCuadrados', +e.target.value)} />
            </div>
            <div>
              <Label>Renta mensual ($)</Label>
              <Input type="number" min={0} value={form.costoMensual} onChange={e => set('costoMensual', +e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Habitaciones</Label>
              <Input type="number" min={0} value={form.habitaciones} onChange={e => set('habitaciones', +e.target.value)} />
            </div>
            <div>
              <Label>Baños</Label>
              <Input type="number" min={0} value={form.banos} onChange={e => set('banos', +e.target.value)} />
            </div>
            <div>
              <Label>Estacionamientos</Label>
              <Input type="number" min={0} value={form.estacionamientos} onChange={e => set('estacionamientos', +e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{propiedad ? 'Guardar Cambios' : 'Crear Propiedad'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
