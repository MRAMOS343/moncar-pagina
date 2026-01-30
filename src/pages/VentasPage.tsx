import { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { KPICard } from '@/components/ui/kpi-card';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Plus, Download, ShoppingBag, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { LazyLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from '@/components/charts/LazyLineChart';
import { getVentasColumns } from '@/config/tableColumns';
import { User, KPIData, ChartDataPoint, Warehouse } from '../types';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportToCSV } from '@/utils/exportCSV';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { ChartSkeleton } from '@/components/ui/chart-skeleton';
import { KPISkeleton } from '@/components/ui/kpi-skeleton';
import { showSuccessToast, showErrorToast, showInfoToast } from '@/utils/toastHelpers';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSales } from '@/hooks/useSales';
import { useVentasKPIs } from '@/hooks/useVentasKPIs';
import { SaleDetailModal } from '@/components/modals/SaleDetailModal';
import { toNumber, formatCurrency } from '@/utils/formatters';
import type { SaleListItem } from '@/types/sales';

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
  const [includeCancelled, setIncludeCancelled] = useState(false);
  
  // Estado para modal de detalle
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Calcular fecha "from" basado en dateRange
  const fromDate = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case '1d':
        return format(now, 'yyyy-MM-dd');
      case '7d':
        return format(subDays(now, 7), 'yyyy-MM-dd');
      case '30d':
        return format(subDays(now, 30), 'yyyy-MM-dd');
      case '90d':
        return format(subDays(now, 90), 'yyyy-MM-dd');
      default:
        return format(subDays(now, 30), 'yyyy-MM-dd');
    }
  }, [dateRange]);

  // Helper para mostrar texto del período
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
    include_cancelled: includeCancelled,
  });

  // Hook dedicado para KPIs con más datos
  const { 
    data: kpisData, 
    isLoading: isLoadingKPIs 
  } = useVentasKPIs({
    from: fromDate,
    sucursal_id: currentWarehouse === 'all' ? undefined : currentWarehouse,
  });

  // Aplanar páginas de datos con deduplicación defensiva por venta_id
  const salesData = useMemo(() => {
    if (!data?.pages) return [];
    
    const all = data.pages.flatMap(page => page.items);
    
    // Deduplicación defensiva por venta_id
    const seen = new Set<number>();
    const unique = all.filter(item => {
      if (seen.has(item.venta_id)) return false;
      seen.add(item.venta_id);
      return true;
    });
    
    // Ordenar por venta_id descendente (más recientes primero)
    return unique.sort((a, b) => b.venta_id - a.venta_id);
  }, [data]);

  // KPIs desde hook dedicado
  const kpis: KPIData[] = useMemo(() => {
    if (!kpisData) {
      return [
        { label: 'Ventas Totales', value: 0, change: 0, changeType: 'neutral' as const, format: 'currency' as const },
        { label: 'Ticket Promedio', value: 0, change: 0, changeType: 'neutral' as const, format: 'currency' as const },
        { label: 'Transacciones', value: 0, change: 0, changeType: 'neutral' as const }
      ];
    }

    return [
      {
        label: 'Ventas Totales',
        value: kpisData.totalVentas,
        change: 0,
        changeType: 'neutral' as const,
        format: 'currency' as const
      },
      {
        label: 'Ticket Promedio',
        value: kpisData.ticketPromedio,
        change: 0,
        changeType: 'neutral' as const,
        format: 'currency' as const
      },
      {
        label: 'Transacciones',
        value: kpisData.transacciones,
        change: 0,
        changeType: 'neutral' as const,
      }
    ];
  }, [kpisData]);

  // Generar datos para gráfico
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (salesData.length === 0) return [];
    
    const salesByDay: Record<string, number> = {};
    
    salesData.forEach(sale => {
      if (!sale.cancelada && sale.usu_fecha) {
        const day = sale.usu_fecha.split('T')[0];
        salesByDay[day] = (salesByDay[day] || 0) + toNumber(sale.total);
      }
    });

    return Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => {
        const [, month, day] = date.split('-');
        return {
          date: `${day}/${month}`,
          value
        };
      });
  }, [salesData]);

  // Handlers
  const handleViewDetail = useCallback((ventaId: number) => {
    setSelectedSaleId(ventaId);
    setDetailOpen(true);
  }, []);

  const handleCreateSale = () => {
    if (currentUser.role === 'admin' || currentUser.role === 'gerente' || currentUser.role === 'cajero') {
      showInfoToast(
        "Funcionalidad disponible próximamente",
        "El módulo de creación de ventas será implementado en la siguiente versión."
      );
    } else {
      showErrorToast(
        "Acceso denegado",
        "No tienes permisos para crear ventas."
      );
    }
  };

  const handleExportCSV = () => {
    logger.info('Exportación de ventas iniciada', {
      cantidadVentas: salesData.length,
      dateRange
    });
    
    exportToCSV(
      salesData.map(sale => ({
        Folio: sale.folio_numero,
        Fecha: sale.usu_fecha,
        Hora: sale.usu_hora,
        Sucursal: sale.sucursal_id,
        Estado: sale.estado_origen,
        Pagos: sale.pagos_resumen ?? '',
        Subtotal: toNumber(sale.subtotal),
        IVA: toNumber(sale.impuesto),
        Total: toNumber(sale.total),
        Cancelada: sale.cancelada ? 'Sí' : 'No'
      })),
      `ventas_${dateRange}_${new Date().toISOString().split('T')[0]}`
    );
    
    showSuccessToast(
      "Exportación exitosa",
      "Los datos de ventas se han exportado a CSV correctamente."
    );
    
    logger.info('Exportación de ventas completada exitosamente');
  };

  // Columnas de tabla
  const columns = useMemo(() => getVentasColumns(handleViewDetail), [handleViewDetail]);

  // Helper para badge de estado
  const getEstadoBadge = useCallback((estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'CO':
        return <Badge variant="default">Completada</Badge>;
      case 'CA':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado || 'N/A'}</Badge>;
    }
  }, []);

  // Render de card móvil
  const mobileCardRender = useCallback((sale: SaleListItem) => {
    // Formatear fecha de YYYY-MM-DD a DD-MM-YYYY
    const formattedDate = sale.usu_fecha 
      ? sale.usu_fecha.split('-').reverse().join('-') 
      : '';
    
    return (
      <div className="space-y-2" onClick={() => handleViewDetail(sale.venta_id)}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-xs text-muted-foreground">#{sale.venta_id}</p>
            <p className="font-medium text-lg">{formatCurrency(sale.total)}</p>
          </div>
          {getEstadoBadge(sale.estado_origen)}
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{formattedDate} {sale.usu_hora}</p>
          <span>Sucursal: {sale.sucursal_id}</span>
        </div>
      </div>
    );
  }, [handleViewDetail, getEstadoBadge]);

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
        <div className="flex gap-2 self-end sm:self-auto">
          <Button onClick={handleCreateSale} size="sm" className="btn-hover touch-target" aria-label="Crear nueva venta">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Venta</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="btn-hover touch-target" aria-label="Exportar datos de ventas a CSV">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
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

      {/* Selector de período global */}
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingKPIs ? (
          <>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </>
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
      {isLoadingTable ? (
        <ChartSkeleton />
      ) : (
        <Card className="chart-card animate-scale-in card-hover">
          <CardHeader>
            <CardTitle>Tendencia de Ventas</CardTitle>
            <CardDescription>
              Ventas diarias {dateRange === '1d' ? 'de hoy' : `en los últimos ${periodLabel}`}
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
      )}

      {/* Filters */}
      {isMobile ? (
        <Accordion type="single" collapsible defaultValue="filtros">
          <AccordionItem value="filtros">
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-cancelled-mobile" className="text-base font-medium">
                    Incluir canceladas
                  </Label>
                  <Switch 
                    id="include-cancelled-mobile"
                    checked={includeCancelled} 
                    onCheckedChange={setIncludeCancelled} 
                  />
                </div>

                <Button 
                  onClick={() => {
                    setIncludeCancelled(false);
                    setDateRange('30d');
                  }} 
                  variant="outline"
                  className="w-full mobile-button"
                >
                  Limpiar filtros
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Filtros Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch 
                  id="include-cancelled"
                  checked={includeCancelled} 
                  onCheckedChange={setIncludeCancelled} 
                />
                <Label htmlFor="include-cancelled">Incluir ventas canceladas</Label>
              </div>

              {includeCancelled && (
                <Button 
                  onClick={() => setIncludeCancelled(false)} 
                  variant="ghost"
                  size="sm"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              action={{
                label: "Crear Nueva Venta",
                onClick: handleCreateSale
              }}
            />
          ) : (
            <>
              <ResponsiveTable
                data={salesData}
                columns={columns}
                mobileCardRender={mobileCardRender}
                getRowKey={(item) => item.venta_id}
              />
              
              {/* Load more button */}
              {hasNextPage && (
                <div className="p-4 text-center border-t">
                  <Button 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    variant="outline"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Cargando...
                      </>
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

      {/* Modal de detalle */}
      <SaleDetailModal 
        ventaId={selectedSaleId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
