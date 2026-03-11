import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  AlertTriangle,
  Package,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompraSugerida } from '@/hooks/useCompraSugerida';
import { crearPreOrden, recalcularCompras, type CompraSugeridaItem } from '@/services/compraService';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import type { User } from '@/types';

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
}

type Prioridad = 'urgente' | 'normal' | 'opcional';

export default function ComprasPage() {
  const { currentWarehouse, searchQuery, currentUser } = useOutletContext<ContextType>();
  const { token } = useAuth();
  const isMobile = useIsMobile();

  const [prioridadFilter, setPrioridadFilter] = useState<Prioridad | null>(null);
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [preOrderOpen, setPreOrderOpen] = useState(false);
  const [preOrderNotas, setPreOrderNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const warehouseParam = currentWarehouse === 'all' ? undefined : currentWarehouse;

  const { data, isLoading, isError, refetch } = useCompraSugerida(warehouseParam);

  // Show error toast
  useEffect(() => {
    if (isError) toast.error('Error al cargar las sugerencias de compra. Intenta de nuevo.');
  }, [isError]);

  // Initialize cantidades when data loads
  useEffect(() => {
    if (data?.items) {
      const initial: Record<string, number> = {};
      data.items.forEach((item) => {
        initial[item.sku] = item.cantidad_sugerida;
      });
      setCantidades(initial);
      setSelectedSkus(new Set());
    }
  }, [data]);

  const items = data?.items ?? [];
  const resumen = data?.resumen ?? { urgente: 0, normal: 0, opcional: 0 };

  // Client-side filtering
  const filteredItems = useMemo(() => {
    let filtered = items;
    if (prioridadFilter) {
      filtered = filtered.filter((i) => i.prioridad === prioridadFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.marca.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, prioridadFilter, searchQuery]);

  // Selection helpers
  const toggleSku = useCallback((sku: string) => {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedSkus.size === filteredItems.length) {
      setSelectedSkus(new Set());
    } else {
      setSelectedSkus(new Set(filteredItems.map((i) => i.sku)));
    }
  }, [filteredItems, selectedSkus.size]);

  const updateCantidad = useCallback((sku: string, val: number) => {
    setCantidades((prev) => ({ ...prev, [sku]: Math.max(0, val) }));
  }, []);

  // Pre-order
  const selectedItems = useMemo(
    () => items.filter((i) => selectedSkus.has(i.sku)),
    [items, selectedSkus]
  );

  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + (cantidades[i.sku] ?? 0) * i.precio, 0),
    [selectedItems, cantidades]
  );

  const handleSubmitPreOrder = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await crearPreOrden(token, {
        sucursal_id: warehouseParam,
        notas: preOrderNotas || undefined,
        items: selectedItems.map((i) => ({
          sku: i.sku,
          cantidad: cantidades[i.sku] ?? i.cantidad_sugerida,
          precio_unitario: i.precio,
        })),
      });
      toast.success('Pre-orden creada correctamente');
      setPreOrderOpen(false);
      setPreOrderNotas('');
      setSelectedSkus(new Set());
      refetch();
    } catch {
      toast.error('Error al crear la pre-orden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecalcular = async () => {
    if (!token) return;
    setRecalculating(true);
    try {
      await recalcularCompras(token);
      toast.success('Recálculo iniciado. Los datos se actualizarán en unos minutos.');
    } catch {
      toast.error('Error al iniciar el recálculo.');
    }
    setTimeout(() => setRecalculating(false), 30_000);
  };

  const handleExport = () => {
    toast.info('Función de exportación próximamente.');
  };

  // Last updated
  const lastUpdated = items.length > 0 ? items[0].calculado_en : null;
  const lastUpdatedText = lastUpdated
    ? format(new Date(lastUpdated), "EEEE d 'de' MMMM, h:mm a", { locale: es })
    : 'Sin datos aún';

  const getPrioridadBadge = (p: Prioridad) => {
    switch (p) {
      case 'urgente':
        return <Badge variant="destructive">🔴 Urgente</Badge>;
      case 'normal':
        return <Badge variant="secondary">🟡 Normal</Badge>;
      case 'opcional':
        return <Badge variant="outline">🟢 Opcional</Badge>;
    }
  };

  const getCoverageColor = (dias: number) => {
    if (dias < 7) return 'bg-destructive';
    if (dias < 14) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getCoveragePercent = (dias: number) => Math.min(100, (dias / 30) * 100);

  const priorityCards: { key: Prioridad; label: string; emoji: string; count: number; color: string }[] = [
    { key: 'urgente', label: 'Urgente', emoji: '🔴', count: resumen.urgente, color: 'text-destructive' },
    { key: 'normal', label: 'Normal', emoji: '🟡', count: resumen.normal, color: 'text-yellow-500' },
    { key: 'opcional', label: 'Opcional', emoji: '🟢', count: resumen.opcional, color: 'text-primary' },
  ];

  return (
    <main role="main" aria-label="Contenido principal">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading ? 'Cargando sugerencias de compra...' : `${filteredItems.length} sugerencias encontradas`}
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Compra Sugerida</h1>
            <p className="text-sm text-muted-foreground">
              Última actualización: {lastUpdatedText}
            </p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <Button onClick={handleExport} variant="outline" size="sm" aria-label="Exportar sugerencias">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            {currentUser.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                disabled={recalculating}
                onClick={handleRecalcular}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {recalculating ? 'Recalculando…' : 'Actualizar sugerencias'}
                </span>
              </Button>
            )}
            <Button
              onClick={() => setPreOrderOpen(true)}
              size="sm"
              disabled={selectedSkus.size === 0}
              aria-label="Generar pre-orden de compra"
            >
              <ShoppingCart className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Generar Pre-orden</span>
              {selectedSkus.size > 0 && (
                <Badge variant="secondary" className="ml-1">{selectedSkus.size}</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Priority summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="kpi-card">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-7 w-10" />
                    </div>
                  </div>
                </Card>
              ))
            : priorityCards.map((pc) => (
                <Card
                  key={pc.key}
                  className={`kpi-card card-hover cursor-pointer transition-all ${
                    prioridadFilter === pc.key ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setPrioridadFilter((prev) => (prev === pc.key ? null : pc.key))}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pc.emoji}</span>
                    <div>
                      <p className="text-sm text-muted-foreground">{pc.label}</p>
                      <p className="text-2xl font-bold">{pc.count}</p>
                    </div>
                    {prioridadFilter === pc.key && (
                      <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </div>
                </Card>
              ))}
        </div>

        {/* Table */}
        <Card className="data-table card-hover animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sugerencias de Compra</CardTitle>
                <CardDescription>
                  {filteredItems.length} productos
                  {prioridadFilter && ` — filtro: ${prioridadFilter}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No hay productos que necesiten reabastecimiento"
                description="El sistema recalcula cada lunes. Ajusta el filtro de prioridad si es necesario."
              />
            ) : (
              <ResponsiveTable
                data={filteredItems}
                getRowKey={(item) => item.sku}
                columns={[
                  {
                    key: 'sku',
                    header: '✓',
                    render: (_: unknown, row: CompraSugeridaItem) => (
                      <Checkbox
                        checked={selectedSkus.has(row.sku)}
                        onCheckedChange={() => toggleSku(row.sku)}
                        aria-label={`Seleccionar ${row.nombre}`}
                      />
                    ),
                  },
                  {
                    key: 'sku',
                    header: 'SKU',
                    render: (value: string) => <span className="font-mono text-sm">{value}</span>,
                  },
                  {
                    key: 'nombre',
                    header: 'Producto',
                    render: (_: unknown, row: CompraSugeridaItem) => (
                      <div>
                        <div className="font-medium">{row.nombre}</div>
                        <div className="text-sm text-muted-foreground">{row.marca}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'stock_actual',
                    header: 'Stock',
                    render: (_: unknown, row: CompraSugeridaItem) => (
                      <span className={row.stock_actual <= row.stock_minimo ? 'text-destructive font-medium' : ''}>
                        {row.stock_actual} / {row.stock_minimo}
                      </span>
                    ),
                  },
                  {
                    key: 'dias_cobertura',
                    header: 'Cubre (días)',
                    render: (value: number) => (
                      <div className="space-y-1 min-w-[80px]">
                        <span className={Number(value) < 7 ? 'text-destructive font-medium' : ''}>{Number(value).toFixed(1)}</span>
                        <Progress
                          value={getCoveragePercent(value)}
                          className={`h-1.5 ${getCoverageColor(value)}`}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'cantidad_sugerida',
                    header: 'Sugerido',
                    render: (value: number) => <span className="text-right block">{value}</span>,
                  },
                  {
                    key: 'precio',
                    header: 'Precio unit.',
                    render: (value: number) => <span className="text-right block">{formatCurrency(value)}</span>,
                  },
                  {
                    key: 'sku',
                    header: 'Total',
                    render: (_: unknown, row: CompraSugeridaItem) => (
                      <span className="text-right block font-medium">
                        {formatCurrency((cantidades[row.sku] ?? row.cantidad_sugerida) * row.precio)}
                      </span>
                    ),
                  },
                  {
                    key: 'prioridad',
                    header: 'Prioridad',
                    render: (value: Prioridad) => getPrioridadBadge(value),
                  },
                  {
                    key: 'sku',
                    header: 'Cant. a pedir',
                    render: (_: unknown, row: CompraSugeridaItem) => (
                      <Input
                        type="number"
                        min={0}
                        className="w-20 h-8 text-sm"
                        value={cantidades[row.sku] ?? row.cantidad_sugerida}
                        onChange={(e) => updateCantidad(row.sku, parseInt(e.target.value) || 0)}
                      />
                    ),
                  },
                ]}
                mobileCardRender={(item) => (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedSkus.has(item.sku)}
                          onCheckedChange={() => toggleSku(item.sku)}
                        />
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          <p className="text-xs text-muted-foreground">{item.sku} · {item.marca}</p>
                        </div>
                      </div>
                      {getPrioridadBadge(item.prioridad)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Stock</p>
                        <p className={item.stock_actual <= item.stock_minimo ? 'text-destructive font-medium' : 'font-medium'}>
                          {item.stock_actual} / {item.stock_minimo}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cobertura</p>
                        <p className={item.dias_cobertura < 7 ? 'text-destructive font-medium' : ''}>
                          {item.dias_cobertura.toFixed(1)} días
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Precio</p>
                        <p>{formatCurrency(item.precio)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">
                          {formatCurrency((cantidades[item.sku] ?? item.cantidad_sugerida) * item.precio)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Cantidad:</span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20 h-8 text-sm"
                        value={cantidades[item.sku] ?? item.cantidad_sugerida}
                        onChange={(e) => updateCantidad(item.sku, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pre-order confirmation modal */}
      <Dialog open={preOrderOpen} onOpenChange={setPreOrderOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Pre-orden</DialogTitle>
            <DialogDescription>
              {selectedItems.length} productos seleccionados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-md divide-y">
              {selectedItems.map((item) => (
                <div key={item.sku} className="flex justify-between items-center p-3 text-sm">
                  <div>
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p>{cantidades[item.sku] ?? item.cantidad_sugerida} × {formatCurrency(item.precio)}</p>
                    <p className="font-medium">
                      {formatCurrency((cantidades[item.sku] ?? item.cantidad_sugerida) * item.precio)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center font-bold text-lg border-t pt-3">
              <span>Total</span>
              <span>{formatCurrency(selectedTotal)}</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                placeholder="Ej. Orden urgente semana 10"
                value={preOrderNotas}
                onChange={(e) => setPreOrderNotas(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreOrderOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitPreOrder} disabled={submitting}>
              {submitting ? 'Enviando…' : 'Confirmar Pre-orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
