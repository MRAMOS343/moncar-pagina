import { Truck, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Vehiculo } from '@/types/vehiculos';

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  activo: { label: 'Activo', variant: 'default' },
  taller: { label: 'En Taller', variant: 'secondary' },
  baja: { label: 'Baja', variant: 'destructive' },
};

interface VehicleCardProps {
  vehiculo: Vehiculo;
  onClick: (v: Vehiculo) => void;
}

export function VehicleCard({ vehiculo, onClick }: VehicleCardProps) {
  const badge = estadoBadge[vehiculo.estado];

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick(vehiculo)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{vehiculo.marca} {vehiculo.modelo}</p>
              <p className="text-xs text-muted-foreground">{vehiculo.anio} · {vehiculo.color}</p>
            </div>
          </div>
          <Badge variant={badge.variant} className="shrink-0 text-xs">{badge.label}</Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            {vehiculo.placa}
          </span>
          <span className="font-medium text-foreground">{vehiculo.km.toLocaleString()} km</span>
        </div>

        {vehiculo.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-1">{vehiculo.descripcion}</p>
        )}
      </CardContent>
    </Card>
  );
}
