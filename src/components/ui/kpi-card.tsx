import { cn } from "@/lib/utils";
import { KPIData } from "../../types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
interface KPICardProps {
  data: KPIData;
  className?: string;
}
export function KPICard({
  data,
  className
}: KPICardProps) {
  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('es-MX').format(value);
    }
  };
  const getChangeIcon = () => {
    if (!data.change) return null;
    switch (data.changeType) {
      case 'positive':
        return;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };
  const getChangeColorClass = () => {
    switch (data.changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };
  return <div className={cn("kpi-card", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {data.label}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatValue(data.value, data.format)}
          </p>
        </div>
        {data.change !== undefined && <div className={cn("flex items-center gap-1 text-sm", getChangeColorClass())}>
            {getChangeIcon()}
            
          </div>}
      </div>
    </div>;
}