import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, Home, Store, Warehouse, Trees, Briefcase, MapPin, Ruler, Pencil, Trash2, ChevronRight, Plus, Download, Trash } from 'lucide-react';
import { toast } from 'sonner';
import type { Propiedad, DocumentoPropiedad, TipoDocumento } from '@/types/propiedades';

const tipoIcons: Record<string, React.ElementType> = {
  casa: Home, departamento: Building2, local_comercial: Store,
  bodega: Warehouse, terreno: Trees, oficina: Briefcase,
};
const tipoLabels: Record<string, string> = {
  casa: 'Casa', departamento: 'Departamento', local_comercial: 'Local Comercial',
  bodega: 'Bodega', terreno: 'Terreno', oficina: 'Oficina',
};
const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  disponible: { label: 'Disponible', variant: 'default' },
  rentada: { label: 'Rentada', variant: 'secondary' },
  mantenimiento: { label: 'Mantenimiento', variant: 'destructive' },
};

const TIPOS_DOCUMENTO: { tipo: TipoDocumento; label: string }[] = [
  { tipo: 'recibo_luz', label: 'Recibos de Luz' },
  { tipo: 'recibo_agua', label: 'Recibos de Agua' },
  { tipo: 'predial', label: 'Predial' },
  { tipo: 'contrato_firmado', label: 'Contratos Firmados' },
  { tipo: 'identificacion', label: 'Identificaciones' },
  { tipo: 'comprobante_domicilio', label: 'Comp. Domicilio' },
  { tipo: 'otro', label: 'Otros' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  propiedad: Propiedad | null;
  onEdit: (p: Propiedad) => void;
  onDelete: (id: string) => void;
  documentos?: DocumentoPropiedad[];
  onAddDocumento?: (tipo: TipoDocumento) => void;
  onDeleteDocumento?: (id: string) => void;
}

export function PropertyDetailModal({ open, onClose, propiedad, onEdit, onDelete, documentos = [], onAddDocumento, onDeleteDocumento }: Props) {
  if (!propiedad) return null;
  const Icon = tipoIcons[propiedad.tipo] || Building2;
  const badge = estadoBadge[propiedad.estado];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {tipoLabels[propiedad.tipo]}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <span className="text-lg font-bold">${propiedad.costoMensual.toLocaleString()}/mes</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{propiedad.direccion}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{propiedad.metrosCuadrados} m²</span>
            </div>
            {propiedad.descripcion && (
              <p className="text-sm text-muted-foreground">{propiedad.descripcion}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => onEdit(propiedad)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
              <Button variant="destructive" size="sm" onClick={() => { onDelete(propiedad.id); onClose(); }}><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>
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
                                <span className="text-xs text-muted-foreground shrink-0">{d.fechaSubida}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info('La descarga estará disponible al conectar el backend')}>
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
