import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';
import { LazyLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from '@/components/charts/LazyLineChart';
import { formatCurrency } from '@/utils/formatters';
import type { ChartDayPoint } from '@/hooks/useVentasKPIs';

interface Props {
  chartData: ChartDayPoint[];
  isLoading: boolean;
  periodLabel: string;
  isToday: boolean;
}

export function VentasChart({ chartData, isLoading, periodLabel, isToday }: Props) {
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
          <LazyLineChart data={chartData} height={320}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Ventas']}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
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
