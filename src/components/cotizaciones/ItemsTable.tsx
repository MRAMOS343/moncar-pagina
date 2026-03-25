import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CotizacionItem } from '@/types/cotizaciones';
import { Plus, Trash2, RotateCcw } from 'lucide-react';

interface Props {
  items: CotizacionItem[];
  onItemsChange: (items: CotizacionItem[]) => void;
}

const fmt = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export function ItemsTable({ items, onItemsChange }: Props) {
  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    onItemsChange(items.map((item, i) =>
      i === idx ? { ...item, cantidad: qty, total: qty * item.precioUnitario } : item
    ));
  };

  const updatePrecio = (idx: number, precio: number) => {
    if (precio < 0) return;
    onItemsChange(items.map((item, i) =>
      i === idx ? { ...item, precioUnitario: precio, total: item.cantidad * precio } : item
    ));
  };

  const resetPrecio = (idx: number) => {
    onItemsChange(items.map((item, i) =>
      i === idx
        ? { ...item, precioUnitario: item.precioOriginal, total: item.cantidad * item.precioOriginal }
        : item
    ));
  };

  const removeItem = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        <Plus className="h-8 w-8 mb-2" />
        <p className="text-sm">Busca productos por SKU para agregarlos a la cotización</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="py-2 px-3 text-left w-24">Cantidad</th>
            <th className="py-2 px-3 text-left">Descripción</th>
            <th className="py-2 px-3 text-left w-20">Pieza</th>
            <th className="py-2 px-3 text-right w-40">P. Unitario</th>
            <th className="py-2 px-3 text-right w-28">Total</th>
            <th className="py-2 px-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const precioModificado = item.precioUnitario !== item.precioOriginal;
            return (
              <tr key={item.sku} className="border-t">
                <td className="py-2 px-3">
                  <Input
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                    className="w-20 h-8 text-center"
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="font-medium">{item.descripcion}</div>
                  <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                </td>
                <td className="py-2 px-3 text-muted-foreground">{item.pieza}</td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.precioUnitario}
                      onChange={e => updatePrecio(idx, parseFloat(e.target.value) || 0)}
                      className={`w-28 h-8 text-right ${precioModificado ? 'border-amber-400 text-amber-700' : ''}`}
                    />
                    {precioModificado && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-amber-600"
                        onClick={() => resetPrecio(idx)}
                        title={`Restablecer a ${fmt(item.precioOriginal)}`}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {precioModificado && (
                    <div className="text-xs text-amber-600 mt-0.5">
                      Original: {fmt(item.precioOriginal)}
                    </div>
                  )}
                </td>
                <td className="py-2 px-3 text-right font-semibold">{fmt(item.total)}</td>
                <td className="py-2 px-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="bg-muted/30 border-t px-3 py-3">
        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA (16%):</span><span>{fmt(iva)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
              <span>Total:</span><span>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
