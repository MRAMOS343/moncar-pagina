import { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { getVentasColumns } from '@/config/tableColumns';
import { User, KPIData, Warehouse } from '../types';
import { format, subDays } from 'date-fns';
import type { SaleListItem } from '@/types/sales';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { KPISkeleton } from '@/components/ui/kpi-skeleton';

import { useSales } from '@/hooks/useSales';
import { useVentasKPIs } from '@/hooks/useVentasKPIs';
import { SaleDetailModal } from '@/components/modals/SaleDetailModal';
import { formatCurrency } from '@/utils/formatters';

// Extracted components
import { VentasReportDownload } from '@/components/ventas/VentasReportDownload';
import { VentasChart } from '@/components/ventas/VentasChart';
import { VentasFilters } from '@/components/ventas/VentasFilters';

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
  warehouses: Warehouse[];
}

export default function VentasPage() {
  const { currentWarehouse, currentUser, warehouses } = useOutletContext<ContextType>();
  const isMobile = useIsMobile();

  // Estados para filtros
  const [dateRange, setDateRange] = useState<string>('30d');
  const [showOnlyCancelled, setShowOnlyCancelled] = useState(false);

  // Estado para modal de detalle
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Calcular fecha "from" basado en dateRange
  const fromDate = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case '1d': return format(now, 'yyyy-MM-dd');
      case '7d': return format(subDays(now, 7), 'yyyy-MM-dd');
      case '30d': return format(subDays(now, 30), 'yyyy-MM-dd');
      case '90d': return format(subDays(now, 90), 'yyyy-MM-dd');
      default: return format(subDays(now, 30), 'yyyy-MM-dd');
    }
  }, [dateRange]);

  const periodLabel = useMemo(() => {
    switch (dateRange) {
      case '1d': return 'Hoy';
      case '7d': return '7 días';
      case '30d': return '30 días';
      case '90d': return '90 días';
      default: return '30 días';
    }
  }, [dateRange]);

  // Hook para obtener ventas desde API real (para tabla)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTable,
    error,
    refetch
  } = useSales({
    from: fromDate,
    sucursal_id: currentWarehouse === 'all' ? undefined : currentWarehouse,
    include_cancelled: showOnlyCancelled ? true : false,
  });

  // Hook dedicado para KPIs + chart data (hasta 5000 items)
  const {
    data: kpisData,
    isLoading: isLoadingKPIs
  } = useVentasKPIs({
    from: fromDate,
    sucursal_id: currentWarehouse === 'all' ? undefined : currentWarehouse,
  });

  // Aplanar páginas de datos con deduplicación defensiva
  const salesData = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap(page => page.items);
    const seen = new Set<number>();
    return all
      .filter(item => {
        if (seen.has(item.venta_id)) return false;
        seen.add(item.venta_id);
        return true;
      })
      .sort((a, b) => b.venta_id - a.venta_id);
  }, [data]);

  // KPIs
  const kpis: KPIData[] = useMemo(() => {
    if (!kpisData) {
      return [
        { label: 'Ventas Totales', value: 0, change: 0, changeType: 'neutral' as const, format: 'currency' as const },
        { label: 'Ticket Promedio', value: 0, change: 0, changeType: 'neutral' as const, format: 'currency' as const },
        { label: 'Transacciones', value: 0, change: 0, changeType: 'neutral' as const }
      ];
    }
    return [
      { label: 'Ventas Totales', value: kpisData.totalVentas, change: 0, changeType: 'neutral' as const, format: 'currency' as const },
      { label: 'Ticket Promedio', value: kpisData.ticketPromedio, change: 0, changeType: 'neutral' as const, format: 'currency' as const },
      { label: 'Transacciones', value: kpisData.transacciones, change: 0, changeType: 'neutral' as const }
    ];
  }, [kpisData]);

  // Handlers
  const handleViewDetail = useCallback((ventaId: number) => {
    setSelectedSaleId(ventaId);
    setDetailOpen(true);
  }, []);

  const columns = useMemo(() => getVentasColumns(handleViewDetail), [handleViewDetail]);

  // Mobile card render — reuse badge logic from tableColumns
  const mobileCardRender = useCallback((sale: SaleListItem) => {
    const formattedDate = sale.usu_fecha
      ? sale.usu_fecha.split('-').reverse().join('-')
      : '';
    const estadoLabel = sale.estado_origen?.toUpperCase() === 'CO' ? 'Completada'
      : sale.estado_origen?.toUpperCase() === 'CA' ? 'Cancelada'
      : sale.estado_origen || 'N/A';
    const estadoVariant = sale.estado_origen?.toUpperCase() === 'CO' ? 'default' as const
      : sale.estado_origen?.toUpperCase() === 'CA' ? 'destructive' as const
      : 'outline' as const;

    return (
      <div className="space-y-2" onClick={() => handleViewDetail(sale.venta_id)}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-xs text-muted-foreground">#{sale.venta_id}</p>
            <p className="font-medium text-lg">{formatCurrency(sale.total)}</p>
          </div>
          <Badge variant={estadoVariant}>{estadoLabel}</Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{formattedDate} {sale.usu_hora}</p>
          <span>Sucursal: {sale.sucursal_id}</span>
        </div>
      </div>
    );
  }, [handleViewDetail]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Registro de ventas en {
              currentWarehouse === 'all'
                ? 'Todas las Sucursales'
                : warehouses.find(w => w.id === currentWarehouse)?.nombre?.trim() || currentWarehouse
            }
          </p>
        </div>
        <VentasReportDownload currentWarehouse={currentWarehouse} />
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Error al cargar ventas: {error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Period selector + filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Hoy</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <VentasFilters
          showOnlyCancelled={showOnlyCancelled}
          setShowOnlyCancelled={setShowOnlyCancelled}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingKPIs ? (
          <><KPISkeleton /><KPISkeleton /><KPISkeleton /></>
        ) : (
          kpis.map((kpi, index) => (
            <KPICard key={index} data={kpi} className="animate-fade-in" />
          ))
        )}
      </div>
      {kpisData?.truncated && (
        <p className="text-xs text-muted-foreground text-center -mt-2">
          * KPIs basados en {kpisData.transacciones.toLocaleString()} ventas activas de un total de {kpisData.totalItems.toLocaleString()} registros
        </p>
      )}

      {/* Chart */}
      <VentasChart
        chartData={kpisData?.chartData ?? []}
        isLoading={isLoadingKPIs}
        periodLabel={periodLabel}
        isToday={dateRange === '1d'}
      />

      {/* Sales Table */}
      <Card className="data-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro de Ventas</CardTitle>
              <CardDescription>
                {salesData.length} ventas encontradas
                {hasNextPage && ' (hay más disponibles)'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingTable ? (
            <TableSkeleton rows={10} columns={8} />
          ) : salesData.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No hay ventas registradas"
              description="No se encontraron ventas que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda."
            />
          ) : (
            <>
              <ResponsiveTable
                data={salesData}
                columns={columns}
                mobileCardRender={mobileCardRender}
                getRowKey={(item) => item.venta_id}
              />
              {hasNextPage && (
                <div className="p-4 text-center border-t">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                  >
                    {isFetchingNextPage ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Cargando...</>
                    ) : (
                      'Cargar más ventas'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      <SaleDetailModal
        ventaId={selectedSaleId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
