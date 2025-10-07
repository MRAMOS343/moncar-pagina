import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockSales, mockInventory, mockProducts, mockWarehouses } from "@/data/mockData";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { TrendingUp, ShoppingCart, Package, DollarSign, AlertTriangle, Plus } from "lucide-react";
import { Sale, User, KPIData } from "@/types";

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
}

export default function DashboardPage() {
  const { currentWarehouse, currentUser } = useOutletContext<ContextType>();

  // Cálculo de KPIs globales del negocio
  const kpisGlobales = useMemo((): KPIData[] => {
    const ventasTotales = mockSales.reduce((suma, venta) => suma + venta.total, 0);
    const totalProductos = mockProducts.length;
    const productosStockBajo = mockInventory.filter(inv => inv.onHand <= 10).length;
    const ticketPromedio = ventasTotales / mockSales.length;

    return [
      {
        label: "Ventas Totales",
        value: ventasTotales,
        format: "currency",
        change: 12.5,
        changeType: "positive"
      },
      {
        label: "Productos Únicos",
        value: totalProductos,
        format: "number",
        change: 2.1,
        changeType: "positive"
      },
      {
        label: "Ticket Promedio",
        value: ticketPromedio,
        format: "currency",
        change: -1.2,
        changeType: "negative"
      },
      {
        label: "Stock Bajo",
        value: productosStockBajo,
        format: "number",
        change: 5.3,
        changeType: "negative"
      }
    ];
  }, []);

  // Datos de tendencia de ventas (últimos 7 días) para el gráfico lineal
  const datosTendenciaVentas = useMemo(() => {
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - (6 - i));
      return fecha.toISOString().split('T')[0];
    });

    return ultimos7Dias.map(fecha => {
      // Sumar todas las ventas de ese día específico
      const totalDia = mockSales
        .filter(venta => venta.fechaISO.startsWith(fecha))
        .reduce((suma, venta) => suma + venta.total, 0);
      
      return {
        date: new Date(fecha).toLocaleDateString('es-MX', { weekday: 'short' }),
        value: totalDia
      };
    });
  }, []);

  // Distribución de métodos de pago para gráfico circular
  const datosMetodosPago = useMemo(() => {
    const metodos = mockSales.reduce((acumulador, venta) => {
      acumulador[venta.metodoPago] = (acumulador[venta.metodoPago] || 0) + 1;
      return acumulador;
    }, {} as Record<string, number>);

    return Object.entries(metodos).map(([metodo, cantidad]) => ({
      name: metodo.charAt(0).toUpperCase() + metodo.slice(1),
      value: cantidad,
      percentage: (cantidad / mockSales.length * 100).toFixed(1)
    }));
  }, []);

  // Productos más vendidos por ingresos generados
  const productosMasVendidos = useMemo(() => {
    const ventasProductos = mockSales.reduce((acumulador, venta) => {
      venta.items.forEach(item => {
        const producto = mockProducts.find(p => p.id === item.productId);
        if (producto) {
          if (!acumulador[producto.id]) {
            acumulador[producto.id] = { producto, totalVendido: 0, ingresos: 0 };
          }
          acumulador[producto.id].totalVendido += item.qty;
          acumulador[producto.id].ingresos += item.qty * item.unitPrice;
        }
      });
      return acumulador;
    }, {} as Record<string, { producto: any; totalVendido: number; ingresos: number }>);

    // Ordenar por ingresos y tomar los top 5
    return Object.values(ventasProductos)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);
  }, []);

  // Colores para los gráficos - usar tokens del tema
  const COLORES = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado de la página principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general del sistema - {mockWarehouses.find(w => w.id === currentWarehouse)?.nombre || 'Todas las sucursales'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Indicadores clave de rendimiento (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisGlobales.map((kpi, index) => (
          <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <KPICard data={kpi} />
          </div>
        ))}
      </div>

      {/* Fila de gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendencia de ventas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tendencia de Ventas (7 días)
            </CardTitle>
            <CardDescription>
              Evolución de las ventas en los últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosTendenciaVentas}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [
                    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value),
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
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de métodos de pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Métodos de Pago
            </CardTitle>
            <CardDescription>
              Distribución de métodos de pago utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosMetodosPago}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  labelLine={{ stroke: 'hsl(var(--foreground))' }}
                  style={{ fill: 'hsl(var(--foreground))' }}
                >
                  {datosMetodosPago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sección inferior con información adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos más vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Productos Más Vendidos
            </CardTitle>
            <CardDescription>
              Top 5 productos por ingresos generados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productosMasVendidos.map((item, index) => (
                <div key={item.producto.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">{item.producto.marca}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.ingresos)}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.totalVendido} vendidos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sistema de alertas */}
        <Card>
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
              {/* Alerta de stock bajo - crítica */}
              <div className="flex items-center gap-3 p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Stock Bajo</p>
                  <p className="text-xs text-muted-foreground">
                    {kpisGlobales[3].value} productos por debajo del punto de reorden
                  </p>
                </div>
                <Badge variant="destructive">Urgente</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ventas en Declive</p>
                  <p className="text-xs text-muted-foreground">
                    El ticket promedio ha disminuido 1.2% esta semana
                  </p>
                </div>
                <Badge variant="secondary">Info</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Crecimiento Positivo</p>
                  <p className="text-xs text-muted-foreground">
                    Las ventas totales han aumentado 12.5% este mes
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-700">Good</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}