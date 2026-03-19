import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LazyLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "@/components/charts/LazyLineChart";
import { LazyPieChart, Pie, Cell } from "@/components/charts/LazyPieChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, ShoppingCart, Package, AlertTriangle, Plus, CreditCard, RefreshCw, Trophy } from "lucide-react";
import { User, KPIData, Warehouse } from "@/types";
import { ProductModal } from "@/components/modals/ProductModal";
import { COLORES_GRAFICOS } from "@/constants";
import { KPISkeleton } from "@/components/ui/kpi-skeleton";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { SUCCESS_MESSAGES } from "@/constants/messages";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { format, subDays } from "date-fns";
import {
  useDashboardKpis,
  useDashboardTendencia,
  useDashboardMetodosPago,
  useDashboardTopProductos,
} from "@/hooks/useDashboardHooks";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
  warehouses: Warehouse[];
}

export default function DashboardPage() {
  const { currentWarehouse, currentUser, warehouses } = useOutletContext<ContextType>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<string>("30d");
  const [tendenciaDias, setTendenciaDias] = useState<number>(15);

  const sucursalId = currentWarehouse === "all" ? undefined : currentWarehouse;

  // Calcular desde/hasta basado en el período
  const desde = (() => {
    if (dateRange === "all") return undefined;
    const now = new Date();
    switch (dateRange) {
      case "1d": return format(now, "yyyy-MM-dd");
      case "7d": return format(subDays(now, 7), "yyyy-MM-dd");
      case "30d": return format(subDays(now, 30), "yyyy-MM-dd");
      case "90d": return format(subDays(now, 90), "yyyy-MM-dd");
      case "365d": return format(subDays(now, 365), "yyyy-MM-dd");
      default: return format(subDays(now, 30), "yyyy-MM-dd");
    }
  })();

  const periodLabel = (() => {
    switch (dateRange) {
      case "1d": return "hoy";
      case "7d": return "últimos 7 días";
      case "30d": return "últimos 30 días";
      case "90d": return "últimos 90 días";
      case "365d": return "último año";
      case "all": return "histórico completo";
      default: return "últimos 30 días";
    }
  })();

  // Invalidar todo el dashboard al cambiar sucursal
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [currentWarehouse, queryClient]);

  // 4 hooks independientes
  const kpis = useDashboardKpis(sucursalId, desde);
  const tendencia = useDashboardTendencia(sucursalId, tendenciaDias);
  const metodosPago = useDashboardMetodosPago(sucursalId, desde);
  const topProductos = useDashboardTopProductos(sucursalId, desde);

  const isFetching = kpis.isFetching || tendencia.isFetching || metodosPago.isFetching || topProductos.isFetching;

  // Mapear KPIs del backend a KPIData[]
  const kpisData: KPIData[] = kpis.data
    ? [
        { label: "Ventas Totales", value: kpis.data.ventas_totales, format: "currency", change: 0, changeType: "neutral" },
        { label: "Transacciones", value: kpis.data.num_transacciones, format: "number", change: 0, changeType: "neutral" },
        { label: "Ticket Promedio", value: kpis.data.ticket_promedio, format: "currency", change: 0, changeType: "neutral" },
        { label: "Ventas Canceladas", value: kpis.data.ventas_canceladas, format: "number", change: 0, changeType: kpis.data.ventas_canceladas > 0 ? "negative" : "neutral" },
      ]
    : [];

  // Datos de tendencia formateados para el chart — rellenar días sin ventas con 0
  const tendenciaChartData = useMemo(() => {
    const raw = tendencia.data?.data ?? [];
    if (raw.length === 0) return [];

    // Crear mapa de datos existentes
    const dataMap = new Map(raw.map((item) => [item.fecha, item]));

    // Generar rango completo de días
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - tendenciaDias + 1);

    const result: { date: string; value: number; num_ventas: number; fullDate: string }[] = [];
    const cursor = new Date(startDate);

    while (cursor <= today) {
      const iso = cursor.toISOString().split("T")[0]; // YYYY-MM-DD
      const [, m, d] = iso.split("-");
      const existing = dataMap.get(iso);
      result.push({
        date: `${d}/${m}`,
        value: existing ? existing.total : 0,
        num_ventas: existing ? existing.num_ventas : 0,
        fullDate: iso,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [tendencia.data?.data, tendenciaDias]);

  // Datos del pie chart (métodos de pago)
  const pieChartData = (metodosPago.data?.data ?? []).map((item) => ({
    name: item.metodo,
    value: Number(item.total),
    count: item.num_pagos,
    percentage: Number(item.porcentaje).toFixed(1),
  }));

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleNewSale = () => navigate("/refaccionarias/ventas");
  const handleAddProduct = () => setProductModalOpen(true);

  const handleSaveProduct = async (productData: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: "Producto creado",
      description: SUCCESS_MESSAGES.PRODUCT_CREATED(productData.nombre),
      className: "bg-success-light dark:bg-success-light border-success dark:border-success",
    });
    setProductModalOpen(false);
  };

  /** Sección con manejo de error inline */
  const ErrorBadge = ({ label }: { label: string }) => (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Error al cargar</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>No se pudo cargar: {label}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de {periodLabel} -{" "}
            {currentWarehouse === "all"
              ? "Todas las Sucursales"
              : warehouses.find((w) => w.id === currentWarehouse)?.nombre || "Sucursal"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Hoy</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="365d">Último año</SelectItem>
              <SelectItem value="all">Histórico completo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching} className="btn-hover">
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Actualizando..." : "Actualizar"}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.isLoading ? (
          <>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </>
        ) : kpis.isError ? (
          <Card className="col-span-full p-6">
            <ErrorBadge label="KPIs" />
          </Card>
        ) : (
          kpisData.map((kpi, index) => (
            <KPICard key={index} data={kpi} className="animate-fade-in card-hover" />
          ))
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Ventas */}
        {tendencia.isLoading ? (
          <ChartSkeleton />
        ) : tendencia.isError ? (
          <Card className="p-6">
            <ErrorBadge label="Tendencia de ventas" />
          </Card>
        ) : (
          <Card className="card-hover animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendencia de Ventas
                </CardTitle>
                <Select value={String(tendenciaDias)} onValueChange={(v) => setTendenciaDias(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                Evolución de ventas en los últimos {tendenciaDias} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyLineChart data={tendenciaChartData} height={320}>
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
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Ventas"]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    if (!item) return label;
                    const [, m, d] = (item.fullDate || "").split("-");
                    return `${d}/${m} — ${item.num_ventas} transacciones`;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LazyLineChart>
            </CardContent>
          </Card>
        )}

        {/* Métodos de Pago */}
        {metodosPago.isLoading ? (
          <ChartSkeleton />
        ) : metodosPago.isError ? (
          <Card className="p-6">
            <ErrorBadge label="Métodos de pago" />
          </Card>
        ) : (
          <Card className="card-hover animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>Distribución de pagos por método</CardDescription>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
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
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fontSize={12}
                        >
                          {`${name} ${percentage}%`}
                        </text>
                      );
                    }}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_GRAFICOS[index % COLORES_GRAFICOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Monto"]}
                  />
                </LazyPieChart>
              ) : (
                <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground">
                  <CreditCard className="w-12 h-12 mb-2 opacity-50" />
                  <p>No hay datos de pagos</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom row: Top Productos + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos */}
        {topProductos.isLoading ? (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Top Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-lg mb-2" />
              ))}
            </CardContent>
          </Card>
        ) : topProductos.isError ? (
          <Card className="p-6">
            <ErrorBadge label="Top Productos" />
          </Card>
        ) : (
          <Card className="card-hover animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Top Productos
              </CardTitle>
              <CardDescription>Productos más vendidos por ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              {(topProductos.data?.data ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead className="text-right">Unidades</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProductos.data!.data.map((p) => (
                        <TableRow key={p.sku}>
                          <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                          <TableCell className="font-medium">{p.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">{p.marca}</TableCell>
                          <TableCell className="text-right">{p.unidades_vendidas.toLocaleString("es-MX")}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(p.ingresos_totales)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                  <p>No hay datos de productos</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alertas del Sistema */}
        <Card className="card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas del Sistema
            </CardTitle>
            <CardDescription>Notificaciones importantes que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.data && kpis.data.ventas_canceladas > 0 && (
                <div className="flex items-center gap-3 p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ventas Canceladas</p>
                    <p className="text-xs text-muted-foreground">
                      {kpis.data.ventas_canceladas} ventas canceladas en {periodLabel}
                    </p>
                  </div>
                  <Badge variant="destructive">Revisar</Badge>
                </div>
              )}

              {kpis.data && kpis.data.num_transacciones === 0 && !kpis.isLoading && (
                <div className="flex items-center gap-3 p-3 border border-warning/20 rounded-lg bg-warning/5">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sin Ventas</p>
                    <p className="text-xs text-muted-foreground">
                      No hay ventas registradas en {periodLabel}
                    </p>
                  </div>
                  <Badge variant="warning">Info</Badge>
                </div>
              )}

              {kpis.data && kpis.data.num_transacciones > 0 && (
                <div className="flex items-center gap-3 p-3 border border-info/20 rounded-lg bg-info/5">
                  <TrendingUp className="w-5 h-5 text-info" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Actividad Registrada</p>
                    <p className="text-xs text-muted-foreground">
                      {kpis.data.num_transacciones} ventas activas en {periodLabel}
                    </p>
                  </div>
                  <Badge variant="info">Good</Badge>
                </div>
              )}

              {kpis.isLoading && (
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
