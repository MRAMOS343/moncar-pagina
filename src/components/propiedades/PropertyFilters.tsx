import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  estadoFilter: string;
  onEstadoChange: (v: string) => void;
  tipoFilter: string;
  onTipoChange: (v: string) => void;
}

export function PropertyFilters({ search, onSearchChange, estadoFilter, onEstadoChange, tipoFilter, onTipoChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por dirección..." value={search} onChange={e => onSearchChange(e.target.value)} className="pl-9" />
      </div>
      <Select value={estadoFilter} onValueChange={onEstadoChange}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="disponible">Disponible</SelectItem>
          <SelectItem value="rentada">Rentada</SelectItem>
          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
        </SelectContent>
      </Select>
      <Select value={tipoFilter} onValueChange={onTipoChange}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="casa">Casa</SelectItem>
          <SelectItem value="departamento">Departamento</SelectItem>
          <SelectItem value="local_comercial">Local Comercial</SelectItem>
          <SelectItem value="bodega">Bodega</SelectItem>
          <SelectItem value="terreno">Terreno</SelectItem>
          <SelectItem value="oficina">Oficina</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
