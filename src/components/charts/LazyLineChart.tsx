import React, { Suspense, memo } from 'react';
import { LineChart, ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Re-export components for external use
export { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer };

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
  // Validación de datos
  if (!data || !Array.isArray(data)) {
    return <ChartPlaceholder height={height} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} {...rest}>
        {children}
      </LineChart>
    </ResponsiveContainer>
  );
});
