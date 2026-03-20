import { useState, useCallback } from 'react';
import { ClienteFields, type ClienteData } from '@/components/cotizaciones/ClienteFields';
import { ProductSearch } from '@/components/cotizaciones/ProductSearch';
import { ItemsTable } from '@/components/cotizaciones/ItemsTable';
import { Separator } from '@/components/ui/separator';
import type { CotizacionItem } from '@/types/cotizaciones';

interface Props {
  items: CotizacionItem[];
  clienteData: ClienteData;
  sucursal: string;
  clienteErrors: Record<string, string | undefined>;
  onItemsChange: (items: CotizacionItem[]) => void;
  onClienteChange: (field: keyof ClienteData, value: string) => void;
  onSucursalChange: (v: string) => void;
}

export function CotizacionForm({ items, clienteData, sucursal, clienteErrors, onItemsChange, onClienteChange, onSucursalChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Section 1: Client data */}
      <ClienteFields
        data={clienteData}
        errors={clienteErrors}
        onChange={onClienteChange}
      />

      <Separator />

      {/* Section 2: Products */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Productos cotizados
        </h3>
        <ProductSearch items={items} onItemsChange={onItemsChange} />
      </div>

      {/* Section 3: Items & Totals */}
      <ItemsTable items={items} onItemsChange={onItemsChange} />
    </div>
  );
}
