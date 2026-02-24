import { useState, useMemo } from 'react';
import { Truck, Search, AlertTriangle, FileText, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RutaCollapsible } from '@/components/vehiculos/RutaCollapsible';
import { VehicleDetailModal } from '@/components/vehiculos/VehicleDetailModal';
import { DocVehFormModal } from '@/components/vehiculos/DocVehFormModal';
import { AlertConfigModal } from '@/components/vehiculos/AlertConfigModal';
import { useVehiculos } from '@/hooks/useVehiculos';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import type { Unidad, TipoDocUnidad } from '@/types/vehiculos';

type PlazoVencer = '7d' | '1m' | '2m';
const plazoLabels: Record<PlazoVencer, string> = { '7d': '7 días', '1m': '1 mes', '2m': '2 meses' };
const plazoDays: Record<PlazoVencer, number> = { '7d': 7, '1m': 30, '2m': 60 };

export default function VehiculosPage() {
  const {
    rutas, unidades, documentos, alertas,
    addDocumento, deleteDocumento, upsertAlerta,
  } = useVehiculos();

  const [search, setSearch] = useState('');
  const [plazoVencer, setPlazoVencer] = useState<PlazoVencer>('1m');

  // Modals
  const [docFormOpen, setDocFormOpen] = useState(false);
  const [docDefaultTipo, setDocDefaultTipo] = useState<TipoDocUnidad | undefined>();
  const [docDefaultUnidadId, setDocDefaultUnidadId] = useState<string | undefined>();
  const [alertModalUnidadId, setAlertModalUnidadId] = useState<string | null>(null);
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const now = Date.now();
    const plazoMs = plazoDays[plazoVencer] * 86400000;
    let vencidos = 0, porVencer = 0;
    for (const d of documentos) {
      if (!d.vigencia) continue;
      const diff = new Date(d.vigencia).getTime() - now;
      if (diff < 0) vencidos++;
      else if (diff <= plazoMs) porVencer++;
    }
    return { vencidos, porVencer };
  }, [documentos, plazoVencer]);

  // Docs por vencer agrupados por unidad
  const docsPorVencer = useMemo(() => {
    const now = Date.now();
    const plazoMs = plazoDays[plazoVencer] * 86400000;
    const groups: { unidad: Unidad; docs: { nombre: string; tipo: string; vigencia: string }[] }[] = [];

    for (const u of unidades) {
      const uDocs = documentos.filter(d =>
        d.unidadId === u.id && d.vigencia &&
        (() => { const diff = new Date(d.vigencia!).getTime() - now; return diff >= 0 && diff <= plazoMs; })()
      );
      if (uDocs.length > 0) {
        groups.push({
          unidad: u,
          docs: uDocs.map(d => ({
            nombre: d.nombre,
            tipo: TIPO_DOC_LABELS[d.tipo],
            vigencia: d.vigencia!,
          })),
        });
      }
    }
    return groups;
  }, [documentos, unidades, plazoVencer]);

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
      {docsPorVencer.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:underline">
            <ChevronDown className="w-4 h-4" />
            Ver {kpis.porVencer} documento(s) por vencer en {plazoLabels[plazoVencer]}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {docsPorVencer.map(({ unidad, docs }) => (
              <Card key={unidad.id}>
                <CardContent className="p-3 space-y-1">
                  <p className="text-sm font-semibold">Unidad {unidad.numero} — {unidad.placa}</p>
                  {docs.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{d.nombre} <Badge variant="outline" className="ml-1 text-[10px]">{d.tipo}</Badge></span>
                      <span className="text-amber-600 font-medium">{d.vigencia}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Buscador + Flotilla */}
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
              onSelectUnidad={setSelectedUnidad}
            />
          ))}
        </div>
      )}

      {/* Modals */}
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
      {selectedUnidad && (
        <VehicleDetailModal
          open={!!selectedUnidad}
          onClose={() => setSelectedUnidad(null)}
          unidad={selectedUnidad}
          documentos={documentos.filter(d => d.unidadId === selectedUnidad.id)}
          alertas={alertas.filter(a => a.unidadId === selectedUnidad.id)}
          onAddDoc={handleAddDoc}
          onDeleteDoc={deleteDocumento}
          onConfigAlertas={(unidadId) => { setSelectedUnidad(null); setAlertModalUnidadId(unidadId); }}
        />
      )}
    </div>
  );
}
