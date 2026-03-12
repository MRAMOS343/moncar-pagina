import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CotizacionForm } from '@/components/cotizaciones/CotizacionForm';
import { CotizacionPreview } from '@/components/cotizaciones/CotizacionPreview';
import { CotizacionesTable } from '@/components/cotizaciones/CotizacionesTable';
import { useCotizaciones, useCreateCotizacion, useUpdateCotizacionEstado, useDuplicateCotizacion } from '@/hooks/useCotizaciones';
import { useAuth } from '@/contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import type { Cotizacion, CotizacionItem } from '@/types/cotizaciones';
import { Plus, ArrowLeft, Printer, Save } from 'lucide-react';

type View = 'list' | 'create' | 'preview';

export default function CotizacionesPage() {
  const { currentUser } = useAuth();
  const ctx = useOutletContext<{ currentWarehouse?: string }>();
  const { data: cotizaciones = [] } = useCotizaciones();
  const createMut = useCreateCotizacion();
  const updateEstadoMut = useUpdateCotizacionEstado();
  const duplicateMut = useDuplicateCotizacion();

  const [view, setView] = useState<View>('list');
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [cliente, setCliente] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [previewCotizacion, setPreviewCotizacion] = useState<Cotizacion | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setItems([]);
    setCliente('');
    setSucursal('');
  }, []);

  const handleSave = useCallback(() => {
    if (!cliente.trim()) {
      toast({ title: 'Error', description: 'Ingresa el nombre del cliente', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Agrega al menos un producto', variant: 'destructive' });
      return;
    }

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const iva = subtotal * 0.16;

    createMut.mutate({
      cliente: cliente.trim(),
      sucursal: sucursal.trim() || 'Principal',
      vendedorId: currentUser?.id ?? '',
      vendedorNombre: currentUser?.nombre ?? currentUser?.email ?? 'Vendedor',
      fecha: new Date().toISOString().split('T')[0],
      items,
      subtotal,
      iva,
      total: subtotal + iva,
      estado: 'pendiente',
    }, {
      onSuccess: (data) => {
        toast({ title: 'Cotización guardada', description: `Folio: ${data.folio}` });
        setPreviewCotizacion(data);
        setView('preview');
        resetForm();
      },
    });
  }, [cliente, sucursal, items, currentUser, createMut, resetForm]);

  const handlePrint = () => {
    window.print();
  };

  const handleView = (c: Cotizacion) => {
    setPreviewCotizacion(c);
    setView('preview');
  };

  const handleDuplicate = (id: string) => {
    duplicateMut.mutate(id, {
      onSuccess: (data) => {
        if (data) toast({ title: 'Cotización duplicada', description: `Nuevo folio: ${data.folio}` });
      },
    });
  };

  const handleUpdateEstado = (id: string, estado: Cotizacion['estado']) => {
    updateEstadoMut.mutate({ id, estado }, {
      onSuccess: () => {
        toast({ title: 'Estado actualizado', description: `Cotización marcada como ${estado}` });
      },
    });
  };

  if (view === 'preview' && previewCotizacion) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" onClick={() => setView('list')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />Imprimir
          </Button>
        </div>
        <CotizacionPreview ref={printRef} cotizacion={previewCotizacion} />
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => { setView('list'); resetForm(); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <Button onClick={handleSave} disabled={createMut.isPending}>
            <Save className="h-4 w-4 mr-2" />Guardar Cotización
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nueva Cotización</CardTitle>
          </CardHeader>
          <CardContent>
            <CotizacionForm
              items={items}
              cliente={cliente}
              sucursal={sucursal}
              onItemsChange={setItems}
              onClienteChange={setCliente}
              onSucursalChange={setSucursal}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cotizaciones</h1>
        <Button onClick={() => setView('create')}>
          <Plus className="h-4 w-4 mr-2" />Nueva Cotización
        </Button>
      </div>
      <CotizacionesTable
        cotizaciones={cotizaciones}
        onView={handleView}
        onDuplicate={handleDuplicate}
        onUpdateEstado={handleUpdateEstado}
      />
    </div>
  );
}
