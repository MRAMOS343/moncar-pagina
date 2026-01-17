import { useSaleDetail } from "@/hooks/useSales";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toNumber, formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  efe: "Efectivo",
  cre: "Crédito",
  deb: "Débito",
  tra: "Transferencia",
  tar: "Tarjeta",
  efectivo: "Efectivo",
  credito: "Crédito",
  debito: "Débito",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

const formatPaymentMethod = (metodo: string): string => {
  const key = metodo.toLowerCase().trim();
  return PAYMENT_METHOD_NAMES[key] || metodo;
};

interface SaleDetailModalProps {
  ventaId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailModal({ ventaId, open, onOpenChange }: SaleDetailModalProps) {
  const { data, isLoading, error } = useSaleDetail(ventaId, open);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Venta #{ventaId}
            {data?.venta.cancelada && (
              <Badge variant="destructive">Cancelada</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar detalle: {error.message}
            </AlertDescription>
          </Alert>
        )}
        
        {data && (
          <div className="space-y-6">
            {/* Info de encabezado */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Fecha:</span>{" "}
                <span className="font-medium">
                  {format(new Date(data.venta.fecha_emision), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Sucursal:</span>{" "}
                <span className="font-medium">{data.venta.sucursal_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Caja:</span>{" "}
                <span className="font-medium">{data.venta.caja_id}</span>
              </div>
            </div>

            {/* Info cancelación (solo en detalle) */}
            {data.venta.cancelada && data.venta.fecha_cancelacion && (
              <div className="bg-destructive/10 p-3 rounded-md text-sm border border-destructive/20">
                <p>
                  <strong>Cancelada:</strong>{" "}
                  {format(new Date(data.venta.fecha_cancelacion), "dd/MM/yyyy HH:mm", { locale: es })}
                </p>
                <p>
                  <strong>Motivo:</strong> {data.venta.motivo_cancelacion || "Sin especificar"}
                </p>
              </div>
            )}
            
            {/* Líneas / Artículos */}
            <div>
              <h4 className="font-medium mb-2">Artículos ({data.lineas.length})</h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Artículo</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Desc.</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.lineas.map((linea) => (
                      <TableRow key={linea.renglon}>
                        <TableCell className="text-muted-foreground">{linea.renglon}</TableCell>
                        <TableCell className="font-medium">{linea.articulo}</TableCell>
                        <TableCell className="text-right">{toNumber(linea.cantidad)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(toNumber(linea.precio_unitario))}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {toNumber(linea.descuento) > 0 ? formatCurrency(toNumber(linea.descuento)) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(toNumber(linea.importe_linea))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Pagos */}
            {data.pagos.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Pagos ({data.pagos.length})</h4>
                <div className="space-y-1 bg-muted/50 p-3 rounded-md">
                  {data.pagos.map((pago) => (
                    <div key={pago.idx} className="flex justify-between text-sm">
                      <span>{formatPaymentMethod(pago.metodo)}</span>
                      <span className="font-medium">{formatCurrency(toNumber(pago.monto))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Totales */}
            <div className="border-t pt-4 space-y-1 text-right">
              <div className="text-sm text-muted-foreground">
                Subtotal: {formatCurrency(toNumber(data.venta.subtotal))}
              </div>
              <div className="text-sm text-muted-foreground">
                IVA: {formatCurrency(toNumber(data.venta.impuesto))}
              </div>
              <div className="text-lg font-bold">
                Total: {formatCurrency(toNumber(data.venta.total))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
