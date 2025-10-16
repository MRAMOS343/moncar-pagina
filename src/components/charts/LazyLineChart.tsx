import { lazy, Suspense } from 'react';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';

const LineChart = lazy(() => import('recharts').then(mod => ({ default: mod.LineChart })));
const Line = lazy(() => import('recharts').then(mod => ({ default: mod.Line })));
const XAxis = lazy(() => import('recharts').then(mod => ({ default: mod.XAxis })));
const YAxis = lazy(() => import('recharts').then(mod => ({ default: mod.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })));

interface LazyLineChartProps {
  data: any[];
  height?: number | string; // height for the responsive container
  children?: React.ReactNode;
  [key: string]: any;
}

export function LazyLineChart({ children, data, height = 320, ...rest }: LazyLineChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} {...rest}>
          {children}
        </LineChart>
      </ResponsiveContainer>
    </Suspense>
  );
}

export { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer };
