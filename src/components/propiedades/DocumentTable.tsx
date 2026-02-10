import { Download, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { DocumentoPropiedad, Propiedad, TipoDocumento } from '@/types/propiedades';

const tipoDocLabels: Record<TipoDocumento, string> = {
  recibo_luz: 'Recibo de luz',
  recibo_agua: 'Recibo de agua',
  predial: 'Predial',
  contrato_firmado: 'Contrato firmado',
  identificacion: 'Identificación',
  comprobante_domicilio: 'Comp. domicilio',
  otro: 'Otro',
};

interface Props {
  documentos: DocumentoPropiedad[];
  propiedades: Propiedad[];
  onDelete: (id: string) => void;
}

export function DocumentTable({ documentos, propiedades, onDelete }: Props) {
  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Propiedad</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="w-24 text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentos.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin documentos</TableCell>
            </TableRow>
          )}
          {documentos.map(d => (
            <TableRow key={d.id}>
              <TableCell className="max-w-[180px] truncate text-sm">
                {propiedades.find(p => p.id === d.propiedadId)?.direccion ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{tipoDocLabels[d.tipo]}</Badge>
              </TableCell>
              <TableCell className="text-sm">{d.nombre}</TableCell>
              <TableCell className="text-sm">{d.fechaSubida}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">{d.notas || '—'}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toast.info('La descarga estará disponible al conectar el backend')}
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(d.id)} title="Eliminar">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
