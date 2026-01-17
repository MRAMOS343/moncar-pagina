import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSaleDetail } from "@/services/salesService";
import type { SaleListItem, SalePayment } from "@/types/sales";
import { toNumber } from "@/utils/formatters";

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
 * Hook que obtiene los detalles de pagos de una lista de ventas
 * y calcula la distribución por método de pago
 */
export function useDashboardPaymentMethods(
  sales: SaleListItem[],
  enabled: boolean = true
) {
  const { token } = useAuth();

  // Solo ventas activas (no canceladas)
  const ventasActivas = sales.filter((s) => !s.cancelada);
  const ventaIds = ventasActivas.map((s) => s.venta_id);

  return useQuery({
    queryKey: ["dashboard-payment-methods", ventaIds],
    queryFn: async (): Promise<PaymentMethodData[]> => {
      // Fetch detalles de todas las ventas en paralelo
      const detalles = await Promise.all(
        ventaIds.map((id) => fetchSaleDetail(token!, id))
      );

      // Agregar todos los pagos
      const todosPagos: SalePayment[] = detalles.flatMap((d) => d.pagos);

      // Agrupar por método
      const porMetodo: Record<string, { total: number; count: number }> = {};

      todosPagos.forEach((pago) => {
        const metodo = pago.metodo.toLowerCase();
        if (!porMetodo[metodo]) {
          porMetodo[metodo] = { total: 0, count: 0 };
        }
        porMetodo[metodo].total += toNumber(pago.monto);
        porMetodo[metodo].count++;
      });

      const totalMonto = Object.values(porMetodo).reduce(
        (sum, m) => sum + m.total,
        0
      );

      return Object.entries(porMetodo).map(([metodo, data]) => ({
        name: PAYMENT_METHOD_NAMES[metodo] || metodo.charAt(0).toUpperCase() + metodo.slice(1),
        value: data.total,
        count: data.count,
        percentage:
          totalMonto > 0 ? ((data.total / totalMonto) * 100).toFixed(1) : "0.0",
      }));
    },
    enabled: enabled && !!token && ventaIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos cache
  });
}
