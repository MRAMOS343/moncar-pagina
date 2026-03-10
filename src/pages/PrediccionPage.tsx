import { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3, PackageOpen } from 'lucide-react';
import { LazyLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from '@/components/charts/LazyLineChart';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouses } from '@/hooks/useWarehouses';
import { usePrediccionProductos, usePrediccionDetalle } from '@/hooks/usePrediccion';
import { recalcularPredicciones } from '@/services/prediccionService';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { User } from '@/types';

interface ContextType {
  currentWarehouse: string;
  currentUser: User;
}

export default function PrediccionPage() {
  const { currentWarehouse, currentUser } = useOutletContext<ContextType>();
  const { token } = useAuth();
  const { data: warehousesData } = useWarehouses();
  const warehouses = warehousesData ?? [];

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(currentWarehouse);
  const [horizon, setHorizon] = useState<string>('8');
  const [recalculating, setRecalculating] = useState(false);

  // Fetch products with predictions
  const {
    data: productosData,
    isLoading: loadingProductos,
  } = usePrediccionProductos(selectedWarehouse || undefined);

  const productos = productosData?.productos ?? [];
  const [selectedSku, setSelectedSku] = useState<string>('');

  // Auto-select first product
  useEffect(() => {
    if (productos.length > 0 && !selectedSku) {
      setSelectedSku(productos[0].sku);
    }
  }, [productos, selectedSku]);

  // Fetch prediction detail
  const {
    data: prediccionData,
    isLoading: loadingPrediccion,
    isError,
  } = usePrediccionDetalle(
    selectedSku || undefined,
    selectedWarehouse || undefined,
    parseInt(horizon)
  );

  // Show error toast
  useEffect(() => {
    if (isError) {
      toast.error('Error al cargar la predicción. Intenta de nuevo.');
    }
  }, [isError]);

  // Build chart data
  const chartData = useMemo(() => {
    if (!prediccionData) return [];
    const points: Record<string, unknown>[] = [];

    prediccionData.historial.forEach((h) => {
      points.push({
        label: format(new Date(h.semana), 'dd/MM', { locale: es }),
        date: h.semana,
        value: h.unidades,
      });
    });

    prediccionData.predicciones.forEach((p) => {
      const existing = points.find((pt) => pt.date === p.semana_inicio);
      if (existing) {
        existing.forecast = p.unidades_pred;
        if (p.unidades_reales !== null) existing.value = p.unidades_reales;
      } else {
        points.push({
          label: format(new Date(p.semana_inicio), 'dd/MM', { locale: es }),
          date: p.semana_inicio,
          value: p.unidades_reales ?? undefined,
          forecast: p.unidades_pred,
        });
      }
    });

    return points;
  }, [prediccionData]);

  const producto = prediccionData?.producto;
  const metricas = prediccionData?.metricas;
  const firstPred = prediccionData?.predicciones?.[0];

  const handleRecalcular = async () => {
    if (!token) return;
    setRecalculating(true);
    try {
      await recalcularPredicciones(token);
      toast.success('Recálculo iniciado. Los datos se actualizarán en unos minutos.');
    } catch {
      toast.error('Error al iniciar el recálculo.');
    }
    setTimeout(() => setRecalculating(false), 30_000);
  };

  const formatCalcDate = (iso: string) => {
    try {
      return format(new Date(iso), "EEEE d 'de' MMMM, h:mm a", { locale: es });
    } catch {
      return iso;
    }
  };

  const tendenciaIcon = (t?: string) => {
    if (t === 'subiendo') return <TrendingUp className="w-4 h-4 text-primary" />;
    if (t === 'bajando') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const tendenciaLabel = (t?: string) => {
    if (t === 'subiendo') return 'Subiendo';
    if (t === 'bajando') return 'Bajando';
    return 'Estable';
  };

  return (
    <main role="main" aria-label="Contenido principal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Predicción de Ventas</h1>
            <p className="text-muted-foreground">
              Pronósticos de demanda basados en historial de ventas
            </p>
          </div>
          {currentUser.role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              disabled={recalculating}
              onClick={handleRecalcular}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculando…' : 'Actualizar predicciones'}
            </Button>
          )}
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Pronóstico</CardTitle>
            <CardDescription>
              Selecciona el producto, sucursal y horizonte de predicción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Producto</label>
                {loadingProductos ? (
                  <Skeleton className="h-10 w-full" />
                ) : productos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No hay predicciones calculadas aún. El sistema las genera automáticamente cada domingo.
                  </p>
                ) : (
                  <Select value={selectedSku} onValueChange={setSelectedSku}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.sku} value={p.sku}>
                          {p.sku} — {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sucursal</label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: { id: string; nombre: string }) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Horizonte (semanas)</label>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 semanas</SelectItem>
                    <SelectItem value="8">8 semanas</SelectItem>
                    <SelectItem value="12">12 semanas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product + Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Producto Seleccionado</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrediccion ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : producto ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono">{producto.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="font-medium">{producto.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marca:</span>
                    <span>{producto.marca}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoría:</span>
                    <Badge variant="outline">{producto.categoria}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-medium">{formatCurrency(producto.precio)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Stock actual:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{producto.stock_actual} unidades</span>
                      {producto.stock_actual <= producto.stock_minimo && (
                        <Badge variant="destructive">Stock bajo</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Métricas del Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrediccion ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : metricas ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">MAE (Error Absoluto Medio):</span>
                    <Badge variant="outline">
                      {metricas.mae !== null ? `${Number(metricas.mae).toFixed(2)} unidades` : 'Sin datos suficientes'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">MAPE (Error Porcentual Medio):</span>
                    <Badge variant={metricas.mape !== null && metricas.mape < 15 ? 'default' : 'secondary'}>
                      {metricas.mape !== null ? `${metricas.mape.toFixed(1)}%` : 'Sin datos suficientes'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sucursal:</span>
                    <span className="font-medium">
                      {warehouses.find((w: { id: string; nombre: string }) => w.id === selectedWarehouse)?.nombre ?? 'Todas'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Horizonte:</span>
                    <span className="font-medium">{horizon} semanas</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Semanas de historial:</span>
                    <span className="font-medium">{metricas.semanas_data}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Último cálculo:</span>
                    <span className="text-sm">{formatCalcDate(prediccionData!.calculado_en)}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Trend section */}
        {!loadingPrediccion && firstPred && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Tendencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  {tendenciaIcon(firstPred.tendencia)}
                  <span className="font-medium">{tendenciaLabel(firstPred.tendencia)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-muted-foreground cursor-help underline decoration-dotted">
                            Confianza: {Number(firstPred.confianza).toFixed(0)}%
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Qué tan consistente ha sido la demanda de este producto. Alta confianza = historial estable.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Progress value={firstPred.confianza} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart or empty state */}
        {loadingPrediccion ? (
          <ChartSkeleton />
        ) : prediccionData?.sin_datos ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin datos suficientes</h3>
              <p className="text-muted-foreground max-w-md">
                Este producto no tiene suficiente historial para generar un pronóstico.
                Se necesitan al menos 2 semanas de ventas registradas.
              </p>
            </CardContent>
          </Card>
        ) : prediccionData ? (
          <Card className="chart-card animate-fade-in">
            <CardHeader>
              <CardTitle>Pronóstico de Demanda</CardTitle>
              <CardDescription>
                Histórico real (línea sólida) vs Pronóstico (línea punteada)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyLineChart data={chartData} height={384}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Unidades', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(val: number, name: string) => {
                    const label = name === 'value' ? 'Histórico real' : 'Pronóstico';
                    return [val?.toFixed(1), label];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  name="value"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--destructive))"
                  name="forecast"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--destructive))', r: 3 }}
                  connectNulls={false}
                />
              </LazyLineChart>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
