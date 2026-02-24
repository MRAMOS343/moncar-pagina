import { useMemo } from 'react';
import { Bus, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Unidad, DocumentoUnidad } from '@/types/vehiculos';

function isExpired(v: string | null) { return v ? new Date(v).getTime() < Date.now() : false; }
function isExpiringSoon(v: string | null, dias = 30) {
  if (!v) return false;
  const diff = new Date(v).getTime() - Date.now();
  return diff > 0 && diff <= dias * 86400000;
}

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  activo: { label: 'Activo', variant: 'default' },
  taller: { label: 'En Taller', variant: 'secondary' },
  baja: { label: 'Baja', variant: 'destructive' },
};

interface Props {
  unidad: Unidad;
  documentos: DocumentoUnidad[];
  onClick: () => void;
}

export function UnidadCollapsible({ unidad, documentos, onClick }: Props) {
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
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-r-md ml-4 border-l-2 border-muted"
    >
      <Bus className="w-4 h-4 text-primary/70 shrink-0" />
      <span className="font-medium text-sm">Unidad {unidad.numero}</span>
      <span className="text-xs text-muted-foreground">{unidad.placa} · {unidad.marca} {unidad.modelo}</span>
      <Badge variant={badge.variant} className="text-[10px] ml-auto">{badge.label}</Badge>
      <Badge variant="outline" className="text-[10px]">{documentos.length} docs</Badge>
      {alerts.expired > 0 && (
        <span className="flex items-center gap-0.5 text-destructive">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-[10px] font-medium">{alerts.expired}</span>
        </span>
      )}
      {alerts.expiring > 0 && alerts.expired === 0 && (
        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
      )}
    </button>
  );
}
