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
import type { ClienteData, ClienteErrors } from '@/components/cotizaciones/ClienteFields';
import { Plus, ArrowLeft, Printer, Save, RotateCcw } from 'lucide-react';

type View = 'list' | 'create' | 'preview';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyCliente: ClienteData = { nombre: '', telefono: '', email: '', empresa: '' };

function trimOrNull(v: string): string | null {
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function validateCliente(d: ClienteData): ClienteErrors {
  const errors: ClienteErrors = {};
  const email = d.email.trim();
  const telefono = d.telefono.trim();

  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Formato de email inválido';
  }

  if (!telefono && !email) {
    errors.contacto = 'Debes ingresar al menos un teléfono o un email';
  }

  return errors;
}

export default function CotizacionesPage() {
  const { currentUser } = useAuth();
  const ctx = useOutletContext<{ currentWarehouse?: string }>();
  const { data: cotizaciones = [] } = useCotizaciones();
  const createMut = useCreateCotizacion();
  const updateEstadoMut = useUpdateCotizacionEstado();
  const duplicateMut = useDuplicateCotizacion();

  const [view, setView] = useState<View>('list');
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [clienteData, setClienteData] = useState<ClienteData>({ ...emptyCliente });
  const [clienteErrors, setClienteErrors] = useState<ClienteErrors>({});
  const [sucursal, setSucursal] = useState('');
  const [previewCotizacion, setPreviewCotizacion] = useState<Cotizacion | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setItems([]);
    setClienteData({ ...emptyCliente });
    setClienteErrors({});
    setSucursal('');
  }, []);

  const handleClienteChange = useCallback((field: keyof ClienteData, value: string) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    setClienteErrors(prev => {
      const next = { ...prev };
      delete next[field];
      delete next.contacto;
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const errors = validateCliente(clienteData);
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Agrega al menos un producto', variant: 'destructive' });
    }
    if (Object.keys(errors).length > 0) {
      setClienteErrors(errors);
      if (items.length > 0) {
        toast({ title: 'Datos incompletos', description: 'Revisa los datos del cliente', variant: 'destructive' });
      }
      return;
    }
    if (items.length === 0) return;

    const subtotal = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
    const iva = subtotal * 0.16;
    const clienteNombre = trimOrNull(clienteData.nombre);

    createMut.mutate({
      cliente: clienteNombre ?? trimOrNull(clienteData.empresa) ?? 'Cliente',
      cliente_nombre: clienteNombre,
      cliente_telefono: trimOrNull(clienteData.telefono),
      cliente_email: trimOrNull(clienteData.email),
      cliente_empresa: trimOrNull(clienteData.empresa),
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
  }, [clienteData, sucursal, items, currentUser, createMut, resetForm]);

  const handlePrint = () => window.print();

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" />Limpiar
            </Button>
            <Button onClick={handleSave} disabled={createMut.isPending}>
              <Save className="h-4 w-4 mr-2" />Guardar Cotización
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nueva Cotización</CardTitle>
          </CardHeader>
          <CardContent>
            <CotizacionForm
              items={items}
              clienteData={clienteData}
              sucursal={sucursal}
              clienteErrors={clienteErrors}
              onItemsChange={setItems}
              onClienteChange={handleClienteChange}
              onSucursalChange={setSucursal}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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
