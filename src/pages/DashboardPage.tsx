import { useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "@/components/charts/LazyLineChart";
import { LazyPieChart, Pie, Cell } from "@/components/charts/LazyPieChart";
import { TrendingUp, ShoppingCart, Package, Store, AlertTriangle, Plus, Clock, CreditCard, RefreshCw } from "lucide-react";
import { User, KPIData, Warehouse } from "@/types";
import { ProductModal } from "@/components/modals/ProductModal";
import { COLORES_GRAFICOS } from "@/constants";
import { KPISkeleton } from "@/components/ui/kpi-skeleton";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { SUCCESS_MESSAGES } from "@/constants/messages";
import { toast } from "@/hooks/use-toast";
import { useDashboardSales } from "@/hooks/useDashboardSales";
import { useDashboardPaymentMethods } from "@/hooks/useDashboardPaymentMethods";
import { dashboardKpiService } from "@/services/dashboardKpiService";
import { format, subDays } from "date-fns";
import { formatCurrency } from "@/utils/formatters";

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
  warehouses: Warehouse[];
}

export default function DashboardPage() {
  const { currentWarehouse, currentUser, warehouses } = useOutletContext<ContextType>();
  const navigate = useNavigate();
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Obtener ventas reales de la API (últimos 30 días)
  const { data: salesResult, isLoading, isFetching, refetch } = useDashboardSales({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    sucursal_id: currentWarehouse === 'all' ? undefined : currentWarehouse,
  });

  // Extraer items del resultado (con fallback seguro)
  const salesData = salesResult?.items ?? [];
  const isTruncated = salesResult?.truncated ?? false;
  const totalFetched = salesResult?.totalFetched ?? 0;

  // Determinar si es sucursal específica
  const isSpecificWarehouse = currentWarehouse !== 'all';

  // Obtener métodos de pago solo cuando hay sucursal específica (ahora es síncrono)
  const { 
    data: paymentMethodsData = [], 
    isLoading: paymentMethodsLoading 
  } = useDashboardPaymentMethods(salesData, isSpecificWarehouse);

  // Cálculo de KPIs desde datos reales
  const kpisGlobales = useMemo((): KPIData[] => {
    return dashboardKpiService.calculateKPIs(salesData);
  }, [salesData]);

  // Datos de tendencia de ventas (últimos 15 días)
  const datosTendenciaVentas = useMemo(() => {
    return dashboardKpiService.calculateTrend(salesData, 15);
  }, [salesData]);

  // Ventas por sucursal
  const datosPorSucursal = useMemo(() => {
    return dashboardKpiService.calculateBySucursal(salesData, warehouses);
  }, [salesData, warehouses]);

  // Datos dinámicos para el gráfico circular
  const pieChartData = useMemo(() => {
    return isSpecificWarehouse ? paymentMethodsData : datosPorSucursal;
  }, [isSpecificWarehouse, paymentMethodsData, datosPorSucursal]);

  const pieChartConfig = useMemo(() => ({
    title: isSpecificWarehouse ? "Métodos de Pago" : "Ventas por Sucursal",
    description: isSpecificWarehouse 
      ? "Distribución de pagos por método" 
      : "Distribución de ventas por sucursal",
    icon: isSpecificWarehouse ? CreditCard : Store,
    emptyIcon: isSpecificWarehouse ? CreditCard : Store,
    emptyText: isSpecificWarehouse ? "No hay datos de pagos" : "No hay datos de ventas",
  }), [isSpecificWarehouse]);

  // Últimas ventas recientes
  const ventasRecientes = useMemo(() => {
    return dashboardKpiService.getRecentSales(salesData, 5);
  }, [salesData]);

  const handleNewSale = () => {
    navigate('/dashboard/ventas');
  };

  const handleAddProduct = () => {
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: "Producto creado",
      description: SUCCESS_MESSAGES.PRODUCT_CREATED(productData.nombre),
      className: "bg-success-light dark:bg-success-light border-success dark:border-success",
    });
    setProductModalOpen(false);
  };

  const getWarehouseName = (sucursalId: string) => {
    const warehouse = warehouses.find(w => w.id === sucursalId);
    return warehouse?.nombre?.trim() || sucursalId;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado de la página principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general del sistema - {
              currentWarehouse === 'all' 
                ? 'Todas las Sucursales' 
                : warehouses.find(w => w.id === currentWarehouse)?.nombre || 'Sucursal no encontrada'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="btn-hover"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button onClick={handleNewSale} className="btn-hover">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
          <Button variant="outline" onClick={handleAddProduct} className="btn-hover">
            <Package className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Indicadores clave de rendimiento (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </>
        ) : (
          kpisGlobales.map((kpi, index) => (
            <KPICard key={index} data={kpi} className="animate-fade-in card-hover" />
          ))
        )}
      </div>

      {/* Aviso de datos truncados */}
      {isTruncated && !isLoading && (
        <div className="flex items-center gap-3 p-4 border border-warning/30 rounded-lg bg-warning/10 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Datos parciales ({totalFetched.toLocaleString()} ventas cargadas)
            </p>
            <p className="text-xs text-muted-foreground">
              Los KPIs podrían ser menores a los reales. Considera filtrar por sucursal o reducir el período.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </Button>
        </div>
      )}

      {/* Fila de gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Gráfico de tendencia de ventas */}
            <Card className="card-hover animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendencia de Ventas (15 días)
                </CardTitle>
                <CardDescription>
                  Evolución de las ventas en los últimos 15 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LazyLineChart data={datosTendenciaVentas} height={320}>
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
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      'Ventas'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LazyLineChart>
              </CardContent>
            </Card>

            {/* Gráfico circular dinámico */}
            <Card className="card-hover animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <pieChartConfig.icon className="w-5 h-5" />
                  {pieChartConfig.title}
                </CardTitle>
                <CardDescription>
                  {pieChartConfig.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isSpecificWarehouse && paymentMethodsLoading) ? (
                  <div className="h-[320px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : pieChartData.length > 0 ? (
                  <LazyPieChart height={320}>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={(entry) => {
                        const RADIAN = Math.PI / 180;
                        const { cx, cy, midAngle, outerRadius, name, percentage } = entry;
                        const radius = outerRadius + 30;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="hsl(var(--foreground))"
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            fontSize={12}
                          >
                            {`${name} ${percentage}%`}
                          </text>
                        );
                      }}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES_GRAFICOS[index % COLORES_GRAFICOS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [formatCurrency(value), isSpecificWarehouse ? 'Monto' : 'Ventas']}
                    />
                  </LazyPieChart>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground">
                    <pieChartConfig.emptyIcon className="w-12 h-12 mb-2 opacity-50" />
                    <p>{pieChartConfig.emptyText}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Sección inferior con información adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Recientes (reemplaza Productos más vendidos) */}
        <Card className="card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Ventas Recientes
            </CardTitle>
            <CardDescription>
              Últimas 5 transacciones registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))
              ) : ventasRecientes.length > 0 ? (
                ventasRecientes.map((venta, index) => (
                  <div key={venta.venta_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">Venta #{venta.venta_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {getWarehouseName(venta.sucursal_id)} • {
                            venta.usu_fecha 
                              ? new Date(venta.usu_fecha).toLocaleDateString('es-MX') 
                              : '---'
                          } {venta.usu_hora || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(venta.total)}</p>
                      <p className="text-sm text-muted-foreground">{venta.folio_numero || `#${venta.venta_id}`}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p>No hay ventas recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sistema de alertas */}
        <Card className="card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas del Sistema
            </CardTitle>
            <CardDescription>
              Notificaciones importantes que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Alerta de ventas canceladas */}
              {typeof kpisGlobales[3]?.value === 'number' && kpisGlobales[3].value > 0 && (
                <div className="flex items-center gap-3 p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ventas Canceladas</p>
                    <p className="text-xs text-muted-foreground">
                      {kpisGlobales[3].value} ventas canceladas en los últimos 30 días
                    </p>
                  </div>
                  <Badge variant="destructive">Revisar</Badge>
                </div>
              )}
              
              {salesData.length === 0 && !isLoading && (
                <div className="flex items-center gap-3 p-3 border border-warning/20 rounded-lg bg-warning/5">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sin Ventas</p>
                    <p className="text-xs text-muted-foreground">
                      No hay ventas registradas en los últimos 30 días
                    </p>
                  </div>
                  <Badge variant="warning">Info</Badge>
                </div>
              )}

              {salesData.length > 0 && (
                <div className="flex items-center gap-3 p-3 border border-info/20 rounded-lg bg-info/5">
                  <TrendingUp className="w-5 h-5 text-info" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Actividad Registrada</p>
                    <p className="text-xs text-muted-foreground">
                      {salesData.filter(s => !s.cancelada).length} ventas activas en los últimos 30 días
                    </p>
                  </div>
                  <Badge variant="info">Good</Badge>
                </div>
              )}

              {salesData.length === 0 && isLoading && (
                <div className="h-20 bg-muted animate-pulse rounded-lg" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Modal */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={null}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
