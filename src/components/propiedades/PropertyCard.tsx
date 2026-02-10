import { Building2, Home, Store, Warehouse, MapPin, Trees, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Propiedad } from '@/types/propiedades';

const tipoIcons: Record<string, React.ElementType> = {
  casa: Home, departamento: Building2, local_comercial: Store,
  bodega: Warehouse, terreno: Trees, oficina: Briefcase,
};

const tipoLabels: Record<string, string> = {
  casa: 'Casa', departamento: 'Departamento', local_comercial: 'Local Comercial',
  bodega: 'Bodega', terreno: 'Terreno', oficina: 'Oficina',
};

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  disponible: { label: 'Disponible', variant: 'default' },
  rentada: { label: 'Rentada', variant: 'secondary' },
  mantenimiento: { label: 'Mantenimiento', variant: 'destructive' },
};

interface PropertyCardProps {
  propiedad: Propiedad;
  onClick: (p: Propiedad) => void;
}

export function PropertyCard({ propiedad, onClick }: PropertyCardProps) {
  const Icon = tipoIcons[propiedad.tipo] || Building2;
  const badge = estadoBadge[propiedad.estado];

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick(propiedad)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{tipoLabels[propiedad.tipo]}</p>
              <p className="text-xs text-muted-foreground truncate">{propiedad.metrosCuadrados} m²</p>
            </div>
          </div>
          <Badge variant={badge.variant} className="shrink-0 text-xs">{badge.label}</Badge>
        </div>

        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2 leading-tight">{propiedad.direccion}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            ${propiedad.costoMensual.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mes</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
