import { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  TrendingUp, TrendingDown, Minus, PackageOpen,
  DollarSign, CalendarDays, ArrowLeft, Star, Info, ChevronDown, RefreshCw,
} from 'lucide-react';
import { ResponsiveContainer } from '@/components/charts/LazyLineChart';
import {
  Bar, ComposedChart, XAxis, YAxis, CartesianGrid,
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

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatMontoAbrev(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
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

  const [drillDown, setDrillDown] = useState<{ inicio: string; fin: string } | null>(null);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('todas');
  const [horizonWeeks, setHorizonWeeks] = useState<4 | 8>(4);
  const [recalculating, setRecalculating] = useState(false);

  const sucursalParam = selectedSucursal === 'todas' ? undefined : selectedSucursal;

  // Main semanal query
  const {
    data: semanalPred,
    isLoading: semanalLoading,
    isError: semanalError,
  } = usePrediccion('semanal', sucursalParam, 12);

  // Drill-down diaria query
  const {
    data: diariaPred,
    isLoading: diariaLoading,
  } = usePrediccion('diaria', sucursalParam, 7);

  const semanalData = semanalPred?.vista === 'semanal' ? semanalPred as PrediccionSemanalResponse : null;
  const diariaData = diariaPred?.vista === 'diaria' ? diariaPred as PrediccionDiariaResponse : null;

  const kpis = semanalData?.kpis;
  const sinDatos = semanalPred?.sin_datos;

  /* ── KPI: Esta semana / Próxima semana ── */
  const estaSemana = semanalData?.predicciones?.[0];
  const proximaSemana = semanalData?.predicciones?.[1];

  /* ── KPI: Tendencia % ── */
  const tendenciaPct = useMemo(() => {
    if (!semanalData?.historial || semanalData.historial.length < 8) return null;
    const hist = semanalData.historial;
    const last4 = hist.slice(-4);
    const prev4 = hist.slice(-8, -4);
    const avgLast = last4.reduce((s, h) => s + toNumber(h.monto), 0) / 4;
    const avgPrev = prev4.reduce((s, h) => s + toNumber(h.monto), 0) / 4;
    if (avgPrev === 0) return null;
    return ((avgLast - avgPrev) / avgPrev * 100);
  }, [semanalData]);

  /* ── KPI: Mejor día ── */
  const mejorDia = useMemo(() => {
    if (!semanalData?.historial) {
      // Try diaria data
      if (!diariaData?.historial?.length) return null;
      const sums: Record<number, { total: number; count: number }> = {};
      diariaData.historial.forEach((h) => {
        const dw = h.dia_semana;
        if (!sums[dw]) sums[dw] = { total: 0, count: 0 };
        sums[dw].total += toNumber(h.monto);
        sums[dw].count += 1;
      });
      let best = { dia: 0, avg: 0 };
      Object.entries(sums).forEach(([k, v]) => {
        const avg = v.total / v.count;
        if (avg > best.avg) best = { dia: Number(k), avg };
      });
      return best.avg > 0 ? best : null;
    }
    // Use diaria data for day-level granularity - need to fetch separately
    if (!diariaData?.historial?.length) return null;
    const sums: Record<number, { total: number; count: number }> = {};
    diariaData.historial.forEach((h) => {
      const dw = h.dia_semana;
      if (!sums[dw]) sums[dw] = { total: 0, count: 0 };
      sums[dw].total += toNumber(h.monto);
      sums[dw].count += 1;
    });
    let best = { dia: 0, avg: 0 };
    Object.entries(sums).forEach(([k, v]) => {
      const avg = v.total / v.count;
      if (avg > best.avg) best = { dia: Number(k), avg };
    });
    return best.avg > 0 ? best : null;
  }, [semanalData, diariaData]);

  /* ── Chart data (semanal) ── */
  const semanalChartData = useMemo(() => {
    if (!semanalData) return [];
    const hoy = new Date().toISOString().split('T')[0];
    const points: any[] = [];

    semanalData.historial.forEach((h) => {
      points.push({
        key: h.semana_inicio,
        label: `Sem ${getWeekNumber(h.semana_inicio)}`,
        displayLabel: formatSemanaLabel(h.semana_inicio, h.semana_fin),
        real: toNumber(h.monto),
        numVentas: toNumber(h.num_ventas),
        semana_inicio: h.semana_inicio,
        semana_fin: h.semana_fin,
        isPast: true,
        type: 'historial',
      });
    });

    semanalData.predicciones.slice(0, horizonWeeks).forEach((p) => {
      const existing = points.find((pt) => pt.key === p.semana_inicio);
      if (existing) {
        existing.pred = toNumber(p.monto_pred);
        if (p.monto_real !== null) existing.realPred = toNumber(p.monto_real);
      } else {
        points.push({
          key: p.semana_inicio,
          label: formatSemanaLabel(p.semana_inicio, p.semana_fin),
          displayLabel: formatSemanaLabel(p.semana_inicio, p.semana_fin),
          pred: toNumber(p.monto_pred),
          realPred: p.monto_real !== null ? toNumber(p.monto_real) : undefined,
          semana_inicio: p.semana_inicio,
          semana_fin: p.semana_fin,
          isPast: false,
          type: 'prediccion',
        });
      }
    });

    return points.sort((a, b) => a.key.localeCompare(b.key));
  }, [semanalData, horizonWeeks]);

  /* ── "Hoy" reference line ── */
  const hoyStr = new Date().toISOString().split('T')[0];
  const hoyLabel = useMemo(() => {
    const match = semanalChartData.find(
      (d) => d.semana_inicio <= hoyStr && d.semana_fin >= hoyStr
    );
    return match?.label;
  }, [semanalChartData, hoyStr]);

  /* ── Promedio histórico line ── */
  const promedioHistorico = kpis ? toNumber(kpis.promedio_semanal) : 0;

  /* ── Day-of-week data ── */
  const dayOfWeekData = useMemo(() => {
    if (!diariaData?.historial?.length) return [];
    const sums: Record<number, { total: number; count: number }> = {};
    diariaData.historial.forEach((h) => {
      const dw = h.dia_semana;
      if (!sums[dw]) sums[dw] = { total: 0, count: 0 };
      sums[dw].total += toNumber(h.monto);
      sums[dw].count += 1;
    });

    // Build array for Mon(1) to Sun(0)
    const order = [1, 2, 3, 4, 5, 6, 0]; // Lun to Dom
    const results = order.map((dw) => {
      const s = sums[dw];
      const avg = s ? s.total / s.count : 0;
      return { dia: dw, nombre: DIAS_SEMANA[dw], avg };
    });
    const maxAvg = Math.max(...results.map((r) => r.avg));
    const minAvg = Math.min(...results.filter(r => r.avg > 0).map((r) => r.avg));
    const bestDia = results.find(r => r.avg === maxAvg);
    const worstDia = results.filter(r => r.avg > 0).find(r => r.avg === minAvg);

    return results.map((r) => ({
      ...r,
      pct: maxAvg > 0 ? (r.avg / maxAvg) * 100 : 0,
      isBest: r.dia === bestDia?.dia,
      isWorst: r.dia === worstDia?.dia && r.avg > 0,
      noOps: r.avg === 0,
    }));
  }, [diariaData]);

  /* ── Drill-down data ── */
  const drillDownData = useMemo(() => {
    if (!drillDown || !diariaData) return [];
    const { inicio, fin } = drillDown;
    const items = diariaData.predicciones
      .filter((p) => p.fecha >= inicio && p.fecha <= fin)
      .map((p) => ({
        fecha: p.fecha,
        dia: DIAS_CORTO[p.dia_semana],
        diaLargo: DIAS_SEMANA[p.dia_semana],
        label: `${DIAS_CORTO[p.dia_semana]} ${formatFechaCorta(p.fecha)}`,
        monto: toNumber(p.monto_pred),
      }));
    return items;
  }, [drillDown, diariaData]);

  const drillDownTotal = drillDownData.reduce((s, d) => s + d.monto, 0);
  const drillDownMax = Math.max(...drillDownData.map(d => d.monto), 1);

  /* ── Handlers ── */
  const handleBarClick = useCallback((data: any) => {
    if (data?.semana_inicio && data?.type === 'prediccion') {
      setDrillDown({ inicio: data.semana_inicio, fin: data.semana_fin });
    }
  }, []);

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

  /* ── Tooltip ── */
  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const isPred = d?.type === 'prediccion';
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-xl">
        <p className="font-medium">
          Semana del {formatFechaCorta(d?.semana_inicio)} al {formatFechaCorta(d?.semana_fin)}
        </p>
        {d?.real !== undefined && (
          <p className="text-foreground">{formatCurrency(d.real)}</p>
        )}
        {d?.pred !== undefined && (
          <p className="text-muted-foreground">
            {formatCurrency(d.pred)} <span className="text-xs">(estimado)</span>
          </p>
        )}
        {d?.numVentas !== undefined && (
          <p className="text-muted-foreground text-xs">{d.numVentas} ventas</p>
        )}
      </div>
    );
  };

  const isLoading = semanalLoading;

  /* ── Drill-down view ── */
  if (drillDown) {
    return (
      <main role="main" aria-label="Detalle semanal">
        <div className="space-y-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDrillDown(null)}
              className="gap-1 -ml-2 text-muted-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Semana del {formatFechaCorta(drillDown.inicio)} al {formatFechaCorta(drillDown.fin)}
            </h1>
          </div>

          {diariaLoading ? (
            <Card>
              <CardContent className="pt-6 space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : drillDownData.length > 0 ? (
            <Card>
              <CardContent className="pt-6 space-y-3">
                {drillDownData.map((d) => (
                  <div key={d.fecha} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24 shrink-0 text-foreground capitalize">
                      {d.label}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all duration-500"
                        style={{ width: `${(d.monto / drillDownMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono font-medium text-foreground w-28 text-right">
                      {formatCurrency(d.monto)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(drillDownTotal)}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay datos de predicción para esta semana.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    );
  }

  /* ── Main view ── */
  return (
    <main role="main" aria-label="Predicción de ventas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Predicción de Ventas</h1>
            <p className="text-muted-foreground">
              Estimaciones basadas en tu historial de ventas
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
          </div>
        </div>

        {/* 4 KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : kpis && !sinDatos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Esta semana */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Esta semana</p>
                    <p className="text-2xl font-bold text-foreground">
                      {estaSemana ? formatCurrency(toNumber(estaSemana.monto_pred)) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Estimado de ventas esta semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próxima semana */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Próxima semana</p>
                    <p className="text-2xl font-bold text-foreground">
                      {proximaSemana ? formatCurrency(toNumber(proximaSemana.monto_pred)) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Estimado de ventas la próxima semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tendencia */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    {kpis.tendencia === 'subiendo' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : kpis.tendencia === 'bajando' ? (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    ) : (
                      <Minus className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tendencia</p>
                    <p className={`text-2xl font-bold ${
                      kpis.tendencia === 'subiendo' ? 'text-green-600' :
                      kpis.tendencia === 'bajando' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {kpis.tendencia === 'subiendo' ? '📈 Creciendo' :
                       kpis.tendencia === 'bajando' ? '📉 Bajando' :
                       '➡️ Estable'}
                    </p>
                    {tendenciaPct !== null && (
                      <p className="text-xs text-muted-foreground">
                        {tendenciaPct >= 0 ? '+' : ''}{tendenciaPct.toFixed(1)}% vs mes anterior
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mejor día */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mejor día de la semana</p>
                    <p className="text-2xl font-bold text-foreground">
                      {mejorDia ? DIAS_SEMANA[mejorDia.dia] : '—'}
                    </p>
                    {mejorDia && (
                      <p className="text-xs text-muted-foreground">
                        Promedio de {formatCurrency(mejorDia.avg)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* sin_datos / error states */}
        {!isLoading && sinDatos && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aún no hay suficiente historial</h3>
              <p className="text-muted-foreground max-w-lg">
                El sistema necesita al menos 2 semanas de ventas registradas para generar estimaciones.
              </p>
            </CardContent>
          </Card>
        )}

        {semanalError && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error al cargar predicciones</h3>
              <p className="text-muted-foreground">Verifica tu conexión e intenta de nuevo.</p>
            </CardContent>
          </Card>
        )}

        {/* Main Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : semanalData && !sinDatos && semanalChartData.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle>Ventas por Semana</CardTitle>
                <div className="inline-flex rounded-lg border bg-muted p-1 gap-1">
                  <Button
                    variant={horizonWeeks === 4 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHorizonWeeks(4)}
                  >
                    4 semanas
                  </Button>
                  <Button
                    variant={horizonWeeks === 8 ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHorizonWeeks(8)}
                  >
                    8 semanas
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Barras grises: ventas reales · Barras azules: estimación · Click en una barra azul para ver el detalle diario
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={semanalChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  <RechartsTooltip content={<ChartTooltip />} />

                  {/* Promedio histórico line */}
                  {promedioHistorico > 0 && (
                    <ReferenceLine
                      y={promedioHistorico}
                      stroke="hsl(var(--destructive))"
                      strokeWidth={1}
                      strokeDasharray="6 3"
                      label={{
                        value: `Promedio ${formatMontoAbrev(promedioHistorico)}`,
                        position: 'right',
                        fill: 'hsl(var(--destructive))',
                        fontSize: 10,
                      }}
                    />
                  )}

                  {/* "Hoy" separator */}
                  {hoyLabel && (
                    <ReferenceLine
                      x={hoyLabel}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{ value: 'Hoy', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                  )}

                  {/* Historical bars (grey) */}
                  <Bar
                    dataKey="real"
                    fill="hsl(var(--muted-foreground) / 0.35)"
                    radius={[4, 4, 0, 0]}
                    name="Real"
                  />

                  {/* Prediction bars (blue translucent) */}
                  <Bar
                    dataKey="pred"
                    fill="hsl(var(--primary) / 0.5)"
                    radius={[4, 4, 0, 0]}
                    name="Estimado"
                    cursor="pointer"
                    onClick={(data: any) => handleBarClick(data)}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {/* Reliability note */}
        {semanalData && !sinDatos && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Info className="w-3.5 h-3.5" />
                Las estimaciones se basan en el historial de ventas. A mayor historial, mayor precisión.
                <ChevronDown className="w-3 h-3" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <p className="text-xs text-muted-foreground max-w-xl">
                El sistema analiza tus ventas pasadas para identificar patrones y generar estimaciones.
                Mientras más semanas de datos tenga disponibles, más precisas serán las proyecciones.
              </p>
              {currentUser.role === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={recalculating}
                  onClick={handleRecalcular}
                  className="gap-2 mt-2 text-xs text-muted-foreground"
                >
                  <RefreshCw className={`w-3 h-3 ${recalculating ? 'animate-spin' : ''}`} />
                  {recalculating ? 'Recalculando…' : 'Actualizar predicciones'}
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Day of week section */}
        {diariaLoading && !drillDown ? (
          <Card>
            <CardHeader><CardTitle>¿Qué días vendo más?</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : dayOfWeekData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>¿Qué días vendo más?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {dayOfWeekData.map((d) => (
                <div key={d.dia} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24 shrink-0 text-foreground">
                    {d.nombre}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                    {!d.noOps && (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          d.isBest ? 'bg-primary' : 'bg-primary/40'
                        }`}
                        style={{ width: `${d.pct}%` }}
                      />
                    )}
                  </div>
                  <span className="text-sm font-mono w-28 text-right text-foreground">
                    {d.noOps ? (
                      <span className="text-muted-foreground text-xs">Sin operaciones</span>
                    ) : (
                      formatCurrency(d.avg)
                    )}
                  </span>
                  <div className="w-24">
                    {d.isBest && (
                      <Badge variant="default" className="text-xs gap-1">
                        <Star className="w-3 h-3" /> Mejor día
                      </Badge>
                    )}
                    {d.isWorst && !d.isBest && (
                      <Badge variant="secondary" className="text-xs">
                        Menor venta
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
