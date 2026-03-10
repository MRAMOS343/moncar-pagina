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
  DollarSign, CalendarDays, Target, BarChart3, ArrowLeft, Calendar, CalendarRange,
} from 'lucide-react';
import {
  ResponsiveContainer,
} from '@/components/charts/LazyLineChart';
import {
  Area, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ReferenceLine,
} from 'recharts';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useSucursales } from '@/hooks/useSucursales';
import { usePrediccion } from '@/hooks/usePrediccion';
import { recalcularPrediccionesDiarias } from '@/services/prediccionService';
import type {
  PrediccionSemanalResponse,
  PrediccionDiariaResponse,
} from '@/services/prediccionService';
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

const DIAS_SEMANA_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_SEMANA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatMontoAbrev(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatFechaCorta(fecha: string): string {
  try {
    const d = new Date(fecha + 'T12:00:00');
    return format(d, "d MMM", { locale: es });
  } catch {
    return fecha;
  }
}

function formatSemanaLabel(inicio: string, fin: string): string {
  try {
    const di = new Date(inicio + 'T12:00:00');
    const df = new Date(fin + 'T12:00:00');
    return `${format(di, 'd', { locale: es })}–${format(df, 'd MMM', { locale: es })}`;
  } catch {
    return `${inicio} – ${fin}`;
  }
}

function formatCalcDate(iso: string): string {
  try {
    return format(new Date(iso), "EEEE d 'de' MMMM, h:mm a", { locale: es });
  } catch {
    return iso;
  }
}

function getWeekNumber(fecha: string): number {
  const d = new Date(fecha + 'T12:00:00');
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

/* ── Component ── */

export default function PrediccionPage() {
  const { currentUser } = useOutletContext<ContextType>();
  const { token } = useAuth();
  const { data: sucursales = [] } = useSucursales();

  const [vista, setVista] = useState<'semanal' | 'diaria'>('semanal');
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string | null>(null);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('todas');
  const [recalculating, setRecalculating] = useState(false);

  const sucursalParam = selectedSucursal === 'todas' ? undefined : selectedSucursal;
  const horizonte = vista === 'semanal' ? 12 : semanaSeleccionada ? 7 : 30;

  const {
    data: pred,
    isLoading,
    isError,
  } = usePrediccion(vista, sucursalParam, horizonte);

  const isSemanal = pred?.vista === 'semanal';
  const semanalData = isSemanal ? pred as PrediccionSemanalResponse : null;
  const diariaData = !isSemanal && pred ? pred as PrediccionDiariaResponse : null;

  /* ── Chart data (semanal) ── */
  const semanalChartData = useMemo(() => {
    if (!semanalData) return [];
    const hoy = new Date().toISOString().split('T')[0];
    const points: any[] = [];

    semanalData.historial.forEach((h) => {
      points.push({
        key: h.semana_inicio,
        label: formatSemanaLabel(h.semana_inicio, h.semana_fin),
        real: toNumber(h.monto),
        numVentas: toNumber(h.num_ventas),
        ticketProm: toNumber(h.ticket_promedio),
        semana_inicio: h.semana_inicio,
        semana_fin: h.semana_fin,
        isPast: h.semana_fin < hoy,
      });
    });

    semanalData.predicciones.forEach((p) => {
      const existing = points.find((pt) => pt.key === p.semana_inicio);
      if (existing) {
        existing.pred = toNumber(p.monto_pred);
        if (p.monto_real !== null) existing.realPred = toNumber(p.monto_real);
      } else {
        points.push({
          key: p.semana_inicio,
          label: formatSemanaLabel(p.semana_inicio, p.semana_fin),
          pred: toNumber(p.monto_pred),
          realPred: p.monto_real !== null ? toNumber(p.monto_real) : undefined,
          semana_inicio: p.semana_inicio,
          semana_fin: p.semana_fin,
          isPast: false,
        });
      }
    });

    return points.sort((a, b) => a.key.localeCompare(b.key));
  }, [semanalData]);

  /* ── Chart data (diaria) ── */
  const diariaChartData = useMemo(() => {
    if (!diariaData) return [];
    const map = new Map<string, any>();

    diariaData.historial.forEach((h) => {
      map.set(h.fecha, {
        fecha: h.fecha,
        label: `${DIAS_SEMANA_CORTO[h.dia_semana]} ${formatFechaCorta(h.fecha)}`,
        real: toNumber(h.monto),
        numVentas: toNumber(h.num_ventas),
      });
    });

    diariaData.predicciones.forEach((p) => {
      const existing = map.get(p.fecha);
      if (existing) {
        existing.pred = toNumber(p.monto_pred);
        if (p.monto_real !== null) existing.real = toNumber(p.monto_real);
      } else {
        map.set(p.fecha, {
          fecha: p.fecha,
          label: `${DIAS_SEMANA_CORTO[p.dia_semana]} ${formatFechaCorta(p.fecha)}`,
          pred: toNumber(p.monto_pred),
          real: p.monto_real !== null ? toNumber(p.monto_real) : undefined,
        });
      }
    });

    return Array.from(map.values()).sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));
  }, [diariaData]);

  const hoyStr = new Date().toISOString().split('T')[0];

  /* ── Handlers ── */
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

  const handleVistaChange = (v: 'semanal' | 'diaria') => {
    setVista(v);
    setSemanaSeleccionada(null);
  };

  const handleBarClick = (data: any) => {
    if (data?.semana_inicio) {
      setSemanaSeleccionada(data.semana_inicio);
      setVista('diaria');
    }
  };

  const tendenciaDisplay = (t: string | null | undefined) => {
    if (t === 'subiendo') return { icon: <TrendingUp className="w-5 h-5 text-success" />, label: 'Creciendo', color: 'text-success' };
    if (t === 'bajando') return { icon: <TrendingDown className="w-5 h-5 text-destructive" />, label: 'Bajando', color: 'text-destructive' };
    return { icon: <Minus className="w-5 h-5 text-muted-foreground" />, label: 'Estable', color: 'text-muted-foreground' };
  };

  const kpis = semanalData?.kpis;
  const metricas = semanalData?.metricas;

  /* ── Tooltips ── */
  const SemanalTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-xl">
        <p className="font-medium">Semana del {formatFechaCorta(d?.semana_inicio)} al {formatFechaCorta(d?.semana_fin)}</p>
        {d?.real !== undefined && <p className="text-info">Real: {formatCurrency(d.real)}</p>}
        {d?.realPred !== undefined && <p className="text-success">Real (vs pred): {formatCurrency(d.realPred)}</p>}
        {d?.pred !== undefined && <p className="text-muted-foreground">Predicción: {formatCurrency(d.pred)}</p>}
        {d?.numVentas !== undefined && <p className="text-muted-foreground">{d.numVentas} ventas</p>}
        {d?.ticketProm !== undefined && <p className="text-muted-foreground">Ticket prom: {formatCurrency(d.ticketProm)}</p>}
      </div>
    );
  };

  const DiariaTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-xl">
        <p className="font-medium capitalize">{d?.label}</p>
        {d?.real !== undefined && <p className="text-info">Real: {formatCurrency(d.real)}</p>}
        {d?.pred !== undefined && <p className="text-muted-foreground">Predicción: {formatCurrency(d.pred)}</p>}
        {d?.numVentas !== undefined && <p className="text-muted-foreground">{d.numVentas} ventas</p>}
      </div>
    );
  };

  // Find "hoy" label for reference line
  const hoyLabelSemanal = useMemo(() => {
    const match = semanalChartData.find(
      (d) => d.semana_inicio <= hoyStr && d.semana_fin >= hoyStr
    );
    return match?.label;
  }, [semanalChartData, hoyStr]);

  const hoyLabelDiaria = useMemo(() => {
    const match = diariaChartData.find((d: any) => d.fecha === hoyStr);
    return match?.label;
  }, [diariaChartData, hoyStr]);

  const sinDatos = pred?.sin_datos;
  const hasChartData = vista === 'semanal' ? semanalChartData.length > 0 : diariaChartData.length > 0;

  return (
    <main role="main" aria-label="Contenido principal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Predicción de Ventas</h1>
            <p className="text-muted-foreground">
              Pronóstico de ventas basado en patrones históricos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sucursales</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.codigo} value={s.codigo}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>

        {/* KPI Cards — only in semanal view */}
        {vista === 'semanal' && (
          isLoading ? (
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
                      <p className="text-sm text-muted-foreground">Proyección 12 semanas</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(kpis.total_pred_12sem)}
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
          ) : null
        )}

        {/* sin_datos / error states */}
        {!isLoading && sinDatos && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay predicciones calculadas aún</h3>
              <p className="text-muted-foreground max-w-lg mb-4">
                El sistema genera predicciones automáticamente cada lunes.
                Si acabas de instalar el sistema, puedes forzar el primer cálculo.
              </p>
              {currentUser.role === 'admin' && (
                <Button
                  variant="default"
                  disabled={recalculating}
                  onClick={handleRecalcular}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                  Forzar primer cálculo
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error al cargar predicciones</h3>
              <p className="text-muted-foreground">Verifica tu conexión e intenta de nuevo.</p>
            </CardContent>
          </Card>
        )}

        {/* Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : pred && !sinDatos && hasChartData ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  {vista === 'diaria' && semanaSeleccionada && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVistaChange('semanal')}
                      className="gap-1 mb-2 -ml-2 text-muted-foreground"
                    >
                      <ArrowLeft className="w-4 h-4" /> Volver a vista semanal
                    </Button>
                  )}
                  <CardTitle>
                    {vista === 'semanal'
                      ? 'Tendencia de Ventas Semanales'
                      : semanaSeleccionada
                        ? `Detalle diario — Semana del ${formatFechaCorta(semanaSeleccionada)}`
                        : 'Tendencia de Ventas Diarias'}
                  </CardTitle>
                  <CardDescription>
                    {vista === 'semanal'
                      ? 'Barras grises: historial · Barras azules: pronóstico · Click en una barra para ver detalle diario'
                      : 'Línea sólida: ventas reales · Línea punteada: pronóstico'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                {vista === 'semanal' ? (
                  <ComposedChart data={semanalChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="label"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={formatMontoAbrev}
                      width={65}
                    />
                    <RechartsTooltip content={<SemanalTooltip />} />

                    {hoyLabelSemanal && (
                      <ReferenceLine
                        x={hoyLabelSemanal}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: 'Hoy', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      />
                    )}

                    {/* Historical bars (grey) */}
                    <Bar
                      dataKey="real"
                      fill="hsl(var(--muted-foreground) / 0.3)"
                      radius={[4, 4, 0, 0]}
                      name="Real"
                    />

                    {/* Prediction bars (blue translucent) */}
                    <Bar
                      dataKey="pred"
                      fill="hsl(var(--info) / 0.4)"
                      radius={[4, 4, 0, 0]}
                      name="Predicción"
                      cursor="pointer"
                      onClick={(data: any) => handleBarClick(data)}
                    />

                    {/* Actual amount on predicted weeks (solid) */}
                    <Bar
                      dataKey="realPred"
                      fill="hsl(var(--info))"
                      radius={[4, 4, 0, 0]}
                      name="Real (predicho)"
                    />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={diariaChartData}>
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
                    <RechartsTooltip content={<DiariaTooltip />} />

                    {hoyLabelDiaria && (
                      <ReferenceLine
                        x={hoyLabelDiaria}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: 'Hoy', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      />
                    )}

                    <Area
                      type="monotone"
                      dataKey="pred"
                      fill="hsl(var(--info) / 0.1)"
                      stroke="none"
                    />

                    <Line
                      type="monotone"
                      dataKey="real"
                      stroke="hsl(var(--info))"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      name="Real"
                    />

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
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* View toggle */}
        {pred && !sinDatos && (
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg border bg-muted p-1 gap-1">
              <Button
                variant={vista === 'semanal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleVistaChange('semanal')}
                className="gap-1.5"
              >
                <CalendarRange className="w-4 h-4" /> Por semana
              </Button>
              <Button
                variant={vista === 'diaria' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleVistaChange('diaria')}
                className="gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Por día
              </Button>
            </div>
          </div>
        )}

        {/* Predictions table — semanal */}
        {vista === 'semanal' && semanalData && !sinDatos && semanalData.predicciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Predicciones Semanales</CardTitle>
              <CardDescription>Click en una fila para ver el detalle diario de esa semana</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semana</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Predicción</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead className="text-center">Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semanalData.predicciones.map((p) => {
                    const montoReal = p.monto_real !== null ? toNumber(p.monto_real) : null;
                    const montoPred = toNumber(p.monto_pred);
                    const diff = montoReal !== null ? montoReal - montoPred : null;
                    const confianza = toNumber(p.confianza);
                    const weekNum = getWeekNumber(p.semana_inicio);

                    return (
                      <TableRow
                        key={p.semana_inicio}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSemanaSeleccionada(p.semana_inicio);
                          setVista('diaria');
                        }}
                      >
                        <TableCell className="font-medium">Semana {weekNum}</TableCell>
                        <TableCell>{formatSemanaLabel(p.semana_inicio, p.semana_fin)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(montoPred)}</TableCell>
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
                            <span className="text-xs text-muted-foreground w-8">{confianza.toFixed(0)}%</span>
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

        {/* Predictions table — diaria */}
        {vista === 'diaria' && diariaData && !sinDatos && diariaData.predicciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Predicciones Diarias</CardTitle>
              <CardDescription>Pronóstico por día con comparación real cuando está disponible</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Predicción</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead className="text-center">Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diariaData.predicciones.map((p) => {
                    const montoReal = p.monto_real !== null ? toNumber(p.monto_real) : null;
                    const montoPred = toNumber(p.monto_pred);
                    const diff = montoReal !== null ? montoReal - montoPred : null;
                    const confianza = toNumber(p.confianza);

                    return (
                      <TableRow key={p.fecha}>
                        <TableCell className="font-medium">{DIAS_SEMANA_LARGO[p.dia_semana]}</TableCell>
                        <TableCell className="capitalize">{formatFechaCorta(p.fecha)} 2026</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(montoPred)}</TableCell>
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
                            <span className="text-xs text-muted-foreground w-8">{confianza.toFixed(0)}%</span>
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

        {/* Model metrics — only in semanal view */}
        {vista === 'semanal' && metricas && (
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
