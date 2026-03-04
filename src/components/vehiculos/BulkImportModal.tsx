import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, XCircle, FileText, FolderOpen, Loader2 } from 'lucide-react';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import type { ParsedUnidad, ImportarBulkResultado, DocumentoParaImportar } from '@/types/vehiculos';
import { uploadFile } from '@/services/archivoService';
import { importarBulk } from '@/services/vehiculoService';
import { useQueryClient } from '@tanstack/react-query';

type Estado = 'preview' | 'uploading' | 'done';

interface Props {
  open: boolean;
  onClose: () => void;
  rutaId: string;
  rutaNombre: string;
  unidades: ParsedUnidad[];
  duplicados: string[];
}

export function BulkImportModal({ open, onClose, rutaId, rutaNombre, unidades, duplicados }: Props) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<Estado>('preview');
  const [mensaje, setMensaje] = useState('');
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [resultado, setResultado] = useState<ImportarBulkResultado | null>(null);
  const [errorGlobal, setErrorGlobal] = useState('');

  const unidadesValidas = unidades.filter(u => !duplicados.includes(u.numero));
  const totalArchivos = unidadesValidas.reduce((sum, u) => sum + u.documentos.length, 0);

  const handleConfirm = async () => {
    setEstado('uploading');
    setProgreso({ actual: 0, total: totalArchivos });
    setMensaje('Iniciando subida de archivos…');

    const unidadesConIds: { numero: string; nombre?: string; documentos: DocumentoParaImportar[] }[] = [];
    let archivoActual = 0;

    for (const unidad of unidadesValidas) {
      const documentosConId: DocumentoParaImportar[] = [];

      for (const doc of unidad.documentos) {
        try {
          setMensaje(`Subiendo: ${doc.nombre}`);
          const archivo_id = await uploadFile(doc.file, {
            carpetaLogica: `vehiculos/${rutaId}`,
          });
          documentosConId.push({
            archivo_id,
            tipo: doc.tipo,
            nombre: doc.nombre,
          });
        } catch (err) {
          console.error('Error subiendo archivo:', doc.nombre, err);
          // Continue with remaining files
        }
        archivoActual++;
        setProgreso({ actual: archivoActual, total: totalArchivos });
      }

      unidadesConIds.push({
        numero: unidad.numero,
        nombre: unidad.nombre,
        documentos: documentosConId,
      });
    }

    // Phase 2: call bulk endpoint
    setMensaje('Creando unidades y registros…');
    try {
      const res = await importarBulk(rutaId, {
        unidades: unidadesConIds,
        omitir_duplicados: true,
      });
      setResultado(res);
      setEstado('done');
      queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
    } catch (err) {
      console.error('Error en importación bulk:', err);
      setErrorGlobal('Error al crear unidades en el servidor. Verifica tu conexión e intenta de nuevo.');
      setEstado('done');
    }
  };

  const handleClose = () => {
    if (estado === 'uploading') return; // prevent closing during upload
    setEstado('preview');
    setMensaje('');
    setProgreso({ actual: 0, total: 0 });
    setResultado(null);
    setErrorGlobal('');
    onClose();
  };

  const pct = progreso.total > 0 ? Math.round((progreso.actual / progreso.total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg" onPointerDownOutside={estado === 'uploading' ? (e) => e.preventDefault() : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Importar Carpeta — {rutaNombre}
          </DialogTitle>
        </DialogHeader>

        {estado === 'preview' && (
          <>
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-3 pr-2">
                {unidades.map(u => {
                  const isDup = duplicados.includes(u.numero);
                  return (
                    <div key={u.numero} className={`border rounded-lg p-3 ${isDup ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-sm">{u.nombre}</span>
                        <Badge variant="outline" className="text-[10px]">{u.documentos.length} docs</Badge>
                        {isDup && (
                          <Badge variant="secondary" className="text-[10px] text-amber-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />Duplicada — se omitirá
                          </Badge>
                        )}
                      </div>
                      <ul className="space-y-0.5">
                        {u.documentos.map((d, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate flex-1">{d.nombre}</span>
                            <Badge variant="outline" className="text-[9px] shrink-0">
                              {TIPO_DOC_LABELS[d.tipo] ?? d.tipo}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="text-sm text-muted-foreground">
              {unidadesValidas.length} unidad(es) a crear · {totalArchivos} archivo(s) a subir
              {duplicados.length > 0 && (
                <span className="text-amber-600"> · {duplicados.length} omitida(s)</span>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={unidadesValidas.length === 0}>
                Iniciar Importación
              </Button>
            </DialogFooter>
          </>
        )}

        {estado === 'uploading' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-medium">{mensaje}</span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {progreso.actual} / {progreso.total} archivos · {pct}%
            </p>
          </div>
        )}

        {estado === 'done' && (
          <div className="space-y-4 py-4">
            {errorGlobal ? (
              <div className="flex items-start gap-3 text-destructive">
                <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm">{errorGlobal}</p>
              </div>
            ) : resultado && (
              <div className="space-y-2">
                {resultado.creadas.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{resultado.creadas.length} unidad(es) creada(s)</span>
                  </div>
                )}
                {resultado.omitidas.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{resultado.omitidas.length} omitida(s) (ya existían)</span>
                  </div>
                )}
                {resultado.errores.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="w-4 h-4" />
                      <span>{resultado.errores.length} error(es)</span>
                    </div>
                    {resultado.errores.map((e, i) => (
                      <p key={i} className="text-xs text-muted-foreground ml-6">
                        Unidad {e.numero}: {e.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
