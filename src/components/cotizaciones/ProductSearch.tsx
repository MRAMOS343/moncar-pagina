import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import type { CotizacionItem } from '@/types/cotizaciones';
import type { ApiProduct } from '@/types/products';
import { Search } from 'lucide-react';

interface Props {
  items: CotizacionItem[];
  onItemsChange: (items: CotizacionItem[]) => void;
}

export function ProductSearch({ items, onItemsChange }: Props) {
  const [skuSearch, setSkuSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const debouncedSearch = useDebounce(skuSearch, 400);
  const { products, isLoading: searching, fetchNextPage, hasNextPage, isFetchingNextPage } = useProducts({ q: debouncedSearch, limit: 200, enabled: debouncedSearch.length >= 2 });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && debouncedSearch.length >= 2) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, debouncedSearch, fetchNextPage]);

  const inputRef = useRef<HTMLInputElement>(null);

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

  const fmt = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

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
      const precio = Number(product.precio1) || 0;
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

  return (
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
  );
}
