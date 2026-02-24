import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Car, Pencil, Trash2, ChevronRight, Plus, Download, Trash, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Unidad, DocumentoUnidad, TipoDocVehiculo } from '@/types/vehiculos';

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  activo: { label: 'Activo', variant: 'default' },
  taller: { label: 'En Taller', variant: 'secondary' },
  baja: { label: 'Baja', variant: 'destructive' },
};

const TIPOS_DOCUMENTO: { tipo: TipoDocVehiculo; label: string }[] = [
  { tipo: 'cromatica', label: 'Cromática' },
  { tipo: 'factura', label: 'Factura' },
  { tipo: 'poliza_seguro', label: 'Póliza de Seguro' },
  { tipo: 'tarjeta_circulacion', label: 'Tarjeta de Circulación' },
  { tipo: 'titulo_concesion', label: 'Título de Concesión' },
  { tipo: 'verificacion', label: 'Verificación' },
  { tipo: 'permiso', label: 'Permisos' },
  { tipo: 'otro', label: 'Otros' },
];

function isExpiringSoon(vigencia: string | null): boolean {
  if (!vigencia) return false;
  const diff = new Date(vigencia).getTime() - Date.now();
  return diff > 0 && diff <= 30 * 86400000;
}

function isExpired(vigencia: string | null): boolean {
  if (!vigencia) return false;
  return new Date(vigencia).getTime() < Date.now();
}

interface Props {
  open: boolean;
  onClose: () => void;
  vehiculo: Unidad | null;
  onEdit: (v: Unidad) => void;
  onDelete: (id: string) => void;
  documentos?: DocumentoUnidad[];
  onAddDocumento?: (tipo: TipoDocVehiculo) => void;
  onDeleteDocumento?: (id: string) => void;
}

export function VehicleDetailModal({ open, onClose, vehiculo, onEdit, onDelete, documentos = [], onAddDocumento, onDeleteDocumento }: Props) {
  if (!vehiculo) return null;
  const badge = estadoBadge[vehiculo.estado];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <span className="text-sm font-medium text-muted-foreground">{vehiculo.placa}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Color:</span> <span className="font-medium">{vehiculo.color}</span></div>
              <div><span className="text-muted-foreground">Kilometraje:</span> <span className="font-medium">{vehiculo.km.toLocaleString()} km</span></div>
            </div>

            {vehiculo.descripcion && (
              <p className="text-sm text-muted-foreground">{vehiculo.descripcion}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => onEdit(vehiculo)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
              <Button variant="destructive" size="sm" onClick={() => { onDelete(vehiculo.id); onClose(); }}><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>
            </div>

            <Separator />

            <h3 className="text-sm font-semibold text-foreground">Documentos</h3>

            <div className="space-y-1">
              {TIPOS_DOCUMENTO.map(({ tipo, label }) => {
                const docs = documentos.filter(d => d.tipo === tipo);
                return (
                  <Collapsible key={tipo}>
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary transition-colors group w-full text-left">
                        <ChevronRight className="w-4 h-4 transition-transform group-data-[state=open]:rotate-90" />
                        {label}
                        <Badge variant="outline" className="ml-1 text-xs">{docs.length}</Badge>
                      </CollapsibleTrigger>
                      {onAddDocumento && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => onAddDocumento(tipo)}>
                          <Plus className="w-3 h-3 mr-1" />Agregar
                        </Button>
                      )}
                    </div>
                    <CollapsibleContent>
                      {docs.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-6 pb-2">Sin documentos</p>
                      ) : (
                        <div className="pl-6 pb-2 space-y-1">
                          {docs.map(d => (
                            <div key={d.id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="truncate">{d.nombre}</span>
                                {d.vigencia && (
                                  <span className={`text-xs shrink-0 flex items-center gap-1 ${isExpired(d.vigencia) ? 'text-destructive font-medium' : isExpiringSoon(d.vigencia) ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                                    {isExpired(d.vigencia) && <AlertTriangle className="w-3 h-3" />}
                                    {isExpiringSoon(d.vigencia) && !isExpired(d.vigencia) && <AlertTriangle className="w-3 h-3" />}
                                    Vence: {d.vigencia}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info('Descarga disponible al conectar backend')}>
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                                {onDeleteDocumento && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteDocumento(d.id)}>
                                    <Trash className="w-3.5 h-3.5 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
