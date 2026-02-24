import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';
import type { TipoDocUnidad } from '@/types/vehiculos';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import { uploadFile } from '@/services/archivoService';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    tipo: string; nombre: string; notas?: string;
    fecha_documento?: string; vigencia_hasta?: string; archivo_id?: string;
  }) => void;
  loading?: boolean;
}

const tipoDocOptions: { value: TipoDocUnidad; label: string }[] = Object.entries(TIPO_DOC_LABELS).map(
  ([value, label]) => ({ value: value as TipoDocUnidad, label })
);

export function DocVehFormModal({ open, onClose, onSave, loading }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'cromatica' as TipoDocUnidad,
    vigenciaHasta: '',
    fechaDocumento: new Date().toISOString().slice(0, 10),
    notas: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    let archivoId: string | undefined;

    if (file) {
      setUploading(true);
      setUploadProgress(0);
      try {
        archivoId = await uploadFile(file, {
          carpetaLogica: 'vehiculos',
          onProgress: (pct) => setUploadProgress(Math.round(pct * 100)),
        });
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSave({
      tipo: form.tipo,
      nombre: form.nombre.trim(),
      notas: form.notas.trim() || undefined,
      fecha_documento: form.fechaDocumento || undefined,
      vigencia_hasta: form.vigenciaHasta || undefined,
      archivo_id: archivoId,
    });
  };

  const busy = loading || uploading;

  return (
    <Dialog open={open} onOpenChange={v => !v && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>Vigencia hasta</Label>
              <Input type="date" value={form.vigenciaHasta} onChange={e => set('vigenciaHasta', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Poliza de Seguro 04.pdf" />
          </div>
          <div>
            <Label>Fecha documento</Label>
            <Input type="date" value={form.fechaDocumento} onChange={e => set('fechaDocumento', e.target.value)} />
          </div>
          <div>
            <Label>Archivo</Label>
            <div className="border border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => document.getElementById('doc-file-input')?.click()}>
              <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : 'Click para seleccionar archivo'}
              </p>
              {file && <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>}
            </div>
            <input id="doc-file-input" type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {uploading && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Subiendo archivo... {uploadProgress}%</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button type="submit" disabled={busy || !form.nombre.trim()}>
              {uploading ? 'Subiendo...' : loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
