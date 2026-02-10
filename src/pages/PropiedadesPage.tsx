import { useState, useMemo } from 'react';
import { Building2, Plus, FileText, DollarSign, Wrench, AlertTriangle, FolderOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PropertyCard } from '@/components/propiedades/PropertyCard';
import { PropertyFormModal } from '@/components/propiedades/PropertyFormModal';
import { PropertyDetailModal } from '@/components/propiedades/PropertyDetailModal';
import { ContractFormModal } from '@/components/propiedades/ContractFormModal';
import { PaymentTable } from '@/components/propiedades/PaymentTable';
import { PaymentFormModal } from '@/components/propiedades/PaymentFormModal';
import { MaintenanceFormModal } from '@/components/propiedades/MaintenanceFormModal';
import { DocumentTable } from '@/components/propiedades/DocumentTable';
import { DocumentFormModal } from '@/components/propiedades/DocumentFormModal';
import { PropertyFilters } from '@/components/propiedades/PropertyFilters';
import { usePropiedades } from '@/hooks/usePropiedades';
import type { Propiedad, Contrato, Pago, SolicitudMantenimiento } from '@/types/propiedades';

const prioridadBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  baja: 'outline', media: 'secondary', alta: 'default', urgente: 'destructive',
};
const estadoMantLabels: Record<string, string> = {
  pendiente: 'Pendiente', en_progreso: 'En Progreso', completado: 'Completado',
};

export default function PropiedadesPage() {
  const {
    propiedades, contratos, pagos, mantenimiento,
    addPropiedad, updatePropiedad, deletePropiedad,
    addContrato, updateContrato,
    addPago, updatePago,
    addMantenimiento, updateMantenimiento,
  } = usePropiedades();

  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');

  // Modals
  const [propFormOpen, setPropFormOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Propiedad | null>(null);
  const [detailProp, setDetailProp] = useState<Propiedad | null>(null);
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

  // KPIs for Pagos tab
  const pagoKpis = useMemo(() => {
    const cobrado = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.montoPagado, 0);
    const pendiente = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'parcial').reduce((s, p) => s + (p.montoEsperado - p.montoPagado), 0);
    const atrasados = pagos.filter(p => p.estado === 'atrasado').length;
    const total = pagos.length;
    const tasa = total > 0 ? Math.round((pagos.filter(p => p.estado === 'pagado').length / total) * 100) : 0;
    return { cobrado, pendiente, atrasados, tasa };
  }, [pagos]);

  // Contratos with expiry warning
  const contratosWithWarning = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    return contratos.map(c => ({
      ...c,
      expiringSoon: c.activo && new Date(c.fechaFin) <= in30,
      propDireccion: propiedades.find(p => p.id === c.propiedadId)?.direccion ?? '—',
    }));
  }, [contratos, propiedades]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-primary" />Propiedades en Renta</h1>
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
            <PropertyFilters search={search} onSearchChange={setSearch} estadoFilter={estadoFilter} onEstadoChange={setEstadoFilter} tipoFilter={tipoFilter} onTipoChange={setTipoFilter} />
            <Button onClick={() => { setEditingProp(null); setPropFormOpen(true); }} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />Nueva Propiedad
            </Button>
          </div>
          {filteredProps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No se encontraron propiedades</div>
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
                {contratosWithWarning.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin contratos</TableCell></TableRow>
                )}
                {contratosWithWarning.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-[180px] truncate text-sm">{c.propDireccion}</TableCell>
                    <TableCell className="text-sm">{c.arrendatarioNombre}</TableCell>
                    <TableCell className="text-right text-sm font-medium">${c.montoMensual.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{c.fechaInicio}</TableCell>
                    <TableCell className="text-sm flex items-center gap-1">
                      {c.fechaFin}
                      {c.expiringSoon && <AlertTriangle className="w-4 h-4 text-warning" />}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.activo ? 'default' : 'outline'} className="text-xs">{c.activo ? 'Activo' : 'Inactivo'}</Badge>
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
        </TabsContent>

        {/* ── TAB: PAGOS ── */}
        <TabsContent value="pagos" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Cobrado</p><p className="text-xl font-bold text-foreground">${pagoKpis.cobrado.toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendiente</p><p className="text-xl font-bold text-foreground">${pagoKpis.pendiente.toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Atrasados</p><p className="text-xl font-bold text-destructive">{pagoKpis.atrasados}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Tasa de Cobro</p><p className="text-xl font-bold text-foreground">{pagoKpis.tasa}%</p></CardContent></Card>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => { setEditingPayment(null); setPaymentFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />Registrar Pago
            </Button>
          </div>
          <PaymentTable pagos={pagos} propiedades={propiedades} onEdit={p => { setEditingPayment(p); setPaymentFormOpen(true); }} />
        </TabsContent>

        {/* ── TAB: MANTENIMIENTO ── */}
        <TabsContent value="mantenimiento" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingMaint(null); setMaintFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />Nueva Solicitud
            </Button>
          </div>
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
                {mantenimiento.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin solicitudes</TableCell></TableRow>
                )}
                {mantenimiento.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="max-w-[160px] truncate text-sm">{propiedades.find(p => p.id === m.propiedadId)?.direccion ?? '—'}</TableCell>
                    <TableCell className="text-sm">{m.titulo}</TableCell>
                    <TableCell><Badge variant={prioridadBadge[m.prioridad]} className="text-xs capitalize">{m.prioridad}</Badge></TableCell>
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
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PropertyFormModal
        open={propFormOpen}
        onClose={() => setPropFormOpen(false)}
        propiedad={editingProp}
        onSave={data => editingProp ? updatePropiedad(editingProp.id, data) : addPropiedad(data)}
      />
      <PropertyDetailModal
        open={!!detailProp}
        onClose={() => setDetailProp(null)}
        propiedad={detailProp}
        onEdit={p => { setDetailProp(null); setEditingProp(p); setPropFormOpen(true); }}
        onDelete={deletePropiedad}
      />
      <ContractFormModal
        open={contractFormOpen}
        onClose={() => { setContractFormOpen(false); setEditingContract(null); }}
        onSave={data => editingContract ? updateContrato(editingContract.id, data) : addContrato(data)}
        propiedades={propiedades}
        contrato={editingContract}
      />
      <PaymentFormModal
        open={paymentFormOpen}
        onClose={() => { setPaymentFormOpen(false); setEditingPayment(null); }}
        onSave={data => editingPayment ? updatePago(editingPayment.id, data) : addPago(data)}
        contratos={contratos}
        pago={editingPayment}
      />
      <MaintenanceFormModal
        open={maintFormOpen}
        onClose={() => { setMaintFormOpen(false); setEditingMaint(null); }}
        onSave={data => editingMaint ? updateMantenimiento(editingMaint.id, data) : addMantenimiento(data)}
        propiedades={propiedades}
        solicitud={editingMaint}
      />
    </div>
  );
}
