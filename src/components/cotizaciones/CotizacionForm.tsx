import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import type { CotizacionItem } from '@/types/cotizaciones';
import type { ApiProduct } from '@/types/products';
import { Plus, Trash2, Search } from 'lucide-react';

interface Props {
  items: CotizacionItem[];
  cliente: string;
  sucursal: string;
  onItemsChange: (items: CotizacionItem[]) => void;
  onClienteChange: (v: string) => void;
  onSucursalChange: (v: string) => void;
}

export function CotizacionForm({ items, cliente, sucursal, onItemsChange, onClienteChange, onSucursalChange }: Props) {
  const [skuSearch, setSkuSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const debouncedSearch = useDebounce(skuSearch, 400);
  const { products, isLoading: searching, fetchNextPage, hasNextPage, isFetchingNextPage } = useProducts({ q: debouncedSearch, limit: 200, enabled: debouncedSearch.length >= 2 });

  // Auto-fetch remaining pages when searching
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && debouncedSearch.length >= 2) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, debouncedSearch, fetchNextPage]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrado client-side: palabras desordenadas sobre sku+descrip+marca
  const filteredProducts = useMemo(() => {
    if (!skuSearch.trim() || skuSearch.trim().length < 2) return [];
    const words = skuSearch.toLowerCase().split(/\s+/).filter(Boolean);
    return products
      .filter(p => {
        const target = `${p.sku} ${p.descrip ?? ''} ${p.marca ?? ''} ${p.notes ?? ''}`.toLowerCase();
        return words.every(w => target.includes(w));
      })
      .slice(0, 10);
  }, [products, skuSearch]);

  const calcPrecioConIva = (product: ApiProduct) => {
    const base = Number(product.precio1) || 0;
    const impRaw = Number(product.impuesto) || 0;
    const imp = impRaw > 1 ? impRaw / 100 : impRaw;
    return base * (1 + imp);
  };

  const addProduct = useCallback((product: ApiProduct) => {
    const existing = items.find(i => i.sku === product.sku);
    if (existing) {
      onItemsChange(items.map(i =>
        i.sku === product.sku
          ? { ...i, cantidad: i.cantidad + 1, total: (i.cantidad + 1) * i.precioUnitario }
          : i
      ));
    } else {
      const precio = product.precio1 ?? 0;
      onItemsChange([...items, {
        sku: product.sku,
        descripcion: product.descrip ?? product.sku,
        pieza: product.unidad ?? 'PZA',
        precioUnitario: precio,
        cantidad: 1,
        total: precio,
      }]);
    }
    setSkuSearch('');
    setShowResults(false);
    inputRef.current?.focus();
  }, [items, onItemsChange]);

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    onItemsChange(items.map((item, i) =>
      i === idx ? { ...item, cantidad: qty, total: qty * item.precioUnitario } : item
    ));
  };

  const removeItem = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const fmt = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="space-y-4">
      {/* Client & Branch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Input value={cliente} onChange={e => onClienteChange(e.target.value)} placeholder="Nombre del cliente" />
        </div>
        <div className="space-y-1.5">
          <Label>Sucursal</Label>
          <Input value={sucursal} onChange={e => onSucursalChange(e.target.value)} placeholder="Sucursal" />
        </div>
      </div>

      {/* SKU search */}
      <div className="relative">
        <Label>Agregar producto</Label>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={skuSearch}
            onChange={e => { setSkuSearch(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            placeholder="Buscar por SKU o descripción..."
            className="pl-9"
          />
        </div>
        {showResults && debouncedSearch.length >= 2 && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
            <CardContent className="p-0">
              {searching ? (
                <p className="p-3 text-sm text-muted-foreground">Buscando...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Sin resultados</p>
              ) : (
                filteredProducts.map(p => (
                  <button
                    key={p.sku}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center justify-between text-sm border-b last:border-0 transition-colors"
                  >
                    <div>
                      <span className="font-mono font-medium">{p.sku}</span>
                      <span className="ml-2 text-muted-foreground">{p.notes ?? p.descrip}</span>
                    </div>
                    <Badge variant="secondary">{fmt(calcPrecioConIva(p))}</Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items table */}
      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-2 px-3 text-left w-24">Cantidad</th>
                <th className="py-2 px-3 text-left">Descripción</th>
                <th className="py-2 px-3 text-left w-20">Pieza</th>
                <th className="py-2 px-3 text-right w-32">P. Unitario</th>
                <th className="py-2 px-3 text-right w-28">Total</th>
                <th className="py-2 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
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
                  <td className="py-2 px-3 text-right">{fmt(item.precioUnitario)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{fmt(item.total)}</td>
                  <td className="py-2 px-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
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
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <Plus className="h-8 w-8 mb-2" />
          <p className="text-sm">Busca productos por SKU para agregarlos a la cotización</p>
        </div>
      )}
    </div>
  );
}
