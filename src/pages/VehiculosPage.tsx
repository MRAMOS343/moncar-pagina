import { useState, useMemo } from 'react';
import { Truck, Search, AlertTriangle, FileText, ChevronDown, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { RutaCollapsible } from '@/components/vehiculos/RutaCollapsible';
import { VehicleDetailModal } from '@/components/vehiculos/VehicleDetailModal';
import { DocVehFormModal } from '@/components/vehiculos/DocVehFormModal';
import { AlertConfigModal } from '@/components/vehiculos/AlertConfigModal';
import { RutaFormModal } from '@/components/vehiculos/RutaFormModal';
import { UnidadFormModal } from '@/components/vehiculos/UnidadFormModal';
import { useRutas, useDocsPorVencer, useCreateRuta, useUpdateRuta, useDeleteRuta, useCreateUnidad, useUpdateUnidad, useCreateDocumento } from '@/hooks/useVehiculosAPI';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import type { Unidad, Ruta, TipoDocUnidad } from '@/types/vehiculos';
import { toast } from 'sonner';
import { ApiError } from '@/services/apiClient';

type PlazoVencer = '7d' | '1m' | '2m';
const plazoLabels: Record<PlazoVencer, string> = { '7d': '7 días', '1m': '1 mes', '2m': '2 meses' };
const plazoDays: Record<PlazoVencer, number> = { '7d': 7, '1m': 30, '2m': 60 };

export default function VehiculosPage() {
  const { data: rutas = [], isLoading: rutasLoading, isError, refetch } = useRutas();
  const [plazoVencer, setPlazoVencer] = useState<PlazoVencer>('1m');
  const { data: porVencerData } = useDocsPorVencer(plazoDays[plazoVencer]);

  const [search, setSearch] = useState('');

  // Modals
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  const [docFormUnidadId, setDocFormUnidadId] = useState<string | null>(null);
  const [alertModalUnidadId, setAlertModalUnidadId] = useState<string | null>(null);
  const [alertModalLabel, setAlertModalLabel] = useState('');

  // Ruta CRUD
  const [rutaFormOpen, setRutaFormOpen] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | null>(null);
  const createRuta = useCreateRuta();
  const updateRuta = useUpdateRuta();
  const deleteRuta = useDeleteRuta();

  // Unidad CRUD
  const [unidadFormOpen, setUnidadFormOpen] = useState(false);
  const [unidadFormRutaId, setUnidadFormRutaId] = useState<string | null>(null);
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null);
  const createUnidad = useCreateUnidad();
  const updateUnidad = useUpdateUnidad();

  // Doc CRUD
  const createDocumento = useCreateDocumento();

  // KPIs
  const kpis = useMemo(() => {
    if (!porVencerData) return { vencidos: 0, porVencer: 0 };
    // The API returns docs about to expire; we count them
    return { vencidos: 0, porVencer: porVencerData.items.length };
  }, [porVencerData]);

  // Filtered rutas
  const filteredRutas = useMemo(() => {
    if (!search) return rutas;
    const q = search.toLowerCase();
    return rutas.filter(r => r.nombre.toLowerCase().includes(q));
  }, [rutas, search]);

  // Ruta handlers
  const handleSaveRuta = (data: { nombre: string; descripcion?: string; activa?: boolean }) => {
    if (editingRuta) {
      updateRuta.mutate({ id: editingRuta.id, data }, {
        onSuccess: () => { toast.success('Ruta actualizada'); setRutaFormOpen(false); setEditingRuta(null); },
        onError: () => toast.error('Error al actualizar ruta'),
      });
    } else {
      createRuta.mutate(data, {
        onSuccess: () => { toast.success('Ruta creada'); setRutaFormOpen(false); },
        onError: () => toast.error('Error al crear ruta'),
      });
    }
  };

  const handleDeleteRuta = (rutaId: string) => {
    deleteRuta.mutate(rutaId, {
      onSuccess: () => toast.success('Ruta eliminada'),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          toast.error('No se puede eliminar: la ruta tiene unidades asignadas');
        } else {
          toast.error('Error al eliminar ruta');
        }
      },
    });
  };

  // Unidad handlers
  const handleSaveUnidad = (data: Parameters<typeof createUnidad.mutate>[0]['data']) => {
    if (editingUnidad) {
      updateUnidad.mutate({ id: editingUnidad.id, data }, {
        onSuccess: () => { toast.success('Unidad actualizada'); setUnidadFormOpen(false); setEditingUnidad(null); },
        onError: () => toast.error('Error al actualizar unidad'),
      });
    } else if (unidadFormRutaId) {
      createUnidad.mutate({ rutaId: unidadFormRutaId, data }, {
        onSuccess: () => { toast.success('Unidad creada'); setUnidadFormOpen(false); setUnidadFormRutaId(null); },
        onError: () => toast.error('Error al crear unidad'),
      });
    }
  };

  // Doc handler
  const handleAddDoc = (unidadId: string) => {
    setDocFormUnidadId(unidadId);
  };

  const handleSaveDoc = (data: { tipo: string; nombre: string; notas?: string; fecha_documento?: string; vigencia_hasta?: string; archivo_id?: string }) => {
    if (!docFormUnidadId) return;
    createDocumento.mutate({ unidadId: docFormUnidadId, data }, {
      onSuccess: () => { toast.success('Documento creado'); setDocFormUnidadId(null); },
      onError: () => toast.error('Error al crear documento'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" />Flotilla de Vehículos</h1>
          <p className="text-sm text-muted-foreground">Rutas, unidades y documentación de transporte</p>
        </div>
        <Button onClick={() => { setEditingRuta(null); setRutaFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Nueva Ruta
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
          <div><p className="text-xs text-muted-foreground">Docs Vencidos</p><p className="text-xl font-bold text-destructive">{kpis.vencidos}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><FileText className="w-5 h-5 text-amber-600" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Por Vencer</p>
              <Select value={plazoVencer} onValueChange={v => setPlazoVencer(v as PlazoVencer)}>
                <SelectTrigger className="h-6 w-auto text-xs px-2 py-0 border-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 días</SelectItem>
                  <SelectItem value="1m">1 mes</SelectItem>
                  <SelectItem value="2m">2 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xl font-bold text-foreground">{kpis.porVencer}</p>
          </div>
        </CardContent></Card>
      </div>

      {/* Docs por vencer detail */}
      {porVencerData && porVencerData.items.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:underline">
            <ChevronDown className="w-4 h-4" />
            Ver {porVencerData.items.length} documento(s) por vencer en {plazoLabels[plazoVencer]}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {porVencerData.items.map(d => (
              <Card key={d.id}>
                <CardContent className="p-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{d.nombre}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{TIPO_DOC_LABELS[d.tipo]}</Badge>
                    <span className="text-amber-600 font-medium text-xs">{d.vigenciaHasta}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Search + Fleet */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar ruta..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {rutasLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : isError ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">Error al cargar rutas</p>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Reintentar</Button>
        </div>
      ) : filteredRutas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No se encontraron rutas</div>
      ) : (
        <div className="space-y-3">
          {filteredRutas.map(r => (
            <RutaCollapsible
              key={r.id}
              ruta={r}
              onSelectUnidad={setSelectedUnidad}
              onEditRuta={(ruta) => { setEditingRuta(ruta); setRutaFormOpen(true); }}
              onDeleteRuta={handleDeleteRuta}
              onAddUnidad={(rutaId) => { setUnidadFormRutaId(rutaId); setEditingUnidad(null); setUnidadFormOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RutaFormModal
        open={rutaFormOpen}
        onClose={() => { setRutaFormOpen(false); setEditingRuta(null); }}
        onSave={handleSaveRuta}
        ruta={editingRuta}
        loading={createRuta.isPending || updateRuta.isPending}
      />

      <UnidadFormModal
        open={unidadFormOpen}
        onClose={() => { setUnidadFormOpen(false); setEditingUnidad(null); setUnidadFormRutaId(null); }}
        onSave={handleSaveUnidad}
        unidad={editingUnidad}
        loading={createUnidad.isPending || updateUnidad.isPending}
      />

      {docFormUnidadId && (
        <DocVehFormModal
          open={!!docFormUnidadId}
          onClose={() => setDocFormUnidadId(null)}
          onSave={handleSaveDoc}
          loading={createDocumento.isPending}
        />
      )}

      {alertModalUnidadId && (
        <AlertConfigModal
          open={!!alertModalUnidadId}
          onClose={() => setAlertModalUnidadId(null)}
          unidadId={alertModalUnidadId}
          unidadLabel={alertModalLabel}
        />
      )}

      {selectedUnidad && (
        <VehicleDetailModal
          open={!!selectedUnidad}
          onClose={() => setSelectedUnidad(null)}
          unidad={selectedUnidad}
          onAddDoc={handleAddDoc}
          onConfigAlertas={(unidadId) => {
            setAlertModalLabel(selectedUnidad.numero);
            setSelectedUnidad(null);
            setAlertModalUnidadId(unidadId);
          }}
          onEditUnidad={(u) => {
            setSelectedUnidad(null);
            setEditingUnidad(u);
            setUnidadFormRutaId(u.rutaId);
            setUnidadFormOpen(true);
          }}
        />
      )}
    </div>
  );
}
