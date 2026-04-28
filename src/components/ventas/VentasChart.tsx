import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';
import { LazyLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from '@/components/charts/LazyLineChart';
import { formatCurrency } from '@/utils/formatters';
import { safeMax } from '@/utils/math';
import { useDashboardTendencia } from '@/hooks/useDashboardHooks';

interface Props {
  sucursalId?: string;
  dias: number;
  periodLabel: string;
  isToday: boolean;
}

export function VentasChart({ sucursalId, dias, periodLabel, isToday }: Props) {
  const { data: tendencia, isLoading } = useDashboardTendencia(sucursalId, dias);

  const chartData = useMemo(() => {
    const raw = tendencia?.data ?? [];
    if (raw.length === 0) return [];

    const dataMap = new Map(raw.map((item) => [item.fecha, item]));
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dias + 1);

    const result: { date: string; value: number; num_ventas: number; fullDate: string }[] = [];
    const cursor = new Date(startDate);

    while (cursor <= today) {
      const iso = cursor.toISOString().split('T')[0];
      const [, m, d] = iso.split('-');
      const existing = dataMap.get(iso);
      result.push({
        date: `${d}/${m}`,
        value: existing ? Number(existing.total) : 0,
        num_ventas: existing ? Number(existing.num_ventas) : 0,
        fullDate: iso,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [tendencia?.data, dias]);

  const yAxisMax = useMemo(() => {
    if (chartData.length === 0) return 1000;
    const maxVal = safeMax(chartData.map((d) => d.value));
    if (maxVal === 0) return 1000;
    return Math.ceil((maxVal * 1.15) / 100) * 100;
  }, [chartData]);

  if (isLoading) return <ChartSkeleton />;

  return (
    <Card className="chart-card animate-scale-in card-hover">
      <CardHeader>
        <CardTitle>Tendencia de Ventas</CardTitle>
        <CardDescription>
          Ventas diarias {isToday ? 'de hoy' : `en los últimos ${periodLabel}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <LazyLineChart data={chartData} height={320} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-muted-foreground"
              interval={0}
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis className="text-muted-foreground" domain={[0, yAxisMax]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Ventas']}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload;
                if (!item) return label;
                return `${label} — ${item.num_ventas} transacciones`;
              }}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
            />
          </LazyLineChart>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
