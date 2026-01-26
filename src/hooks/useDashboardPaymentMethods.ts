import { useMemo } from "react";
import type { SaleListItem } from "@/types/sales";

interface PaymentMethodData {
  name: string;
  value: number;
  count: number;
  percentage: string;
}

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  // Códigos abreviados del API
  efe: "Efectivo",
  cre: "Crédito",
  deb: "Débito",
  tra: "Transferencia",
  tar: "Tarjeta",
  // Nombres completos (por si el API cambia)
  efectivo: "Efectivo",
  credito: "Crédito",
  debito: "Débito",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

/**
 * Parsea el campo pagos_resumen que viene con formato "EFE:116.00" o "EFE:100.00,TRA:50.00"
 */
function parsePagosResumen(resumen: string | null | undefined): Record<string, number> {
  if (!resumen) return {};
  
  const result: Record<string, number> = {};
  resumen.split(',').forEach(part => {
    const [metodo, monto] = part.trim().split(':');
    if (metodo && monto) {
      const key = metodo.toLowerCase();
      result[key] = (result[key] || 0) + parseFloat(monto);
    }
  });
  return result;
}

/**
 * Hook que calcula la distribución por método de pago
 * directamente desde pagos_resumen (sin llamadas API adicionales)
 */
export function useDashboardPaymentMethods(
  sales: SaleListItem[],
  enabled: boolean = true
): { data: PaymentMethodData[]; isLoading: boolean } {
  
  const data = useMemo((): PaymentMethodData[] => {
    if (!enabled || sales.length === 0) return [];

    // Solo ventas activas (no canceladas)
    const ventasActivas = sales.filter((s) => !s.cancelada);

    // Agregar todos los pagos desde pagos_resumen
    const porMetodo: Record<string, { total: number; count: number }> = {};

    ventasActivas.forEach((venta) => {
      const pagos = parsePagosResumen(venta.pagos_resumen);
      
      Object.entries(pagos).forEach(([metodo, monto]) => {
        if (!porMetodo[metodo]) {
          porMetodo[metodo] = { total: 0, count: 0 };
        }
        porMetodo[metodo].total += monto;
        porMetodo[metodo].count++;
      });
    });

    const totalMonto = Object.values(porMetodo).reduce(
      (sum, m) => sum + m.total,
      0
    );

    return Object.entries(porMetodo).map(([metodo, stats]) => ({
      name: PAYMENT_METHOD_NAMES[metodo] || metodo.charAt(0).toUpperCase() + metodo.slice(1),
      value: stats.total,
      count: stats.count,
      percentage:
        totalMonto > 0 ? ((stats.total / totalMonto) * 100).toFixed(1) : "0.0",
    }));
  }, [sales, enabled]);

  // Ya no hay llamadas async, siempre es síncrono e instantáneo
  return { data, isLoading: false };
}
