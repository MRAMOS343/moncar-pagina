import { useState, useMemo } from 'react';
import { Truck, Plus, Wrench, Fuel, Search, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { VehicleCard } from '@/components/vehiculos/VehicleCard';
import { VehicleFormModal } from '@/components/vehiculos/VehicleFormModal';
import { VehicleDetailModal } from '@/components/vehiculos/VehicleDetailModal';
import { MaintenanceVehFormModal } from '@/components/vehiculos/MaintenanceVehFormModal';
import { ExpenseVehFormModal } from '@/components/vehiculos/ExpenseVehFormModal';
import { DocVehFormModal } from '@/components/vehiculos/DocVehFormModal';
import { useVehiculos } from '@/hooks/useVehiculos';
import type { Vehiculo, MantenimientoVehiculo, TipoDocVehiculo } from '@/types/vehiculos';

const tipoBadge: Record<string, 'default' | 'secondary'> = {
  preventivo: 'default',
  correctivo: 'secondary',
};
const tipoGastoLabels: Record<string, string> = {
  combustible: 'Combustible', casetas: 'Casetas', estacionamiento: 'Estacionamiento', multa: 'Multa', otro: 'Otro',
};

export default function VehiculosPage() {
  const {
    vehiculos, documentos, mantenimientos, gastos,
    addVehiculo, updateVehiculo, deleteVehiculo,
    addDocumento, deleteDocumento,
    addMantenimiento, updateMantenimiento,
    addGasto, deleteGasto,
  } = useVehiculos();

  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');

  // Modals
  const [vehFormOpen, setVehFormOpen] = useState(false);
  const [editingVeh, setEditingVeh] = useState<Vehiculo | null>(null);
  const [detailVeh, setDetailVeh] = useState<Vehiculo | null>(null);
  const [maintFormOpen, setMaintFormOpen] = useState(false);
  const [editingMaint, setEditingMaint] = useState<MantenimientoVehiculo | null>(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [docDefaultTipo, setDocDefaultTipo] = useState<TipoDocVehiculo | undefined>();
  const [docDefaultVehId, setDocDefaultVehId] = useState<string | undefined>();

  const filteredVehiculos = useMemo(() => {
    return vehiculos.filter(v => {
      if (search) {
        const q = search.toLowerCase();
        if (!v.placa.toLowerCase().includes(q) && !v.marca.toLowerCase().includes(q) && !v.modelo.toLowerCase().includes(q)) return false;
      }
      if (estadoFilter !== 'all' && v.estado !== estadoFilter) return false;
      return true;
    });
  }, [vehiculos, search, estadoFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const activos = vehiculos.filter(v => v.estado === 'activo').length;
    const enTaller = vehiculos.filter(v => v.estado === 'taller').length;
    const gastoMes = gastos
      .filter(g => g.fecha.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((s, g) => s + g.monto, 0);
    const mantenimientoMes = mantenimientos
      .filter(m => m.fecha.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((s, m) => s + m.costo, 0);
    return { activos, enTaller, gastoMes, mantenimientoMes };
  }, [vehiculos, gastos, mantenimientos]);

  const handleAddDocFromDetail = (tipo: TipoDocVehiculo) => {
    setDocDefaultTipo(tipo);
    setDocDefaultVehId(detailVeh?.id);
    setDocFormOpen(true);
  };

  const detailDocs = useMemo(() => {
    if (!detailVeh) return [];
    return documentos.filter(d => d.vehiculoId === detailVeh.id);
  }, [documentos, detailVeh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" />Flotilla de Vehículos</h1>
          <p className="text-sm text-muted-foreground">Administración de vehículos, mantenimiento y gastos de transporte</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="text-xl font-bold text-foreground">{kpis.activos}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">En Taller</p><p className="text-xl font-bold text-foreground">{kpis.enTaller}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Gastos (Mes)</p><p className="text-xl font-bold text-foreground">${kpis.gastoMes.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Mant. (Mes)</p><p className="text-xl font-bold text-foreground">${kpis.mantenimientoMes.toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="flotilla" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flotilla">Flotilla</TabsTrigger>
          <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
        </TabsList>

        {/* ── TAB: FLOTILLA ── */}
        <TabsContent value="flotilla" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar placa, marca..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="taller">En Taller</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setEditingVeh(null); setVehFormOpen(true); }} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />Nuevo Vehículo
            </Button>
          </div>
          {filteredVehiculos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No se encontraron vehículos</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVehiculos.map(v => (
                <VehicleCard key={v.id} vehiculo={v} onClick={setDetailVeh} />
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
                  <TableHead>Vehículo</TableHead>
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
                  const veh = vehiculos.find(v => v.id === m.vehiculoId);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">{veh ? `${veh.placa} — ${veh.marca}` : '—'}</TableCell>
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
                  <TableHead>Vehículo</TableHead>
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
                  const veh = vehiculos.find(v => v.id === g.vehiculoId);
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="text-sm">{veh ? `${veh.placa} — ${veh.marca}` : '—'}</TableCell>
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

      {/* Modals — conditional rendering forces remount & state reset */}
      {vehFormOpen && (
        <VehicleFormModal
          open={vehFormOpen}
          onClose={() => { setVehFormOpen(false); setEditingVeh(null); }}
          onSave={data => editingVeh ? updateVehiculo(editingVeh.id, data) : addVehiculo(data)}
          vehiculo={editingVeh}
        />
      )}
      {!!detailVeh && (
        <VehicleDetailModal
          open={!!detailVeh}
          onClose={() => setDetailVeh(null)}
          vehiculo={detailVeh}
          onEdit={v => { setDetailVeh(null); setEditingVeh(v); setVehFormOpen(true); }}
          onDelete={deleteVehiculo}
          documentos={detailDocs}
          onAddDocumento={handleAddDocFromDetail}
          onDeleteDocumento={deleteDocumento}
        />
      )}
      {maintFormOpen && (
        <MaintenanceVehFormModal
          open={maintFormOpen}
          onClose={() => { setMaintFormOpen(false); setEditingMaint(null); }}
          onSave={data => editingMaint ? updateMantenimiento(editingMaint.id, data) : addMantenimiento(data)}
          vehiculos={vehiculos}
          mantenimiento={editingMaint}
        />
      )}
      {expenseFormOpen && (
        <ExpenseVehFormModal
          open={expenseFormOpen}
          onClose={() => setExpenseFormOpen(false)}
          onSave={addGasto}
          vehiculos={vehiculos}
        />
      )}
      {docFormOpen && (
        <DocVehFormModal
          open={docFormOpen}
          onClose={() => { setDocFormOpen(false); setDocDefaultTipo(undefined); setDocDefaultVehId(undefined); }}
          onSave={addDocumento}
          vehiculos={vehiculos}
          defaultVehiculoId={docDefaultVehId}
          defaultTipo={docDefaultTipo}
        />
      )}
    </div>
  );
}
