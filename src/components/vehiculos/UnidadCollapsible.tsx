import { useMemo } from 'react';
import { ChevronRight, Bus, Plus, Bell, Download, Trash, AlertTriangle, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import type { Unidad, DocumentoUnidad, AlertaDocumento, TipoDocUnidad } from '@/types/vehiculos';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';

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
  unidad: Unidad;
  documentos: DocumentoUnidad[];
  alertas: AlertaDocumento[];
  onAddDoc: (tipo?: TipoDocUnidad) => void;
  onDeleteDoc: (id: string) => void;
  onConfigAlertas: () => void;
}

export function UnidadCollapsible({ unidad, documentos, alertas, onAddDoc, onDeleteDoc, onConfigAlertas }: Props) {
  const badge = estadoBadge[unidad.estado];

  const alerts = useMemo(() => {
    let expired = 0, expiring = 0;
    for (const d of documentos) {
      if (isExpired(d.vigencia)) expired++;
      else if (isExpiringSoon(d.vigencia)) expiring++;
    }
    return { expired, expiring };
  }, [documentos]);

  return (
    <Collapsible className="ml-4 border-l-2 border-muted">
      <CollapsibleTrigger className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors group rounded-r-md">
        <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-90 text-muted-foreground" />
        <Bus className="w-4 h-4 text-primary/70 shrink-0" />
        <span className="font-medium text-sm">Unidad {unidad.numero}</span>
        <span className="text-xs text-muted-foreground">{unidad.placa} · {unidad.marca} {unidad.modelo}</span>
        <Badge variant={badge.variant} className="text-[10px] ml-auto">{badge.label}</Badge>
        <Badge variant="outline" className="text-[10px]">{documentos.length} docs</Badge>
        {alerts.expired > 0 && <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />}
        {alerts.expiring > 0 && alerts.expired === 0 && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-8 mr-2 mb-3 space-y-2">
          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onConfigAlertas}>
              <Bell className="w-3 h-3 mr-1" />Alertas
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => onAddDoc()}>
              <Plus className="w-3 h-3 mr-1" />Subir Documento
            </Button>
          </div>

          {/* Documents table */}
          {documentos.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
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
                    const expired = isExpired(d.vigencia);
                    const expiring = isExpiringSoon(d.vigencia);
                    return (
                      <TableRow key={d.id} className={expired ? 'bg-destructive/5' : expiring ? 'bg-amber-500/5' : ''}>
                        <TableCell className="text-sm font-medium">{d.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{TIPO_DOC_LABELS[d.tipo]}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.vigencia ? (
                            <span className={`flex items-center gap-1 ${expired ? 'text-destructive font-medium' : expiring ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                              {(expired || expiring) && <AlertTriangle className="w-3 h-3" />}
                              {d.vigencia}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">{formatBytes(d.tamanoBytes)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info('Descarga disponible al conectar backend')}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteDoc(d.id)}>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
