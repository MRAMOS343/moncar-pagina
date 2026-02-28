import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Unidad } from '@/types/vehiculos';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    numero: string; placa: string; marca?: string; modelo?: string;
    anio?: number; color?: string; km?: number; estado?: string; descripcion?: string;
  }) => void;
  unidad?: Unidad | null;
  loading?: boolean;
}

export function UnidadFormModal({ open, onClose, onSave, unidad, loading }: Props) {
  const [form, setForm] = useState({
    numero: '', placa: '', marca: '', modelo: '',
    anio: new Date().getFullYear(), color: '', km: 0, estado: 'activa', descripcion: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        numero: unidad?.numero ?? '',
        placa: unidad?.placa ?? '',
        marca: unidad?.marca ?? '',
        modelo: unidad?.modelo ?? '',
        anio: unidad?.anio ?? new Date().getFullYear(),
        color: unidad?.color ?? '',
        km: unidad?.km ?? 0,
        estado: unidad?.estado ?? 'activo',
        descripcion: unidad?.descripcion ?? '',
      });
    }
  }, [open, unidad]);

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero.trim() || !form.placa.trim()) return;
    onSave({
      numero: form.numero.trim(),
      placa: form.placa.trim(),
      marca: form.marca.trim() || undefined,
      modelo: form.modelo.trim() || undefined,
      anio: form.anio || undefined,
      color: form.color.trim() || undefined,
      km: form.km || undefined,
      estado: form.estado,
      descripcion: form.descripcion.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{unidad ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Número *</Label>
              <Input value={form.numero} onChange={e => set('numero', e.target.value)} required placeholder="04" />
            </div>
            <div>
              <Label>Placa *</Label>
              <Input value={form.placa} onChange={e => set('placa', e.target.value)} required placeholder="DGO-104-A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca</Label>
              <Input value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Chevrolet" />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Silverado" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Año</Label>
              <Input type="number" value={form.anio} onChange={e => set('anio', +e.target.value)} />
            </div>
            <div>
              <Label>Color</Label>
              <Input value={form.color} onChange={e => set('color', e.target.value)} />
            </div>
            <div>
              <Label>Km</Label>
              <Input type="number" value={form.km} onChange={e => set('km', +e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={v => set('estado', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="taller">En Taller</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || !form.numero.trim() || !form.placa.trim()}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
