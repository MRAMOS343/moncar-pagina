import { useState, useMemo } from 'react';
import { Truck, Plus, Wrench, Search, Trash2, AlertTriangle, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RutaCollapsible } from '@/components/vehiculos/RutaCollapsible';
import { MaintenanceVehFormModal } from '@/components/vehiculos/MaintenanceVehFormModal';
import { ExpenseVehFormModal } from '@/components/vehiculos/ExpenseVehFormModal';
import { DocVehFormModal } from '@/components/vehiculos/DocVehFormModal';
import { AlertConfigModal } from '@/components/vehiculos/AlertConfigModal';
import { useVehiculos } from '@/hooks/useVehiculos';
import type { MantenimientoVehiculo, TipoDocUnidad } from '@/types/vehiculos';

const tipoBadge: Record<string, 'default' | 'secondary'> = {
  preventivo: 'default',
  correctivo: 'secondary',
};
const tipoGastoLabels: Record<string, string> = {
  combustible: 'Combustible', casetas: 'Casetas', estacionamiento: 'Estacionamiento', multa: 'Multa', otro: 'Otro',
};

export default function VehiculosPage() {
  const {
    rutas, unidades, documentos, mantenimientos, gastos, alertas,
    addDocumento, deleteDocumento,
    addMantenimiento, updateMantenimiento,
    addGasto, deleteGasto,
    upsertAlerta,
  } = useVehiculos();

  // Filters
  const [search, setSearch] = useState('');

  // Modals
  const [maintFormOpen, setMaintFormOpen] = useState(false);
  const [editingMaint, setEditingMaint] = useState<MantenimientoVehiculo | null>(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [docDefaultTipo, setDocDefaultTipo] = useState<TipoDocUnidad | undefined>();
  const [docDefaultUnidadId, setDocDefaultUnidadId] = useState<string | undefined>();
  const [alertModalUnidadId, setAlertModalUnidadId] = useState<string | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const now = Date.now();
    let vencidos = 0, porVencer = 0;
    for (const d of documentos) {
      if (!d.vigencia) continue;
      const diff = new Date(d.vigencia).getTime() - now;
      if (diff < 0) vencidos++;
      else if (diff <= 30 * 86400000) porVencer++;
    }
    return { vencidos, porVencer };
  }, [documentos]);

  // Filtered rutas
  const filteredRutas = useMemo(() => {
    if (!search) return rutas;
    const q = search.toLowerCase();
    return rutas.filter(r => {
      if (r.nombre.toLowerCase().includes(q)) return true;
      const rutaUnidades = unidades.filter(u => u.rutaId === r.id);
      return rutaUnidades.some(u =>
        u.numero.toLowerCase().includes(q) ||
        u.placa.toLowerCase().includes(q) ||
        u.marca.toLowerCase().includes(q)
      );
    });
  }, [rutas, unidades, search]);

  const handleAddDoc = (unidadId: string, tipo?: TipoDocUnidad) => {
    setDocDefaultUnidadId(unidadId);
    setDocDefaultTipo(tipo);
    setDocFormOpen(true);
  };

  const alertModalUnidad = alertModalUnidadId ? unidades.find(u => u.id === alertModalUnidadId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" />Flotilla de Vehículos</h1>
          <p className="text-sm text-muted-foreground">Rutas, unidades y documentación de transporte</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
          <div><p className="text-xs text-muted-foreground">Docs Vencidos</p><p className="text-xl font-bold text-destructive">{kpis.vencidos}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Por Vencer (30d)</p><p className="text-xl font-bold text-foreground">{kpis.porVencer}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="flotilla" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flotilla">Flotilla</TabsTrigger>
          <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
        </TabsList>

        {/* ── TAB: FLOTILLA ── */}
        <TabsContent value="flotilla" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar ruta, unidad, placa..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {filteredRutas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No se encontraron rutas</div>
          ) : (
            <div className="space-y-3">
              {filteredRutas.map(r => (
                <RutaCollapsible
                  key={r.id}
                  ruta={r}
                  unidades={unidades.filter(u => u.rutaId === r.id)}
                  documentos={documentos.filter(d => unidades.some(u => u.rutaId === r.id && u.id === d.unidadId))}
                  alertas={alertas.filter(a => unidades.some(u => u.rutaId === r.id && u.id === a.unidadId))}
                  onAddDoc={handleAddDoc}
                  onDeleteDoc={deleteDocumento}
                  onConfigAlertas={(unidadId) => setAlertModalUnidadId(unidadId)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: MANTENIMIENTO ── */}
        <TabsContent value="mantenimiento" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingMaint(null); setMaintFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />Registrar Servicio
            </Button>
          </div>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Km</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mantenimientos.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin registros</TableCell></TableRow>
                )}
                {mantenimientos.map(m => {
                  const u = unidades.find(v => v.id === m.unidadId);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{u ? `Unidad ${u.numero} — ${u.placa}` : '—'}</TableCell>
                      <TableCell className="text-sm">{m.fecha}</TableCell>
                      <TableCell><Badge variant={tipoBadge[m.tipo]} className="text-xs capitalize">{m.tipo}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{m.descripcion}</TableCell>
                      <TableCell className="text-right text-sm">{m.km.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-medium">${m.costo.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{m.proveedor || '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingMaint(m); setMaintFormOpen(true); }}>
                          <Wrench className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── TAB: GASTOS ── */}
        <TabsContent value="gastos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setExpenseFormOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />Registrar Gasto
            </Button>
          </div>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin gastos</TableCell></TableRow>
                )}
                {gastos.map(g => {
                  const u = unidades.find(v => v.id === g.unidadId);
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="text-sm">{u ? `Unidad ${u.numero} — ${u.placa}` : '—'}</TableCell>
                      <TableCell className="text-sm">{g.fecha}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{tipoGastoLabels[g.tipo]}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{g.descripcion}</TableCell>
                      <TableCell className="text-right text-sm font-medium">${g.monto.toLocaleString()}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará el registro de ${g.monto.toLocaleString()} ({tipoGastoLabels[g.tipo]}).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteGasto(g.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {maintFormOpen && (
        <MaintenanceVehFormModal
          open={maintFormOpen}
          onClose={() => { setMaintFormOpen(false); setEditingMaint(null); }}
          onSave={data => editingMaint ? updateMantenimiento(editingMaint.id, data) : addMantenimiento(data)}
          unidades={unidades}
          mantenimiento={editingMaint}
        />
      )}
      {expenseFormOpen && (
        <ExpenseVehFormModal
          open={expenseFormOpen}
          onClose={() => setExpenseFormOpen(false)}
          onSave={addGasto}
          unidades={unidades}
        />
      )}
      {docFormOpen && (
        <DocVehFormModal
          open={docFormOpen}
          onClose={() => { setDocFormOpen(false); setDocDefaultTipo(undefined); setDocDefaultUnidadId(undefined); }}
          onSave={addDocumento}
          unidades={unidades}
          defaultUnidadId={docDefaultUnidadId}
          defaultTipo={docDefaultTipo}
        />
      )}
      {alertModalUnidad && (
        <AlertConfigModal
          open={!!alertModalUnidadId}
          onClose={() => setAlertModalUnidadId(null)}
          unidadId={alertModalUnidad.id}
          unidadLabel={alertModalUnidad.numero}
          alertas={alertas.filter(a => a.unidadId === alertModalUnidad.id)}
          onSave={upsertAlerta}
        />
      )}
    </div>
  );
}
