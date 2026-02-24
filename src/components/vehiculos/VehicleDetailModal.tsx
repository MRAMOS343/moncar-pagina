import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Bus, Plus, Bell, Download, Trash, AlertTriangle, FileText, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { Unidad, TipoDocUnidad } from '@/types/vehiculos';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import { useDocumentos, useDeleteDocumento, getDownloadUrl } from '@/hooks/useVehiculosAPI';

function isExpired(v: string | null) { return v ? new Date(v).getTime() < Date.now() : false; }
function isExpiringSoon(v: string | null, dias = 30) {
  if (!v) return false;
  const diff = new Date(v).getTime() - Date.now();
  return diff > 0 && diff <= dias * 86400000;
}
function formatBytes(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  activo: { label: 'Activo', variant: 'default' },
  taller: { label: 'En Taller', variant: 'secondary' },
  baja: { label: 'Baja', variant: 'destructive' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  unidad: Unidad | null;
  onAddDoc: (unidadId: string, tipo?: TipoDocUnidad) => void;
  onConfigAlertas: (unidadId: string) => void;
  onEditUnidad?: (unidad: Unidad) => void;
}

export function VehicleDetailModal({ open, onClose, unidad, onAddDoc, onConfigAlertas, onEditUnidad }: Props) {
  const unidadId = unidad?.id ?? null;
  const { data: documentos = [], isLoading: docsLoading } = useDocumentos(unidadId);
  const deleteDoc = useDeleteDocumento();

  const alertCounts = useMemo(() => {
    let expired = 0, expiring = 0;
    for (const d of documentos) {
      if (isExpired(d.vigenciaHasta)) expired++;
      else if (isExpiringSoon(d.vigenciaHasta)) expiring++;
    }
    return { expired, expiring };
  }, [documentos]);

  if (!unidad) return null;
  const badge = estadoBadge[unidad.estado];

  const handleDownload = async (archivoId: string | null) => {
    if (!archivoId) { toast.info('Sin archivo asociado'); return; }
    try {
      const url = await getDownloadUrl(archivoId);
      window.open(url, '_blank');
    } catch {
      toast.error('Error al obtener enlace de descarga');
    }
  };

  const handleDeleteDoc = (docId: string) => {
    deleteDoc.mutate(docId, {
      onSuccess: () => toast.success('Documento eliminado'),
      onError: () => toast.error('Error al eliminar documento'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            Unidad {unidad.numero} — {unidad.marca} {unidad.modelo} ({unidad.anio})
            {onEditUnidad && (
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => onEditUnidad(unidad)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <span className="text-sm font-medium text-muted-foreground">{unidad.placa}</span>
              {alertCounts.expired > 0 && (
                <Badge variant="destructive" className="text-xs gap-1 ml-auto">
                  <AlertTriangle className="w-3 h-3" />{alertCounts.expired} vencidos
                </Badge>
              )}
              {alertCounts.expiring > 0 && (
                <Badge className="text-xs gap-1 bg-amber-500/15 text-amber-600 border-amber-300 hover:bg-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />{alertCounts.expiring} por vencer
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Color:</span> <span className="font-medium">{unidad.color}</span></div>
              <div><span className="text-muted-foreground">Kilometraje:</span> <span className="font-medium">{unidad.km.toLocaleString()} km</span></div>
            </div>
            {unidad.descripcion && <p className="text-sm text-muted-foreground">{unidad.descripcion}</p>}

            <Separator />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Documentos</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onConfigAlertas(unidad.id)}>
                  <Bell className="w-3 h-3 mr-1" />Alertas
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={() => onAddDoc(unidad.id)}>
                  <Plus className="w-3 h-3 mr-1" />Subir Documento
                </Button>
              </div>
            </div>

            {docsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                Sin documentos registrados
              </div>
            ) : (
              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Vigencia</TableHead>
                      <TableHead className="text-xs text-right">Tamaño</TableHead>
                      <TableHead className="text-xs w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentos.map(d => {
                      const expired = isExpired(d.vigenciaHasta);
                      const expiring = isExpiringSoon(d.vigenciaHasta);
                      return (
                        <TableRow key={d.id} className={expired ? 'bg-destructive/5' : expiring ? 'bg-amber-500/5' : ''}>
                          <TableCell className="text-sm font-medium">{d.archivoNombre ?? d.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{TIPO_DOC_LABELS[d.tipo]}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {d.vigenciaHasta ? (
                              <span className={`flex items-center gap-1 ${expired ? 'text-destructive font-medium' : expiring ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                {(expired || expiring) && <AlertTriangle className="w-3 h-3" />}
                                {d.vigenciaHasta}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{formatBytes(d.archivoBytes)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(d.archivoId)}>
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDoc(d.id)}>
                                <Trash className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
