import { useState, useMemo } from 'react';
import { Building2, Plus, FileText, Wrench, AlertTriangle, Lock, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { KPISkeleton } from '@/components/ui/kpi-skeleton';
import { PropertyCard } from '@/components/propiedades/PropertyCard';
import { PropertyFormModal } from '@/components/propiedades/PropertyFormModal';
import { PropertyDetailModal } from '@/components/propiedades/PropertyDetailModal';
import { ContractFormModal } from '@/components/propiedades/ContractFormModal';
import { PaymentTable } from '@/components/propiedades/PaymentTable';
import { PaymentFormModal } from '@/components/propiedades/PaymentFormModal';
import { MaintenanceFormModal } from '@/components/propiedades/MaintenanceFormModal';
import { PropertyFilters } from '@/components/propiedades/PropertyFilters';
import {
  usePropiedadesAPI, useCreatePropiedad, useUpdatePropiedad, useDeletePropiedad,
  useContratosAPI, useCreateContrato, useUpdateContrato,
  usePagosAPI, useCreatePago, useUpdatePago,
  useMantenimientoAPI, useCreateMantenimiento, useUpdateMantenimiento,
} from '@/hooks/usePropiedadesAPI';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Propiedad, Contrato, Pago, SolicitudMantenimiento, TipoDocumento } from '@/types/propiedades';

const prioridadBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  baja: 'outline', media: 'secondary', alta: 'default', urgente: 'destructive',
};
const estadoMantLabels: Record<string, string> = {
  pendiente: 'Pendiente', en_progreso: 'En Progreso', completado: 'Completado',
};

export default function PropiedadesPage() {
  const { currentUser } = useAuth();
  const isAllowed = currentUser?.role === 'admin' || currentUser?.role === 'gerente';

  // Gate de rol: el backend devuelve 403 si no es admin/gerente, mostramos UI amigable
  if (!isAllowed) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Lock}
          title="Acceso restringido"
          description="Solo administradores y gerentes pueden ver esta sección."
        />
      </div>
    );
  }

  return <PropiedadesPageInner />;
}

function PropiedadesPageInner() {
  const { data: propiedades = [], isLoading: loadingProps }     = usePropiedadesAPI();
  const { data: contratos = [], isLoading: loadingContratos }   = useContratosAPI();
  const { data: pagos = [], isLoading: loadingPagos }           = usePagosAPI();
  const { data: mantenimiento = [], isLoading: loadingMant }    = useMantenimientoAPI();

  const createPropMut     = useCreatePropiedad();
  const updatePropMut     = useUpdatePropiedad();
  const deletePropMut     = useDeletePropiedad();
  const createContratoMut = useCreateContrato();
  const updateContratoMut = useUpdateContrato();
  const createPagoMut     = useCreatePago();
  const updatePagoMut     = useUpdatePago();
  const createMantMut     = useCreateMantenimiento();
  const updateMantMut     = useUpdateMantenimiento();

  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');

  // Modals
  const [propFormOpen, setPropFormOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Propiedad | null>(null);
  const [detailProp, setDetailProp] = useState<Propiedad | null>(null);
  const [deletingProp, setDeletingProp] = useState<Propiedad | null>(null);
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contrato | null>(null);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Pago | null>(null);
  const [maintFormOpen, setMaintFormOpen] = useState(false);
  const [editingMaint, setEditingMaint] = useState<SolicitudMantenimiento | null>(null);

  const filteredProps = useMemo(() => {
    return propiedades.filter(p => {
      if (search && !p.direccion.toLowerCase().includes(search.toLowerCase())) return false;
      if (estadoFilter !== 'all' && p.estado !== estadoFilter) return false;
      if (tipoFilter !== 'all' && p.tipo !== tipoFilter) return false;
      return true;
    });
  }, [propiedades, search, estadoFilter, tipoFilter]);

  const pagoKpis = useMemo(() => {
    const cobrado   = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.montoPagado, 0);
    const pendiente = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'parcial').reduce((s, p) => s + (p.montoEsperado - p.montoPagado), 0);
    const atrasados = pagos.filter(p => p.estado === 'atrasado').length;
    const total = pagos.length;
    const tasa = total > 0 ? Math.round((pagos.filter(p => p.estado === 'pagado').length / total) * 100) : 0;
    return { cobrado, pendiente, atrasados, tasa };
  }, [pagos]);

  const contratosWithWarning = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    return contratos.map(c => ({
      ...c,
      expiringSoon: c.activo && !!c.fechaFin && new Date(c.fechaFin) <= in30,
      propDireccion: propiedades.find(p => p.id === c.propiedadId)?.direccion ?? '—',
    }));
  }, [contratos, propiedades]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSavePropiedad = (data: Omit<Propiedad, 'id' | 'createdAt'>) => {
    if (editingProp) {
      updatePropMut.mutate({ id: editingProp.id, data }, {
        onSuccess: () => toast({ title: 'Propiedad actualizada' }),
        onError: () => toast({ title: 'Error al actualizar', variant: 'destructive' }),
      });
    } else {
      createPropMut.mutate(data, {
        onSuccess: () => toast({ title: 'Propiedad creada' }),
        onError: () => toast({ title: 'Error al crear', variant: 'destructive' }),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingProp) return;
    deletePropMut.mutate(deletingProp.id, {
      onSuccess: () => {
        toast({ title: 'Propiedad eliminada' });
        setDetailProp(null);
        setDeletingProp(null);
      },
      onError: (err: any) => toast({
        title: 'No se pudo eliminar',
        description: err?.message?.includes('409') ? 'Tiene contratos activos.' : undefined,
        variant: 'destructive',
      }),
    });
  };

  const handleSaveContrato = (data: Omit<Contrato, 'id' | 'createdAt'>) => {
    if (editingContract) {
      updateContratoMut.mutate({ id: editingContract.id, data }, {
        onSuccess: () => toast({ title: 'Contrato actualizado' }),
        onError: () => toast({ title: 'Error al actualizar contrato', variant: 'destructive' }),
      });
    } else {
      createContratoMut.mutate(data, {
        onSuccess: () => toast({ title: 'Contrato creado' }),
        onError: () => toast({ title: 'Error al crear contrato', variant: 'destructive' }),
      });
    }
  };

  const handleSavePago = (data: Omit<Pago, 'id' | 'createdAt'>) => {
    if (editingPayment) {
      updatePagoMut.mutate({ id: editingPayment.id, data }, {
        onSuccess: () => toast({ title: 'Pago actualizado' }),
        onError: () => toast({ title: 'Error al actualizar pago', variant: 'destructive' }),
      });
    } else {
      createPagoMut.mutate(data, {
        onSuccess: () => toast({ title: 'Pago registrado' }),
        onError: () => toast({ title: 'Error al registrar pago', variant: 'destructive' }),
      });
    }
  };

  const handleSaveMantenimiento = (data: Omit<SolicitudMantenimiento, 'id'>) => {
    if (editingMaint) {
      updateMantMut.mutate({ id: editingMaint.id, data }, {
        onSuccess: () => toast({ title: 'Solicitud actualizada' }),
        onError: () => toast({ title: 'Error al actualizar solicitud', variant: 'destructive' }),
      });
    } else {
      createMantMut.mutate(data, {
        onSuccess: () => toast({ title: 'Solicitud creada' }),
        onError: () => toast({ title: 'Error al crear solicitud', variant: 'destructive' }),
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />Propiedades en Renta
          </h1>
          <p className="text-sm text-muted-foreground">Administración de inmuebles y contratos de arrendamiento</p>
        </div>
      </div>

      <Tabs defaultValue="propiedades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="propiedades">Propiedades</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
        </TabsList>

        {/* ── TAB: PROPIEDADES ── */}
        <TabsContent value="propiedades" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <PropertyFilters
              search={search} onSearchChange={setSearch}
              estadoFilter={estadoFilter} onEstadoChange={setEstadoFilter}
              tipoFilter={tipoFilter} onTipoChange={setTipoFilter}
            />
            <Button onClick={() => { setEditingProp(null); setPropFormOpen(true); }} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />Nueva Propiedad
            </Button>
          </div>
          {loadingProps ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KPISkeleton /><KPISkeleton /><KPISkeleton />
            </div>
          ) : filteredProps.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Sin propiedades"
              description={search || estadoFilter !== 'all' || tipoFilter !== 'all'
                ? 'No se encontraron propiedades con esos filtros.'
                : 'Agrega tu primera propiedad para empezar.'}
              action={{ label: 'Nueva Propiedad', onClick: () => { setEditingProp(null); setPropFormOpen(true); } }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProps.map(p => (
                <PropertyCard key={p.id} propiedad={p} onClick={setDetailProp} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: CONTRATOS ── */}
        <TabsContent value="contratos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingContract(null); setContractFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />Nuevo Contrato
            </Button>
          </div>
          {loadingContratos ? (
            <div className="grid gap-3"><KPISkeleton /><KPISkeleton /></div>
          ) : contratosWithWarning.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sin contratos"
              description="Registra el primer contrato de arrendamiento."
              action={{ label: 'Nuevo Contrato', onClick: () => { setEditingContract(null); setContractFormOpen(true); } }}
            />
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Arrendatario</TableHead>
                    <TableHead className="text-right">Renta</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratosWithWarning.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-[180px] truncate text-sm">{c.propDireccion}</TableCell>
                      <TableCell className="text-sm">{c.arrendatarioNombre}</TableCell>
                      <TableCell className="text-right text-sm font-medium">${c.montoMensual.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{c.fechaInicio}</TableCell>
                      <TableCell className="text-sm flex items-center gap-1">
                        {c.fechaFin || '—'}
                        {c.expiringSoon && <AlertTriangle className="w-4 h-4 text-warning" />}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.activo ? 'default' : 'outline'} className="text-xs">
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingContract(c); setContractFormOpen(true); }}>
                          <FileText className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: PAGOS ── */}
        <TabsContent value="pagos" className="space-y-4">
          {loadingPagos ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KPISkeleton /><KPISkeleton /><KPISkeleton /><KPISkeleton />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Cobrado</p><p className="text-xl font-bold text-foreground">${pagoKpis.cobrado.toLocaleString()}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendiente</p><p className="text-xl font-bold text-foreground">${pagoKpis.pendiente.toLocaleString()}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Atrasados</p><p className="text-xl font-bold text-destructive">{pagoKpis.atrasados}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tasa de Cobro</p><p className="text-xl font-bold text-foreground">{pagoKpis.tasa}%</p></CardContent></Card>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={() => { setEditingPayment(null); setPaymentFormOpen(true); }}
              disabled={contratos.filter(c => c.activo).length === 0}
            >
              <Plus className="w-4 h-4 mr-1" />Registrar Pago
            </Button>
          </div>
          {loadingPagos ? null : pagos.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sin pagos registrados"
              description={
                contratos.filter(c => c.activo).length === 0
                  ? 'Primero crea un contrato activo para poder registrar pagos.'
                  : 'Registra el primer pago de renta.'
              }
            />
          ) : (
            <PaymentTable
              pagos={pagos}
              propiedades={propiedades}
              onEdit={p => { setEditingPayment(p); setPaymentFormOpen(true); }}
            />
          )}
        </TabsContent>

        {/* ── TAB: MANTENIMIENTO ── */}
        <TabsContent value="mantenimiento" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => { setEditingMaint(null); setMaintFormOpen(true); }}
              disabled={propiedades.length === 0}
            >
              <Plus className="w-4 h-4 mr-1" />Nueva Solicitud
            </Button>
          </div>
          {loadingMant ? (
            <div className="grid gap-3"><KPISkeleton /><KPISkeleton /></div>
          ) : mantenimiento.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Sin solicitudes"
              description={
                propiedades.length === 0
                  ? 'Primero crea una propiedad para poder registrar mantenimiento.'
                  : 'Registra la primera solicitud de mantenimiento.'
              }
              action={propiedades.length > 0 ? {
                label: 'Nueva Solicitud',
                onClick: () => { setEditingMaint(null); setMaintFormOpen(true); },
              } : undefined}
            />
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Estimado</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mantenimiento.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {propiedades.find(p => p.id === m.propiedadId)?.direccion ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">{m.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={prioridadBadge[m.prioridad]} className="text-xs capitalize">{m.prioridad}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{estadoMantLabels[m.estado]}</TableCell>
                      <TableCell className="text-right text-sm">${m.costoEstimado.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{m.costoReal != null ? `$${m.costoReal.toLocaleString()}` : '—'}</TableCell>
                      <TableCell className="text-sm">{m.proveedor || '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingMaint(m); setMaintFormOpen(true); }}>
                          <Wrench className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PropertyFormModal
        open={propFormOpen}
        onClose={() => { setPropFormOpen(false); setEditingProp(null); }}
        propiedad={editingProp}
        onSave={handleSavePropiedad}
      />
      <PropertyDetailModal
        open={!!detailProp}
        onClose={() => setDetailProp(null)}
        propiedad={detailProp}
        onEdit={p => { setDetailProp(null); setEditingProp(p); setPropFormOpen(true); }}
        onDelete={(id: string) => {
          const p = propiedades.find(x => x.id === id) ?? detailProp;
          if (p) setDeletingProp(p);
        }}
        documentos={[]}
        onAddDocumento={(_tipo: TipoDocumento) => {}}
        onDeleteDocumento={() => {}}
      />
      <ContractFormModal
        open={contractFormOpen}
        onClose={() => { setContractFormOpen(false); setEditingContract(null); }}
        onSave={handleSaveContrato}
        propiedades={propiedades}
        contrato={editingContract}
      />
      <PaymentFormModal
        open={paymentFormOpen}
        onClose={() => { setPaymentFormOpen(false); setEditingPayment(null); }}
        onSave={handleSavePago}
        contratos={contratos}
        pago={editingPayment}
      />
      <MaintenanceFormModal
        open={maintFormOpen}
        onClose={() => { setMaintFormOpen(false); setEditingMaint(null); }}
        onSave={handleSaveMantenimiento}
        propiedades={propiedades}
        solicitud={editingMaint}
      />

      {/* Confirmar eliminación de propiedad */}
      <Dialog open={!!deletingProp} onOpenChange={v => !v && setDeletingProp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar propiedad?</DialogTitle>
            <DialogDescription>
              {deletingProp ? (
                <>Esta acción eliminará permanentemente <strong>{deletingProp.direccion}</strong>. No se puede deshacer.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingProp(null)} disabled={deletePropMut.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deletePropMut.isPending}>
              {deletePropMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
