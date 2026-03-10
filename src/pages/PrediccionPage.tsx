import { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, PackageOpen,
  DollarSign, CalendarDays, Target, BarChart3,
} from 'lucide-react';
import {
  LazyLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from '@/components/charts/LazyLineChart';
import { Area, ComposedChart, ReferenceLine } from 'recharts';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useSucursales } from '@/hooks/useSucursales';
import { usePrediccionDiaria } from '@/hooks/usePrediccion';
import { recalcularPrediccionesDiarias } from '@/services/prediccionService';
import { formatCurrency, toNumber } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { User } from '@/types';

interface ContextType {
  currentWarehouse: string;
  currentUser: User;
}

/* ── Helpers ── */

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatMontoAbrev(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatFechaCorta(fecha: string): string {
  try {
    const d = new Date(fecha + 'T12:00:00');
    return format(d, "EEE d MMM", { locale: es });
  } catch {
    return fecha;
  }
}

function formatFechaTooltip(fecha: string): string {
  try {
    const d = new Date(fecha + 'T12:00:00');
    return format(d, "EEEE d 'de' MMM", { locale: es });
  } catch {
    return fecha;
  }
}

function formatCalcDate(iso: string): string {
  try {
    return format(new Date(iso), "EEEE d 'de' MMMM, h:mm a", { locale: es });
  } catch {
    return iso;
  }
}

/* ── Component ── */

export default function PrediccionPage() {
  const { currentWarehouse, currentUser } = useOutletContext<ContextType>();
  const { token } = useAuth();
  const { data: sucursales = [] } = useSucursales();

  const [selectedSucursal, setSelectedSucursal] = useState<string>('todas');
  const [horizonte, setHorizonte] = useState<string>('30');
  const [recalculating, setRecalculating] = useState(false);

  const sucursalParam = selectedSucursal === 'todas' ? undefined : selectedSucursal;

  const {
    data: pred,
    isLoading,
    isError,
  } = usePrediccionDiaria(sucursalParam, parseInt(horizonte));

  // Chart data: merge historial + predicciones
  const { chartData, hoyStr } = useMemo(() => {
    if (!pred) return { chartData: [], hoyStr: '' };
    const hoy = new Date().toISOString().split('T')[0];
    const map = new Map<string, { fecha: string; real?: number; pred?: number; numVentas?: number }>();

    pred.historial.forEach((h) => {
      map.set(h.fecha, {
        fecha: h.fecha,
        real: toNumber(h.monto),
        numVentas: toNumber(h.num_ventas),
      });
    });

    pred.predicciones.forEach((p) => {
      const existing = map.get(p.fecha);
      if (existing) {
        existing.pred = toNumber(p.monto_pred);
        if (p.monto_real !== null) existing.real = toNumber(p.monto_real);
      } else {
        map.set(p.fecha, {
          fecha: p.fecha,
          pred: toNumber(p.monto_pred),
          real: p.monto_real !== null ? toNumber(p.monto_real) : undefined,
        });
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
    return {
      chartData: sorted.map((d) => ({
        ...d,
        label: formatFechaCorta(d.fecha),
      })),
      hoyStr: hoy,
    };
  }, [pred]);

  const handleRecalcular = useCallback(async () => {
    if (!token) return;
    setRecalculating(true);
    try {
      await recalcularPrediccionesDiarias(token);
      toast.success('Recálculo iniciado. Los datos estarán listos en unos minutos.');
    } catch {
      toast.error('Error al iniciar el recálculo.');
    }
    setTimeout(() => setRecalculating(false), 30_000);
  }, [token]);

  const kpis = pred?.kpis;
  const metricas = pred?.metricas;

  const tendenciaDisplay = (t: string | null | undefined) => {
    if (t === 'subiendo') return { icon: <TrendingUp className="w-5 h-5 text-success" />, label: 'Creciendo', color: 'text-success' };
    if (t === 'bajando') return { icon: <TrendingDown className="w-5 h-5 text-destructive" />, label: 'Bajando', color: 'text-destructive' };
    return { icon: <Minus className="w-5 h-5 text-muted-foreground" />, label: 'Estable', color: 'text-muted-foreground' };
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-xl">
        <p className="font-medium capitalize">{formatFechaTooltip(data?.fecha)}</p>
        {data?.real !== undefined && (
          <p className="text-info">Real: {formatCurrency(data.real)}</p>
        )}
        {data?.pred !== undefined && (
          <p className="text-muted-foreground">Predicción: {formatCurrency(data.pred)}</p>
        )}
        {data?.numVentas !== undefined && (
          <p className="text-muted-foreground">{data.numVentas} ventas</p>
        )}
      </div>
    );
  };

  return (
    <main role="main" aria-label="Contenido principal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Predicción de Ventas</h1>
            <p className="text-muted-foreground">
              Pronóstico de ventas diarias basado en patrones por día de semana
            </p>
          </div>
          {currentUser.role === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              disabled={recalculating}
              onClick={handleRecalcular}
              className="gap-2 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculando…' : 'Actualizar predicciones'}
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-1 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground">Sucursal</label>
            <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sucursales</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.codigo} value={s.codigo}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 min-w-[160px]">
            <label className="text-sm font-medium text-muted-foreground">Horizonte</label>
            <Select value={horizonte} onValueChange={setHorizonte}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="15">15 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-info/10 p-2">
                    <DollarSign className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Promedio semanal</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(kpis.promedio_semanal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-success/10 p-2">
                    <CalendarDays className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Proyección 30 días</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(kpis.total_pred_30d)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {(() => {
                  const t = tendenciaDisplay(kpis.tendencia);
                  return (
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">{t.icon}</div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tendencia</p>
                        <p className={`text-2xl font-bold ${t.color}`}>{t.label}</p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Confianza</p>
                    <p className="text-2xl font-bold text-foreground">
                      {kpis.confianza != null ? `${toNumber(kpis.confianza).toFixed(0)}%` : '—'}
                    </p>
                    {kpis.confianza != null && (
                      <Progress value={toNumber(kpis.confianza)} className="h-1.5 mt-1" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* sin_datos state */}
        {!isLoading && pred?.sin_datos && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay predicciones calculadas aún</h3>
              <p className="text-muted-foreground max-w-lg">
                El sistema genera predicciones automáticamente cada lunes.
                Si acabas de instalar el sistema, puedes forzar el primer cálculo
                con el botón "Actualizar predicciones".
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {isError && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error al cargar predicciones</h3>
              <p className="text-muted-foreground">
                Verifica tu conexión e intenta de nuevo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : pred && !pred.sin_datos && chartData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Ventas Diarias</CardTitle>
              <CardDescription>
                Línea sólida: ventas reales · Línea punteada: pronóstico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={formatMontoAbrev}
                    width={65}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />

                  {/* Vertical line for today */}
                  <ReferenceLine
                    x={formatFechaCorta(hoyStr)}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: 'Hoy', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />

                  {/* Prediction area fill */}
                  <Area
                    type="monotone"
                    dataKey="pred"
                    fill="hsl(var(--info) / 0.1)"
                    stroke="none"
                  />

                  {/* Real sales line */}
                  <Line
                    type="monotone"
                    dataKey="real"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    name="Real"
                  />

                  {/* Prediction line */}
                  <Line
                    type="monotone"
                    dataKey="pred"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls={false}
                    name="Predicción"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Predictions table */}
        {pred && !pred.sin_datos && pred.predicciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Predicciones</CardTitle>
              <CardDescription>Pronóstico diario con comparación real cuando está disponible</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead className="text-right">Predicción</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead className="text-center">Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pred.predicciones.map((p) => {
                    const montoReal = p.monto_real !== null ? toNumber(p.monto_real) : null;
                    const montoPred = toNumber(p.monto_pred);
                    const diff = montoReal !== null ? montoReal - montoPred : null;
                    const confianza = toNumber(p.confianza);

                    return (
                      <TableRow key={p.fecha}>
                        <TableCell className="font-medium capitalize">
                          {formatFechaCorta(p.fecha)}
                        </TableCell>
                        <TableCell>{DIAS_SEMANA[p.dia_semana]}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(montoPred)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {montoReal !== null ? formatCurrency(montoReal) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {diff !== null ? (
                            <span className={diff >= 0 ? 'text-success' : 'text-destructive'}>
                              {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            <Progress value={confianza} className="h-1.5 w-16" />
                            <span className="text-xs text-muted-foreground w-8">
                              {confianza.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Model metrics card */}
        {metricas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                Métricas del Modelo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground cursor-help underline decoration-dotted">
                          MAE (Error Absoluto Medio)
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        En promedio, el modelo se equivoca por esta cantidad al predecir las ventas de un día.
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-xl font-bold text-foreground">
                      {metricas.mae !== null
                        ? `${formatCurrency(toNumber(metricas.mae))} por día`
                        : 'Sin datos suficientes'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground cursor-help underline decoration-dotted">
                          MAPE (Error Porcentual)
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Error porcentual. Menos del 15% es bueno para ventas de retail.
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-xl font-bold text-foreground">
                      {metricas.mape !== null ? (
                        <>
                          {toNumber(metricas.mape).toFixed(1)}%
                          {toNumber(metricas.mape) < 15 && (
                            <Badge variant="default" className="ml-2 text-xs">Bueno</Badge>
                          )}
                        </>
                      ) : 'Sin datos suficientes'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Días de historial</p>
                    <p className="text-xl font-bold text-foreground">
                      {toNumber(metricas.dias_data)} días
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Último cálculo</p>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {metricas.calculado_en ? formatCalcDate(metricas.calculado_en) : '—'}
                    </p>
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
