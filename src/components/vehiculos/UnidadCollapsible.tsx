import { Bus, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Unidad } from '@/types/vehiculos';

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  activo: { label: 'Activo', variant: 'default' },
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
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-r-md ml-4 border-l-2 border-muted"
    >
      <Bus className="w-4 h-4 text-primary/70 shrink-0" />
      <span className="font-medium text-sm">Unidad {unidad.numero}</span>
      <span className="text-xs text-muted-foreground">{unidad.placa} · {unidad.marca} {unidad.modelo}</span>
      <Badge variant={badge.variant} className="text-[10px] ml-auto">{badge.label}</Badge>
    </button>
  );
}
