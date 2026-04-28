import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CotizacionForm } from '@/components/cotizaciones/CotizacionForm';
import { CotizacionPreview } from '@/components/cotizaciones/CotizacionPreview';
import { CotizacionesTable } from '@/components/cotizaciones/CotizacionesTable';
import { useCotizaciones, useCreateCotizacion, useUpdateCotizacion, useUpdateCotizacionEstado, useDuplicateCotizacion, useDeleteCotizacion } from '@/hooks/useCotizaciones';
import { useAuth } from '@/contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import type { Cotizacion, CotizacionItem } from '@/types/cotizaciones';
import type { ClienteData, ClienteErrors } from '@/components/cotizaciones/ClienteFields';
import { Plus, ArrowLeft, Download, Loader2, Save, RotateCcw } from 'lucide-react';
import { ApiError } from '@/services/apiClient';
import { useCotizacionPdf } from '@/hooks/useCotizacionPdf';
import { PageLayout } from '@/components/layout/PageLayout';

type View = 'list' | 'create' | 'edit' | 'preview';

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
  const updateMut = useUpdateCotizacion();
  const updateEstadoMut = useUpdateCotizacionEstado();
  const duplicateMut = useDuplicateCotizacion();
  const deleteMut = useDeleteCotizacion();

  const { downloadPdf, isDownloading } = useCotizacionPdf();

  const [view, setView] = useState<View>('list');
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [clienteData, setClienteData] = useState<ClienteData>({ ...emptyCliente });
  const [clienteErrors, setClienteErrors] = useState<ClienteErrors>({});
  const [sucursal, setSucursal] = useState('');
  const [previewCotizacion, setPreviewCotizacion] = useState<Cotizacion | null>(null);
  const [editingCotizacion, setEditingCotizacion] = useState<Cotizacion | null>(null);

  const resetForm = useCallback(() => {
    setItems([]);
    setClienteData({ ...emptyCliente });
    setClienteErrors({});
    setSucursal('');
  }, []);

  const handleClienteChange = useCallback((field: keyof ClienteData, value: string) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
    setClienteErrors(prev => {
      const next = { ...prev };
      delete next[field];
      delete next.contacto;
      return next;
    });
  }, []);

  const buildPayload = useCallback(() => {
    const subtotal = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
    return {
      sucursal: sucursal.trim() || 'Principal',
      cliente_nombre: trimOrNull(clienteData.nombre),
      cliente_empresa: trimOrNull(clienteData.empresa),
      cliente_telefono: trimOrNull(clienteData.telefono),
      cliente_email: trimOrNull(clienteData.email),
      subtotal,
      impuesto: subtotal * 0.16,
      total: subtotal + subtotal * 0.16,
      lineas: items.map(item => ({
        articulo: item.sku,
        descripcion: item.descripcion,
        pieza: item.pieza,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        precio_original: item.precioOriginal,
        importe_linea: item.total,
      })),
    };
  }, [clienteData, sucursal, items]);

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

    createMut.mutate(buildPayload(), {
      onSuccess: (data) => {
        toast({ title: 'Cotización guardada', description: `Folio: ${data.folio}` });
        setPreviewCotizacion(data);
        setView('preview');
        resetForm();
      },
    });
  }, [clienteData, items, createMut, buildPayload, resetForm]);

  const handleUpdate = useCallback(() => {
    if (!editingCotizacion) return;
    const errors = validateCliente(clienteData);
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Agrega al menos un producto', variant: 'destructive' });
      return;
    }
    if (Object.keys(errors).length > 0) {
      setClienteErrors(errors);
      return;
    }

    updateMut.mutate({
      id: editingCotizacion.id,
      data: buildPayload(),
    }, {
      onSuccess: (data) => {
        toast({ title: 'Cotización actualizada', description: `Folio: ${data.folio}` });
        setPreviewCotizacion(data);
        setView('preview');
        setEditingCotizacion(null);
        resetForm();
      },
      onError: (err) => toast({
        title: 'Error al actualizar',
        description: err instanceof ApiError && err.status === 409
          ? 'No se puede editar una cotización cancelada.'
          : undefined,
        variant: 'destructive',
      }),
    });
  }, [editingCotizacion, clienteData, items, updateMut, buildPayload, resetForm]);

  const handleDownload = useCallback(() => {
    if (!previewCotizacion) return;
    const nombre = previewCotizacion.cliente_nombre ??
                   previewCotizacion.cliente_empresa ??
                   'cliente';
    const nombreLimpio = nombre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const folio = previewCotizacion.folio ?? 'cotizacion';
    downloadPdf(previewCotizacion.id, `cotizacion_${folio}_${nombreLimpio}.pdf`);
  }, [previewCotizacion, downloadPdf]);

  const handleView = (c: Cotizacion) => {
    setPreviewCotizacion(c);
    setView('preview');
  };

  const handleEdit = (c: Cotizacion) => {
    setEditingCotizacion(c);
    setClienteData({
      nombre: c.cliente_nombre ?? '',
      telefono: c.cliente_telefono ?? '',
      email: c.cliente_email ?? '',
      empresa: c.cliente_empresa ?? '',
    });
    setItems((c.items ?? []).map(item => ({
      sku: item.sku,
      descripcion: item.descripcion,
      pieza: item.pieza,
      precioUnitario: item.precioUnitario,
      precioOriginal: item.precioOriginal,
      cantidad: item.cantidad,
      total: item.total,
    })));
    setSucursal(c.sucursal);
    setView('edit');
  };

  const handleDuplicate = (id: string) => {
    duplicateMut.mutate(id, {
      onSuccess: (data) => {
        if (data) toast({ title: 'Cotización duplicada', description: `Nuevo folio: ${data.folio}` });
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    deleteMut.mutate(id, {
      onSuccess: () => toast({ title: 'Cotización eliminada' }),
      onError: () => toast({
        title: 'No se pudo eliminar',
        description: 'Verifica que tengas permisos para eliminar esta cotización.',
        variant: 'destructive',
      }),
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
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Descargando…</>
              : <><Download className="h-4 w-4 mr-2" />Descargar PDF</>
            }
          </Button>
        </div>
        <CotizacionPreview cotizacion={previewCotizacion} />
      </div>
    );
  }

  if (view === 'edit' && editingCotizacion) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => { setView('list'); setEditingCotizacion(null); resetForm(); }}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" />Limpiar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMut.isPending}>
              <Save className="h-4 w-4 mr-2" />Guardar Cambios
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Editar Cotización — {editingCotizacion.folio}</CardTitle>
          </CardHeader>
          <CardContent>
            <CotizacionForm
              items={items}
              clienteData={clienteData}
              sucursal={sucursal}
              clienteErrors={clienteErrors as Record<string, string | undefined>}
              onItemsChange={setItems}
              onClienteChange={handleClienteChange}
              onSucursalChange={setSucursal}
            />
          </CardContent>
        </Card>
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
              clienteErrors={clienteErrors as Record<string, string | undefined>}
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
    <PageLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cotizaciones</h1>
        <Button onClick={() => setView('create')}>
          <Plus className="h-4 w-4 mr-2" />Nueva Cotización
        </Button>
      </div>
      <CotizacionesTable
        cotizaciones={cotizaciones}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onUpdateEstado={handleUpdateEstado}
        onDelete={handleDelete}
      />
    </PageLayout>
  );
}
