import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Product } from '@/types';
import type { SaleListItem } from '@/types/sales';
import { toNumber, formatCurrency } from '@/utils/formatters';

/**
 * Definiciones memoizadas de columnas para tablas
 * Evita recrear objetos en cada render
 */

/**
 * Columnas para tabla de ventas (API real)
 */
export const getVentasColumns = (onViewDetail?: (ventaId: number) => void) => [
  { 
    key: 'venta_id', 
    header: 'ID Venta',
    render: (value: number) => <span className="font-mono text-sm">{value}</span>
  },
  { 
    key: 'fecha_emision', 
    header: 'Fecha',
    render: (value: string) => {
      if (!value) return <span className="text-muted-foreground">Sin fecha</span>;
      try {
        return (
          <div>
            <div className="font-medium">
              {format(new Date(value), 'dd/MM/yyyy', { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(value), 'HH:mm')}
            </div>
          </div>
        );
      } catch {
        return <span className="text-destructive">Fecha inválida</span>;
      }
    }
  },
  { 
    key: 'sucursal_id', 
    header: 'Sucursal',
    render: (value: string) => <span>{value}</span>
  },
  { 
    key: 'caja_id', 
    header: 'Caja',
    render: (value: string) => <span className="text-muted-foreground">{value}</span>
  },
  { 
    key: 'subtotal', 
    header: 'Subtotal',
    render: (value: string) => (
      <span className="text-right block">{formatCurrency(value)}</span>
    )
  },
  { 
    key: 'impuesto', 
    header: 'IVA',
    render: (value: string) => (
      <span className="text-right text-muted-foreground block">{formatCurrency(value)}</span>
    )
  },
  { 
    key: 'total', 
    header: 'Total',
    render: (value: string) => (
      <span className="text-right font-medium block">{formatCurrency(value)}</span>
    )
  },
  {
    key: 'cancelada',
    header: 'Estado',
    render: (value: boolean) => (
      value 
        ? <Badge variant="destructive">Cancelada</Badge>
        : <Badge variant="outline" className="text-green-600 border-green-600">Activa</Badge>
    )
  },
  {
    key: 'actions',
    header: '',
    render: (_: unknown, row: SaleListItem) => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onViewDetail?.(row.venta_id)}
        aria-label="Ver detalle de venta"
      >
        <Eye className="w-4 h-4" />
      </Button>
    )
  }
];

interface InventoryWithProduct {
  onHand: number;
  reserved: number;
  product: Product;
}

export const getInventoryColumns = (
  handleEditProduct: (product: Product) => void,
  getStockStatusBadge: (inv: InventoryWithProduct) => JSX.Element
) => [
  {
    key: 'product.sku',
    header: 'SKU',
    sortable: true,
    render: (_: unknown, row: InventoryWithProduct) => (
      <span className="font-mono text-sm">{row.product.sku}</span>
    )
  },
  {
    key: 'product.nombre',
    header: 'Producto',
    sortable: true,
    render: (_: unknown, row: InventoryWithProduct) => (
      <div>
        <p className="font-medium">{row.product.nombre}</p>
        <p className="text-sm text-muted-foreground">{row.product.marca}</p>
      </div>
    )
  },
  {
    key: 'product.categoria',
    header: 'Categoría',
    sortable: true,
    render: (_: unknown, row: InventoryWithProduct) => (
      <Badge variant="outline">{row.product.categoria}</Badge>
    )
  },
  {
    key: 'onHand',
    header: 'Stock',
    sortable: true,
    render: (_: unknown, row: InventoryWithProduct) => (
      <div className="text-right">
        <span className="font-medium">{row.onHand}</span>
        <span className="text-sm text-muted-foreground ml-1">{row.product.unidad}</span>
      </div>
    )
  },
  {
    key: 'product.precio',
    header: 'Precio',
    sortable: true,
    render: (_: unknown, row: InventoryWithProduct) => (
      <span className="font-medium">
        {formatCurrency(row.product.precio)}
      </span>
    )
  },
  {
    key: 'status',
    header: 'Estado',
    render: (_: unknown, row: InventoryWithProduct) => getStockStatusBadge(row)
  },
  {
    key: 'actions',
    header: 'Acciones',
    render: (_: unknown, row: InventoryWithProduct) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEditProduct(row.product)}
      >
        <Edit className="w-4 h-4" />
      </Button>
    )
  }
];

export const getProductsColumns = () => [
  {
    key: 'nombre',
    label: 'Nombre',
    render: (product: Product) => (
      <div>
        <div className="font-medium">{product.nombre}</div>
        <div className="text-sm text-muted-foreground">{product.marca}</div>
      </div>
    ),
  },
  {
    key: 'sku',
    label: 'SKU',
    render: (product: Product) => (
      <span className="font-mono text-sm">{product.sku}</span>
    ),
  },
  {
    key: 'categoria',
    label: 'Categoría',
    render: (product: Product) => <Badge variant="outline">{product.categoria}</Badge>,
  },
  {
    key: 'precio',
    label: 'Precio',
    render: (product: Product) => (
      <span className="font-semibold text-success">
        {formatCurrency(product.precio)}
      </span>
    ),
  },
];
