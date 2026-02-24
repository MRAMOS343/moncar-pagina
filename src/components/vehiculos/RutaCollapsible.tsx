import { useMemo } from 'react';
import { ChevronRight, FolderOpen, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { UnidadCollapsible } from './UnidadCollapsible';
import type { Ruta, Unidad, DocumentoUnidad, AlertaDocumento } from '@/types/vehiculos';

function isExpired(v: string | null) { return v ? new Date(v).getTime() < Date.now() : false; }
function isExpiringSoon(v: string | null, dias = 30) {
  if (!v) return false;
  const diff = new Date(v).getTime() - Date.now();
  return diff > 0 && diff <= dias * 86400000;
}

interface Props {
  ruta: Ruta;
  unidades: Unidad[];
  documentos: DocumentoUnidad[];
  alertas: AlertaDocumento[];
  onSelectUnidad: (unidad: Unidad) => void;
}

export function RutaCollapsible({ ruta, unidades, documentos, alertas, onSelectUnidad }: Props) {
  const alertCount = useMemo(() => {
    let expired = 0, expiring = 0;
    for (const d of documentos) {
      if (isExpired(d.vigencia)) expired++;
      else if (isExpiringSoon(d.vigencia)) expiring++;
    }
    return { expired, expiring };
  }, [documentos]);

  return (
    <Collapsible className="border rounded-lg">
      <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 text-left hover:bg-muted/50 transition-colors group">
        <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-data-[state=open]:rotate-90 text-muted-foreground" />
        <FolderOpen className="w-5 h-5 text-primary shrink-0" />
        <span className="font-semibold text-sm flex-1">{ruta.nombre}</span>
        <Badge variant="outline" className="text-xs">{unidades.length} unidades</Badge>
        {alertCount.expired > 0 && (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="w-3 h-3" />{alertCount.expired} vencidos
          </Badge>
        )}
        {alertCount.expiring > 0 && (
          <Badge className="text-xs gap-1 bg-amber-500/15 text-amber-600 border-amber-300 hover:bg-amber-500/20">
            <AlertTriangle className="w-3 h-3" />{alertCount.expiring} por vencer
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-2 pb-2 space-y-1">
          {unidades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay unidades en esta ruta</p>
          ) : (
            unidades
              .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
              .map(u => (
                <UnidadCollapsible
                  key={u.id}
                  unidad={u}
                  documentos={documentos.filter(d => d.unidadId === u.id)}
                  onClick={() => onSelectUnidad(u)}
                />
              ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
