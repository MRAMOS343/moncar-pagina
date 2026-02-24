import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DocumentoUnidad, TipoDocUnidad, Unidad } from '@/types/vehiculos';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<DocumentoUnidad, 'id'>) => void;
  unidades: Unidad[];
  defaultUnidadId?: string;
  defaultTipo?: TipoDocUnidad;
}

const tipoDocOptions: { value: TipoDocUnidad; label: string }[] = Object.entries(TIPO_DOC_LABELS).map(
  ([value, label]) => ({ value: value as TipoDocUnidad, label })
);

export function DocVehFormModal({ open, onClose, onSave, unidades, defaultUnidadId, defaultTipo }: Props) {
  const [form, setForm] = useState({
    unidadId: defaultUnidadId ?? unidades[0]?.id ?? '',
    nombre: '',
    tipo: defaultTipo ?? 'cromatica' as TipoDocUnidad,
    vigencia: '',
    archivoUrl: null as string | null,
    tamanoBytes: null as number | null,
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
            <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Poliza de Seguro 04 Chavarria.pdf" />
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
