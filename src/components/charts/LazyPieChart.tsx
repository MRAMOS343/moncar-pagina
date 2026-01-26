import React, { memo } from 'react';
import { PieChart, ResponsiveContainer, Pie, Cell, Tooltip } from 'recharts';

// Re-export components for external use
export { Pie, Cell, Tooltip, ResponsiveContainer };

interface LazyPieChartProps {
  children?: React.ReactNode;
  height?: number;
  [key: string]: any;
}

// Skeleton placeholder while loading
const ChartPlaceholder = memo(({ height }: { height: number }) => (
  <div 
    style={{ width: '100%', height }} 
    className="bg-muted/30 animate-pulse rounded-lg flex items-center justify-center"
  >
    <span className="text-muted-foreground text-sm">Cargando gráfico...</span>
  </div>
));

ChartPlaceholder.displayName = 'ChartPlaceholder';

// Main component wrapped with memo for performance
export const LazyPieChart = memo(function LazyPieChart({ 
  children, 
  height = 320, 
  ...props 
}: LazyPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart {...props}>
        {children}
      </PieChart>
    </ResponsiveContainer>
  );
});
