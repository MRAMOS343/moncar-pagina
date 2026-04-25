import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { TipoDocUnidad } from '@/types/vehiculos';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import { useAlertas, useUpsertAlerta } from '@/hooks/useVehiculosAPI';
import { toast } from 'sonner';

const ALL_TIPOS: TipoDocUnidad[] = ['cromatica', 'factura', 'poliza_seguro', 'tarjeta_circulacion', 'titulo_concesion', 'verificacion', 'permiso'];

interface AlertConfig {
  tipoDocumento: TipoDocUnidad;
  diasAntes: number;
  activa: boolean;
}

function buildConfigs(alertas: ReturnType<typeof useAlertas>['data']): AlertConfig[] {
  return ALL_TIPOS.map(tipo => {
    const existing = (alertas ?? []).find(a => a.tipoDocumento === tipo);
    return {
      tipoDocumento: tipo,
      diasAntes: existing?.diasAntes ?? 30,
      activa: existing?.activa ?? tipo === 'poliza_seguro',
    };
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  unidadId: string;
  unidadLabel: string;
}

export function AlertConfigModal({ open, onClose, unidadId, unidadLabel }: Props) {
  const { data: alertas, isSuccess } = useAlertas(unidadId);
  const upsertAlerta = useUpsertAlerta();

  const [configs, setConfigs] = useState<AlertConfig[]>(() => buildConfigs([]));
  // Track whether we have initialized from real server data to avoid overwriting
  // user edits if React Query does a background refetch while the modal is open.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isSuccess && !initializedRef.current) {
      initializedRef.current = true;
      setConfigs(buildConfigs(alertas));
    }
  }, [isSuccess, alertas]);

  // Reset initialization flag when the modal closes so next open starts fresh.
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
    }
  }, [open]);

  const update = (idx: number, field: string, value: unknown) => {
    setConfigs(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    try {
      for (const c of configs) {
        await upsertAlerta.mutateAsync({
          unidadId,
          tipoDocumento: c.tipoDocumento,
          data: { dias_antes: c.diasAntes, activa: c.activa },
        });
      }
      toast.success('Alertas actualizadas');
      onClose();
    } catch {
      toast.error('Error al guardar alertas');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Alertas — Unidad {unidadLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {configs.map((c, idx) => (
            <div key={c.tipoDocumento} className="flex items-center gap-3 py-2 border-b last:border-b-0">
              <Switch checked={c.activa} onCheckedChange={v => update(idx, 'activa', v)} />
              <span className="text-sm flex-1">{TIPO_DOC_LABELS[c.tipoDocumento]}</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={c.diasAntes}
                  onChange={e => update(idx, 'diasAntes', +e.target.value)}
                  className="w-16 h-8 text-xs text-center"
                  disabled={!c.activa}
                />
                <Label className="text-xs text-muted-foreground">días</Label>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsertAlerta.isPending}>
            {upsertAlerta.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
