import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { Pago, Propiedad } from '@/types/propiedades';

const estadoColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pagado: 'default',
  pendiente: 'outline',
  atrasado: 'destructive',
  parcial: 'secondary',
};
const estadoLabels: Record<string, string> = {
  pagado: 'Pagado', pendiente: 'Pendiente', atrasado: 'Atrasado', parcial: 'Parcial',
};

interface Props {
  pagos: Pago[];
  propiedades: Propiedad[];
  onEdit: (p: Pago) => void;
}

export function PaymentTable({ pagos, propiedades, onEdit }: Props) {
  const getPropDir = (id: string) => propiedades.find(p => p.id === id)?.direccion ?? '—';

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Propiedad</TableHead>
            <TableHead>Mes</TableHead>
            <TableHead className="text-right">Esperado</TableHead>
            <TableHead className="text-right">Pagado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha pago</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagos.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin pagos registrados</TableCell></TableRow>
          )}
          {pagos.map(p => (
            <TableRow key={p.id}>
              <TableCell className="max-w-[200px] truncate text-sm">{getPropDir(p.propiedadId)}</TableCell>
              <TableCell className="text-sm">{p.mesCorrespondiente}</TableCell>
              <TableCell className="text-right text-sm">${p.montoEsperado.toLocaleString()}</TableCell>
              <TableCell className="text-right text-sm font-medium">${p.montoPagado.toLocaleString()}</TableCell>
              <TableCell><Badge variant={estadoColors[p.estado]} className="text-xs">{estadoLabels[p.estado]}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.fechaPago ?? '—'}</TableCell>
              <TableCell><Button variant="ghost" size="icon" onClick={() => onEdit(p)}><Pencil className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
