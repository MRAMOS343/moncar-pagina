import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Download, CreditCard, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockSales, mockWarehouses, getWarehouseById, getProductById } from '../data/mockData';
import { Sale, User, KPIData, ChartDataPoint } from '../types';
import { toast } from '@/hooks/use-toast';
import { format, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
}

export default function VentasPage() {
  const { currentWarehouse, currentUser } = useOutletContext<ContextType>();
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');

  // Filter sales data
  const filteredSales = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 30);
    }

    return mockSales
      .filter(sale => currentWarehouse === 'all' || sale.warehouseId === currentWarehouse)
      .filter(sale => new Date(sale.fechaISO) >= startDate)
      .filter(sale => selectedMetodoPago && selectedMetodoPago !== 'all' ? sale.metodoPago === selectedMetodoPago : true)
      .sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime());
  }, [currentWarehouse, selectedMetodoPago, dateRange]);

  // Calculate KPIs
  const kpis: KPIData[] = useMemo(() => {
    const totalVentas = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const avgTicket = totalVentas / (filteredSales.length || 1);
    
    // Calculate top product
    const productSales: Record<string, number> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.qty;
      });
    });
    
    const topProductId = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    const topProduct = topProductId ? getProductById(topProductId) : null;

    return [
      {
        label: 'Ventas Totales',
        value: totalVentas,
        change: 15.2,
        changeType: 'positive',
        format: 'currency'
      },
      {
        label: 'Ticket Promedio',
        value: avgTicket,
        change: -2.1,
        changeType: 'negative',
        format: 'currency'
      },
      {
        label: 'Producto Top',
        value: topProduct?.nombre || 'Sin datos',
        change: 8.5,
        changeType: 'positive'
      }
    ];
  }, [filteredSales]);

  // Generate chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    const salesByDay: Record<string, number> = {};
    
    filteredSales.forEach(sale => {
      const day = format(new Date(sale.fechaISO), 'yyyy-MM-dd');
      salesByDay[day] = (salesByDay[day] || 0) + sale.total;
    });

    return Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date: format(new Date(date), 'dd/MM', { locale: es }),
        value
      }));
  }, [filteredSales]);

  const handleCreateSale = () => {
    if (currentUser.role === 'admin' || currentUser.role === 'gerente' || currentUser.role === 'cajero') {
      toast({
        title: "Funcionalidad disponible próximamente",
        description: "El módulo de creación de ventas será implementado en la siguiente versión.",
      });
    } else {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para crear ventas.",
        variant: "destructive"
      });
    }
  };

  const getMetodoPagoBadge = (metodo: Sale['metodoPago']) => {
    const variants = {
      efectivo: 'default',
      tarjeta: 'secondary',
      transferencia: 'outline',
      credito: 'destructive'
    } as const;

    return <Badge variant={variants[metodo]}>{metodo}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ventas</h1>
          <p className="text-muted-foreground">
            Registro de ventas en {
              currentWarehouse === 'all' 
                ? 'Todas las Sucursales' 
                : getWarehouseById(currentWarehouse)?.nombre || 'Sucursal no encontrada'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateSale} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={index} data={kpi} />
        ))}
      </div>

      {/* Chart */}
      <Card className="chart-card">
        <CardHeader>
          <CardTitle>Tendencia de Ventas</CardTitle>
          <CardDescription>
            Ventas diarias en los últimos {dateRange === '7d' ? '7 días' : dateRange === '30d' ? '30 días' : '90 días'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra las ventas por período y método de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Pago</label>
              <Select value={selectedMetodoPago} onValueChange={setSelectedMetodoPago}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSelectedMetodoPago('all');
                  setDateRange('30d');
                }} 
                variant="outline"
                className="w-full"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="data-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro de Ventas</CardTitle>
              <CardDescription>
                {filteredSales.length} ventas encontradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Venta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{sale.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(sale.fechaISO), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(sale.fechaISO), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{sale.vendedor || 'Sin asignar'}</TableCell>
                    <TableCell>
                      {getMetodoPagoBadge(sale.metodoPago)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${sale.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${sale.iva.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${sale.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {sale.items.length} items
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}