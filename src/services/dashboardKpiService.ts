import { toNumber } from "@/utils/formatters";
import type { SaleListItem } from "@/types/sales";
import type { KPIData, Warehouse } from "@/types";

export const dashboardKpiService = {
  /**
   * Calcula KPIs desde datos de API real
   */
  calculateKPIs(sales: SaleListItem[]): KPIData[] {
    const ventasActivas = sales.filter(s => !s.cancelada);
    const ventasCanceladas = sales.filter(s => s.cancelada);
    
    const ventasTotales = ventasActivas.reduce(
      (suma, venta) => suma + toNumber(venta.total), 0
    );
    const ticketPromedio = ventasActivas.length > 0 
      ? ventasTotales / ventasActivas.length 
      : 0;

    return [
      {
        label: "Ventas Totales",
        value: ventasTotales,
        format: "currency",
        change: 0,
        changeType: "neutral"
      },
      {
        label: "Transacciones",
        value: ventasActivas.length,
        format: "number",
        change: 0,
        changeType: "neutral"
      },
      {
        label: "Ticket Promedio",
        value: ticketPromedio,
        format: "currency",
        change: 0,
        changeType: "neutral"
      },
      {
        label: "Ventas Canceladas",
        value: ventasCanceladas.length,
        format: "number",
        change: 0,
        changeType: ventasCanceladas.length > 0 ? "negative" : "neutral"
      }
    ];
  },

  /**
   * Calcula tendencia de ventas por día (últimos N días)
   */
  calculateTrend(sales: SaleListItem[], days: number = 7) {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalizar a mediodía para evitar problemas de zona horaria
    
    // DEBUG: Ver qué ventas llegan
    console.log('[DEBUG] Total ventas recibidas:', sales.length);
    console.log('[DEBUG] Rango de fechas en ventas:', 
      sales.map(s => s.fecha_emision).sort()
    );
    
    const fechas = Array.from({ length: days }, (_, i) => {
      const fecha = new Date(today);
      fecha.setDate(fecha.getDate() - (days - 1 - i));
      return fecha.toISOString().split('T')[0];
    });

    console.log('[DEBUG] Fechas generadas para el gráfico:', fechas);

    return fechas.map(fecha => {
      const ventasDelDia = sales.filter(venta => {
        if (venta.cancelada) return false;
        // Extraer solo la fecha YYYY-MM-DD de fecha_emision
        const fechaVenta = venta.fecha_emision.split('T')[0];
        return fechaVenta === fecha;
      });
      
      // DEBUG: Ver qué ventas coinciden por fecha
      if (ventasDelDia.length > 0) {
        console.log(`[DEBUG] ${fecha}: ${ventasDelDia.length} ventas`);
      }
      
      const totalDia = ventasDelDia.reduce(
        (suma, venta) => suma + toNumber(venta.total), 0
      );
      
      return {
        date: new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        value: totalDia,
        fullDate: fecha
      };
    });
  },

  /**
   * Agrupa ventas por sucursal con nombres legibles
   */
  calculateBySucursal(sales: SaleListItem[], warehouses: Warehouse[] = []) {
    const porSucursal: Record<string, { count: number; total: number }> = {};
    
    const ventasActivas = sales.filter(s => !s.cancelada);
    
    ventasActivas.forEach(venta => {
      if (!porSucursal[venta.sucursal_id]) {
        porSucursal[venta.sucursal_id] = { count: 0, total: 0 };
      }
      porSucursal[venta.sucursal_id].count++;
      porSucursal[venta.sucursal_id].total += toNumber(venta.total);
    });

    const totalVentas = ventasActivas.length;

    return Object.entries(porSucursal).map(([sucursalId, data]) => {
      const warehouse = warehouses.find(w => w.id === sucursalId);
      const displayName = warehouse?.nombre?.trim() || sucursalId;
      
      return {
        name: displayName,
        value: data.total,
        count: data.count,
        percentage: totalVentas > 0 
          ? ((data.count / totalVentas) * 100).toFixed(1)
          : '0.0'
      };
    });
  },

  /**
   * Obtiene las últimas N ventas para mostrar como actividad reciente
   */
  getRecentSales(sales: SaleListItem[], limit: number = 5) {
    return sales
      .filter(s => !s.cancelada)
      .sort((a, b) => new Date(b.fecha_emision).getTime() - new Date(a.fecha_emision).getTime())
      .slice(0, limit);
  }
};
