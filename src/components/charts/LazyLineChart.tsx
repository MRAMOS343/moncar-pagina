import React, { Suspense, memo } from 'react';

// Lazy load recharts module
const RechartsLineChart = React.lazy(() => 
  import('recharts').then(module => ({ 
    default: module.LineChart 
  }))
);

const RechartsResponsiveContainer = React.lazy(() => 
  import('recharts').then(module => ({ 
    default: module.ResponsiveContainer 
  }))
);

// Re-export components for external use (these are still eagerly loaded for JSX children)
export { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LazyLineChartProps {
  data: any[];
  height?: number | string;
  children?: React.ReactNode;
  [key: string]: any;
}

// Skeleton placeholder while loading
const ChartPlaceholder = memo(({ height }: { height: number | string }) => (
  <div 
    style={{ width: '100%', height }} 
    className="bg-muted/30 animate-pulse rounded-lg flex items-center justify-center"
  >
    <span className="text-muted-foreground text-sm">Cargando gráfico...</span>
  </div>
));

ChartPlaceholder.displayName = 'ChartPlaceholder';

// Main component wrapped with memo for performance
export const LazyLineChart = memo(function LazyLineChart({ 
  children, 
  data, 
  height = 320, 
  ...rest 
}: LazyLineChartProps) {
  return (
    <Suspense fallback={<ChartPlaceholder height={height} />}>
      <RechartsResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} {...rest}>
          {children}
        </RechartsLineChart>
      </RechartsResponsiveContainer>
    </Suspense>
  );
});
