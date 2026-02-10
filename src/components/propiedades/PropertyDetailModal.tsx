import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, Home, Store, Warehouse, Trees, Briefcase, MapPin, BedDouble, Bath, Car, Ruler, Pencil, Trash2 } from 'lucide-react';
import type { Propiedad } from '@/types/propiedades';

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

interface Props {
  open: boolean;
  onClose: () => void;
  propiedad: Propiedad | null;
  onEdit: (p: Propiedad) => void;
  onDelete: (id: string) => void;
}

export function PropertyDetailModal({ open, onClose, propiedad, onEdit, onDelete }: Props) {
  if (!propiedad) return null;
  const Icon = tipoIcons[propiedad.tipo] || Building2;
  const badge = estadoBadge[propiedad.estado];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {tipoLabels[propiedad.tipo]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="text-lg font-bold">${propiedad.costoMensual.toLocaleString()}/mes</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{propiedad.direccion}</span>
          </div>
          <Separator />
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            <div><Ruler className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /><span className="font-medium">{propiedad.metrosCuadrados}</span><p className="text-xs text-muted-foreground">m²</p></div>
            <div><BedDouble className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /><span className="font-medium">{propiedad.habitaciones}</span><p className="text-xs text-muted-foreground">Hab.</p></div>
            <div><Bath className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /><span className="font-medium">{propiedad.banos}</span><p className="text-xs text-muted-foreground">Baños</p></div>
            <div><Car className="w-4 h-4 mx-auto mb-1 text-muted-foreground" /><span className="font-medium">{propiedad.estacionamientos}</span><p className="text-xs text-muted-foreground">Est.</p></div>
          </div>
          {propiedad.descripcion && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{propiedad.descripcion}</p>
            </>
          )}
          <Separator />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => onEdit(propiedad)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
            <Button variant="destructive" size="sm" onClick={() => { onDelete(propiedad.id); onClose(); }}><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
