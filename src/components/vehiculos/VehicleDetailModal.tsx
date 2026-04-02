import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DocumentoUnidad } from '@/types/vehiculos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Bus, Plus, Bell, Download, Trash, AlertTriangle, FileText, Pencil, CalendarIcon, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Unidad, TipoDocUnidad } from '@/types/vehiculos';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import { useDocumentos, useDeleteDocumento, useUpdateDocumento, getDownloadUrl } from '@/hooks/useVehiculosAPI';

function formatVigencia(v: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}
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
  activa: { label: 'Activo', variant: 'default' },
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
  const updateDoc = useUpdateDocumento();
  const isMobile = useIsMobile();
  const [editingVigencia, setEditingVigencia] = useState<string | null>(null);

  const handleUpdateVigencia = (docId: string, date: Date | undefined) => {
    if (!date) return;
    const vigencia_hasta = format(date, 'yyyy-MM-dd');
    updateDoc.mutate(
      { id: docId, data: { vigencia_hasta } },
      {
        onSuccess: () => { toast.success('Vigencia actualizada'); setEditingVigencia(null); },
        onError: () => toast.error('Error al actualizar vigencia'),
      }
    );
  };

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
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 w-[95vw] md:w-auto">
        <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Bus className="w-5 h-5 text-primary shrink-0" />
            <span className="truncate">
              Unidad {unidad.numero} — {unidad.marca} {unidad.modelo} ({unidad.anio})
            </span>
            {onEditUnidad && (
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-7 md:w-7 ml-auto shrink-0" onClick={() => onEditUnidad(unidad)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-4 md:px-6 pb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
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

            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Documentos</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 md:h-7 text-xs" onClick={() => onConfigAlertas(unidad.id)}>
                  <Bell className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Alertas</span>
                </Button>
                <Button size="sm" className="h-8 md:h-7 text-xs" onClick={() => onAddDoc(unidad.id)}>
                  <Plus className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Subir</span> Documento
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
            ) : isMobile ? (
              /* Mobile: stacked cards */
              <div className="space-y-2">
                {documentos.map(d => {
                  const expired = isExpired(d.vigenciaHasta);
                  const expiring = isExpiringSoon(d.vigenciaHasta);
                  return (
                    <div
                      key={d.id}
                      className={`border rounded-lg p-3 space-y-2 ${expired ? 'bg-destructive/5 border-destructive/20' : expiring ? 'bg-amber-500/5 border-amber-300/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{d.archivoNombre ?? d.nombre}</p>
                          <Badge variant="outline" className="text-[10px] mt-1">{TIPO_DOC_LABELS[d.tipo]}</Badge>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Popover open={editingVigencia === d.id} onOpenChange={o => setEditingVigencia(o ? d.id : null)}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9" title="Editar vigencia">
                                <CalendarIcon className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                mode="single"
                                captionLayout="dropdown-buttons"
                                fromYear={2020}
                                toYear={2035}
                                selected={d.vigenciaHasta ? new Date(d.vigenciaHasta + 'T00:00:00') : undefined}
                                onSelect={(date) => handleUpdateVigencia(d.id, date)}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDownload(d.archivoId)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDeleteDoc(d.id)}>
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {d.vigenciaHasta ? (
                          <span className={`flex items-center gap-1 ${expired ? 'text-destructive font-medium' : expiring ? 'text-amber-600 font-medium' : ''}`}>
                            {(expired || expiring) && <AlertTriangle className="w-3 h-3" />}
                            Vigencia: {formatVigencia(d.vigenciaHasta)}
                          </span>
                        ) : (
                          <span>Sin vigencia</span>
                        )}
                        <span>{formatBytes(d.archivoBytes)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop: table */
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
                                {formatVigencia(d.vigenciaHasta)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-right text-muted-foreground">{formatBytes(d.archivoBytes)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Popover open={editingVigencia === d.id} onOpenChange={o => setEditingVigencia(o ? d.id : null)}>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar vigencia">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar
                                    mode="single"
                                    captionLayout="dropdown-buttons"
                                    fromYear={2020}
                                    toYear={2035}
                                    selected={d.vigenciaHasta ? new Date(d.vigenciaHasta + 'T00:00:00') : undefined}
                                    onSelect={(date) => handleUpdateVigencia(d.id, date)}
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
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
