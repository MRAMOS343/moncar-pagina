import { useState } from 'react';
import { ChevronRight, FolderOpen, AlertTriangle, MoreHorizontal, Plus, Pencil, Trash } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UnidadCollapsible } from './UnidadCollapsible';
import { useUnidades } from '@/hooks/useVehiculosAPI';
import type { Ruta, Unidad } from '@/types/vehiculos';

interface Props {
  ruta: Ruta;
  onSelectUnidad: (unidad: Unidad) => void;
  onEditRuta: (ruta: Ruta) => void;
  onDeleteRuta: (rutaId: string) => void;
  onAddUnidad: (rutaId: string) => void;
}

export function RutaCollapsible({ ruta, onSelectUnidad, onEditRuta, onDeleteRuta, onAddUnidad }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unidades = [], isLoading } = useUnidades(ruta.id, isOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <div className="flex items-center">
        <CollapsibleTrigger className="flex items-center gap-3 flex-1 p-4 text-left hover:bg-muted/50 transition-colors group">
          <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-data-[state=open]:rotate-90 text-muted-foreground" />
          <FolderOpen className="w-5 h-5 text-primary shrink-0" />
          <span className="font-semibold text-sm flex-1">{ruta.nombre}</span>
          <Badge variant="outline" className="text-xs">{ruta.unidadesCount} unidades</Badge>
          {!ruta.activa && <Badge variant="secondary" className="text-xs">Inactiva</Badge>}
        </CollapsibleTrigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddUnidad(ruta.id)}>
              <Plus className="w-4 h-4 mr-2" />Agregar Unidad
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditRuta(ruta)}>
              <Pencil className="w-4 h-4 mr-2" />Editar Ruta
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteRuta(ruta.id)}>
              <Trash className="w-4 h-4 mr-2" />Eliminar Ruta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CollapsibleContent>
        <div className="border-t px-2 pb-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : unidades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay unidades en esta ruta</p>
          ) : (
            unidades
              .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
              .map(u => (
                <UnidadCollapsible
                  key={u.id}
                  unidad={u}
                  onClick={() => onSelectUnidad(u)}
                />
              ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
