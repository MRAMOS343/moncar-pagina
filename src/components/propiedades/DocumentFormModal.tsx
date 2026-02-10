import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Propiedad, TipoDocumento, DocumentoPropiedad } from '@/types/propiedades';

const tipoDocLabels: Record<TipoDocumento, string> = {
  recibo_luz: 'Recibo de luz',
  recibo_agua: 'Recibo de agua',
  predial: 'Predial',
  contrato_firmado: 'Contrato firmado',
  identificacion: 'Identificación',
  comprobante_domicilio: 'Comprobante de domicilio',
  otro: 'Otro',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<DocumentoPropiedad, 'id'>) => void;
  propiedades: Propiedad[];
  defaultPropiedadId?: string;
  defaultTipo?: TipoDocumento;
}

export function DocumentFormModal({ open, onClose, onSave, propiedades, defaultPropiedadId, defaultTipo }: Props) {
  const [propiedadId, setPropiedadId] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoDocumento>('otro');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (open) {
      setPropiedadId(defaultPropiedadId || '');
      setNombre('');
      setTipo(defaultTipo || 'otro');
      setNotas('');
    }
  }, [open, defaultPropiedadId, defaultTipo]);

  const handleSubmit = () => {
    if (!propiedadId || !nombre) return;
    onSave({
      propiedadId,
      nombre,
      tipo,
      archivo: null,
      fechaSubida: new Date().toISOString().slice(0, 10),
      notas,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Subir Documento</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Propiedad</Label>
            <Select value={propiedadId} onValueChange={setPropiedadId} disabled={!!defaultPropiedadId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar propiedad" /></SelectTrigger>
              <SelectContent>
                {propiedades.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.direccion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de documento</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as TipoDocumento)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(tipoDocLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nombre del documento</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. CFE Enero 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Archivo</Label>
            <Input type="file" disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">La carga de archivos estará disponible al conectar el backend</p>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!propiedadId || !nombre}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
