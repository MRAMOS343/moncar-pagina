import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Ruta } from '@/types/vehiculos';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; descripcion?: string; activa?: boolean }) => void;
  ruta?: Ruta | null;
  loading?: boolean;
}

export function RutaFormModal({ open, onClose, onSave, ruta, loading }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activa, setActiva] = useState(true);

  useEffect(() => {
    if (open) {
      setNombre(ruta?.nombre ?? '');
      setDescripcion(ruta?.descripcion ?? '');
      setActiva(ruta?.activa ?? true);
    }
  }, [open, ruta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, activa });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{ruta ? 'Editar Ruta' : 'Nueva Ruta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Paseos de Chavarría 2026" />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={activa} onCheckedChange={setActiva} />
            <Label>Activa</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || !nombre.trim()}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
