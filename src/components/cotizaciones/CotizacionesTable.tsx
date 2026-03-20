import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Cotizacion, CotizacionEstado } from '@/types/cotizaciones';
import { Eye, Copy, CheckCircle2, XCircle, FileText, TrendingUp, DollarSign, Users } from 'lucide-react';

interface Props {
  cotizaciones: Cotizacion[];
  onView: (c: Cotizacion) => void;
  onDuplicate: (id: string) => void;
  onUpdateEstado: (id: string, estado: CotizacionEstado) => void;
}

const estadoBadge: Record<CotizacionEstado, { variant: 'default' | 'success' | 'destructive'; label: string }> = {
  pendiente: { variant: 'default', label: 'Pendiente' },
  concretada: { variant: 'success', label: 'Concretada' },
  cancelada: { variant: 'destructive', label: 'Cancelada' },
};

export function CotizacionesTable({ cotizaciones, onView, onDuplicate, onUpdateEstado }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const filtered = useMemo(() => {
    if (filtroEstado === 'todos') return cotizaciones;
    return cotizaciones.filter(c => c.estado === filtroEstado);
  }, [cotizaciones, filtroEstado]);

  const kpis = useMemo(() => {
    const total = cotizaciones.length;
    const concretadas = cotizaciones.filter(c => c.estado === 'concretada').length;
    const montoTotal = cotizaciones.reduce((s, c) => s + (Number(c.total) || 0), 0);
    const vendedores = new Set(cotizaciones.map(c => c.vendedorNombre)).size;
    return { total, concretadas, tasa: total ? Math.round((concretadas / total) * 100) : 0, montoTotal, vendedores };
  }, [cotizaciones]);

  const fmt = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{kpis.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">Concretadas</p><p className="text-xl font-bold">{kpis.tasa}%</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10"><DollarSign className="h-5 w-5 text-info" /></div>
          <div><p className="text-xs text-muted-foreground">Monto total</p><p className="text-xl font-bold">{fmt(kpis.montoTotal)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10"><Users className="h-5 w-5 text-accent" /></div>
          <div><p className="text-xs text-muted-foreground">Vendedores</p><p className="text-xl font-bold">{kpis.vendedores}</p></div>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="concretada">Concretada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} cotizaciones</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="py-2.5 px-3 text-left">Folio</th>
              <th className="py-2.5 px-3 text-left">Cliente</th>
              <th className="py-2.5 px-3 text-left hidden md:table-cell">Fecha</th>
              <th className="py-2.5 px-3 text-left hidden lg:table-cell">Vendedor</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No hay cotizaciones</td></tr>
            ) : filtered.map(c => {
              const badge = estadoBadge[c.estado];
              return (
                <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium">{c.folio}</td>
                  <td className="py-2.5 px-3">{c.cliente}</td>
                  <td className="py-2.5 px-3 hidden md:table-cell text-muted-foreground">{c.fecha}</td>
                  <td className="py-2.5 px-3 hidden lg:table-cell">{c.vendedorNombre}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{fmt(c.total)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(c)} title="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(c.id)} title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                      {c.estado === 'pendiente' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => onUpdateEstado(c.id, 'concretada')} title="Concretar">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onUpdateEstado(c.id, 'cancelada')} title="Cancelar">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
