import { Bus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Unidad } from '@/types/vehiculos';

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  activa: { label: 'Activo', variant: 'default' },
  taller: { label: 'En Taller', variant: 'secondary' },
  baja: { label: 'Baja', variant: 'destructive' },
};

interface Props {
  unidad: Unidad;
  onClick: () => void;
}

export function UnidadCollapsible({ unidad, onClick }: Props) {
  const badge = estadoBadge[unidad.estado];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-r-md ml-2 md:ml-4 border-l-2 border-muted min-h-[44px]"
    >
      <Bus className="w-4 h-4 text-primary/70 shrink-0" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 flex-1 min-w-0">
        <span className="font-medium text-sm whitespace-nowrap">Unidad {unidad.numero}</span>
        <span className="text-xs text-muted-foreground truncate">{unidad.placa} · {unidad.marca} {unidad.modelo}</span>
      </div>
      <Badge variant={badge.variant} className="text-[10px] shrink-0">{badge.label}</Badge>
    </button>
  );
}
