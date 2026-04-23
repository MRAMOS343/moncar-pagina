import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ChevronRight,
  Download,
  RefreshCw,
  Info,
  X,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompraSugerida } from '@/hooks/useCompraSugerida';
import { crearPreOrden, recalcularCompras, exportarCompraSugerida, type CompraSugeridaItem } from '@/services/compraService';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { User } from '@/types';

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
}

type Prioridad = 'urgente' | 'normal' | 'opcional';
type SortKey = 'prioridad' | 'cobertura' | 'total' | 'sku';

// ─── CoverageBar ───────────────────────────────────────────────────────────────
function CoverageBar({ dias }: { dias: number }) {
  const pct = Math.min(100, (dias / 30) * 100);
  const colorClass =
    dias < 7 ? 'bg-destructive' : dias < 14 ? 'bg-yellow-500' : 'bg-green-500';
  const textClass =
    dias < 7
      ? 'text-destructive font-semibold'
      : 'text-muted-foreground';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-xs tabular-nums ${textClass}`}>
        {Math.round(dias)}d
      </span>
    </div>
  );
}

// ─── PrioridadBadge ───────────────────────────────────────────────────────────
function PrioridadBadge({ prioridad }: { prioridad: Prioridad }) {
  const configs = {
    urgente: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      dot: 'bg-destructive',
      label: 'Urgente',
    },
    normal: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      dot: 'bg-yellow-500',
      label: 'Normal',
    },
    opcional: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      dot: 'bg-green-500',
      label: 'Opcional',
    },
  };
  const c = configs[prioridad];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── KPIStripCell ─────────────────────────────────────────────────────────────
interface KPIStripCellProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}

function KPIStripCell({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  hint,
  active,
  onClick,
}: KPIStripCellProps) {
  const Tag = onClick ? 'button' : ('div' as React.ElementType);
  return (
    <Tag
      onClick={onClick}
      className={[
        'px-5 py-4 flex items-center gap-3 text-left transition-all w-full',
        onClick ? 'cursor-pointer hover:bg-muted/60' : '',
        active ? 'bg-primary/5 ring-inset ring-2 ring-primary' : '',
      ].join(' ')}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className="text-xl font-bold leading-tight">{value}</div>
        {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
      </div>
    </Tag>
  );
}

// ─── ItemDetailPanel ──────────────────────────────────────────────────────────
function ItemDetailPanel({ item }: { item: CompraSugeridaItem }) {
  const velocidadSemanal = (item.promedio_diario * 7).toFixed(1);
  const stats = [
    { label: 'Promedio diario', value: item.promedio_diario.toFixed(1), sub: 'pzas/día' },
    { label: 'Velocidad semanal', value: velocidadSemanal, sub: 'pzas/semana' },
    { label: 'Stock máx.', value: item.stock_maximo, sub: `mín ${item.stock_minimo}` },
    { label: 'Categoría', value: item.categoria, sub: item.unidad },
  ];
  return (
    <div className="px-12 py-4 bg-muted/30 border-t">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Detalle del producto
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub }) => (
          <div key={label} className="bg-background rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="font-mono text-lg font-bold tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>
      {item.proveedor_nombre && (
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{item.proveedor_nombre}</span>
          {item.lead_dias != null && <span>· Lead {item.lead_dias} días</span>}
          {item.precio_compra != null && (
            <span>· P. compra: {formatCurrency(item.precio_compra)}</span>
          )}
        </div>
      )}
      {item.calculado_en && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Calculado:{' '}
          {format(new Date(item.calculado_en), "d 'de' MMMM, h:mm a", { locale: es })}
        </p>
      )}
    </div>
  );
}

// ─── PreOrderModal ────────────────────────────────────────────────────────────
interface PreOrderModalProps {
  open: boolean;
  onClose: () => void;
  items: CompraSugeridaItem[];
  cantidades: Record<string, number>;
  onConfirm: (notas: string) => Promise<void>;
  submitting: boolean;
  onExportExcel: () => void;
}

function PreOrderModal({
  open,
  onClose,
  items,
  cantidades,
  onConfirm,
  submitting,
  onExportExcel,
}: PreOrderModalProps) {
  const [step, setStep] = useState<'review' | 'export'>('review');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('review');
      setNotas('');
    }
  }, [open]);

  if (!open) return null;

  const pc = (i: CompraSugeridaItem) => i.precio_compra ?? i.precio;
  const total = items.reduce((s, i) => s + (cantidades[i.sku] ?? 0) * pc(i), 0);
  const totalUnits = items.reduce((s, i) => s + (cantidades[i.sku] ?? 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'review' ? (
          <>
            {/* Header */}
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Pre-orden de compra</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {items.length} productos · {totalUnits} piezas
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="border rounded-lg divide-y">
                {items.map((item) => (
                  <div
                    key={item.sku}
                    className="px-4 py-2 flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium">{item.nombre}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {item.sku}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div>
                        {cantidades[item.sku]} × {formatCurrency(pc(item))}
                      </div>
                      <div className="font-semibold">
                        {formatCurrency((cantidades[item.sku] ?? 0) * pc(item))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Notas internas (opcional)
                </label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Consolidar con pedido semanal"
                  className="min-h-[70px]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t bg-muted/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Total
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums">
                  {formatCurrency(total)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={submitting}>
                  Cancelar
                </Button>
                <Button onClick={() => onConfirm(notas)} disabled={submitting}>
                  {submitting ? 'Enviando…' : 'Confirmar pre-orden'}
                  {!submitting && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Export step header */}
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <button
                  onClick={() => setStep('review')}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver
                </button>
                <h2 className="text-xl font-bold">Descargar pre-orden</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Documento para uso interno — no se envía al proveedor
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Export options */}
            <div className="p-6 space-y-3">
              {[
                {
                  icon: <FileText className="w-6 h-6" />,
                  iconCls: 'bg-destructive/10 text-destructive',
                  title: 'Descargar como PDF',
                  desc: 'Documento imprimible con desglose detallado',
                  onClick: () => toast.info('Función de exportación próximamente.'),
                },
                {
                  icon: (
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M8 13h8" />
                      <path d="M8 17h8" />
                      <path d="M8 9h2" />
                    </svg>
                  ),
                  iconCls:
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  title: 'Descargar como Excel',
                  desc: 'Hoja de cálculo editable para ajustar antes de ordenar',
                  onClick: () => {
                    onExportExcel();
                    onClose();
                  },
                },
              ].map(({ icon, iconCls, title, desc, onClick }) => (
                <button
                  key={title}
                  onClick={onClick}
                  className="w-full p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconCls}`}
                  >
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                  <Download className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>

            <div className="p-5 border-t flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ComprasPage() {
  const { currentWarehouse, searchQuery, currentUser } = useOutletContext<ContextType>();
  const { token } = useAuth();

  const [prioridadFilter, setPrioridadFilter] = useState<Prioridad | null>(null);
  const [lineaFilter, setLineaFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('prioridad');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [preOrderOpen, setPreOrderOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const warehouseParam = currentWarehouse === 'all' ? undefined : currentWarehouse;
  const { data, isLoading, isError, refetch } = useCompraSugerida(warehouseParam);

  useEffect(() => {
    if (isError) toast.error('Error al cargar las sugerencias de compra.');
  }, [isError]);

  useEffect(() => {
    if (data?.items) {
      const initial: Record<string, number> = {};
      data.items.forEach((item) => {
        initial[item.sku] = item.cantidad_sugerida;
      });
      setCantidades(initial);
      setSelected(new Set());
    }
  }, [data]);

  const items = data?.items ?? [];
  const resumen = data?.resumen ?? { urgente: 0, normal: 0, opcional: 0 };

  const lineas = useMemo(
    () => [...new Set(items.map((i) => i.categoria))].sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    let arr = items;
    if (prioridadFilter) arr = arr.filter((i) => i.prioridad === prioridadFilter);
    if (lineaFilter !== 'all') arr = arr.filter((i) => i.categoria === lineaFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.marca.toLowerCase().includes(q)
      );
    }
    const priorityOrder: Record<string, number> = { urgente: 0, normal: 1, opcional: 2 };
    return [...arr].sort((a, b) => {
      if (sortKey === 'prioridad')
        return (
          priorityOrder[a.prioridad] - priorityOrder[b.prioridad] ||
          a.dias_cobertura - b.dias_cobertura
        );
      if (sortKey === 'cobertura') return a.dias_cobertura - b.dias_cobertura;
      if (sortKey === 'sku') return a.sku.localeCompare(b.sku);
      if (sortKey === 'total')
        return (
          (cantidades[b.sku] ?? 0) * b.precio - (cantidades[a.sku] ?? 0) * a.precio
        );
      return 0;
    });
  }, [items, prioridadFilter, lineaFilter, searchQuery, sortKey, cantidades]);

  const toggleSku = useCallback((sku: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === filteredItems.length) setSelected(new Set());
    else setSelected(new Set(filteredItems.map((i) => i.sku)));
  }, [filteredItems, selected.size]);

  const toggleExpand = useCallback((sku: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }, []);

  const updateCantidad = useCallback((sku: string, val: number) => {
    setCantidades((prev) => ({ ...prev, [sku]: Math.max(0, val) }));
  }, []);

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.sku)),
    [items, selected]
  );
  // Usa precio_compra (costo unitario) si está disponible, si no cae a precio de venta
  const costoUnitario = useCallback(
    (item: CompraSugeridaItem) => item.precio_compra ?? item.precio,
    []
  );

  const selectedCost = useMemo(
    () => selectedItems.reduce((s, i) => s + (cantidades[i.sku] ?? 0) * costoUnitario(i), 0),
    [selectedItems, cantidades, costoUnitario]
  );
  const selectedUnits = useMemo(
    () => selectedItems.reduce((s, i) => s + (cantidades[i.sku] ?? 0), 0),
    [selectedItems, cantidades]
  );

  const totalCosto = useMemo(
    () => items.reduce((s, i) => s + i.cantidad_sugerida * costoUnitario(i), 0),
    [items, costoUnitario]
  );
  const totalPiezas = useMemo(
    () => items.reduce((s, i) => s + i.cantidad_sugerida, 0),
    [items]
  );

  const lastUpdated = items.length > 0 ? items[0].calculado_en : null;
  const lastUpdatedText = lastUpdated
    ? format(new Date(lastUpdated), "EEEE d 'de' MMMM, h:mm a", { locale: es })
    : 'Sin datos aún';

  const handleSubmitPreOrder = async (notas: string) => {
    if (!token) return;
    setSubmitting(true);
    try {
      await crearPreOrden(token, {
        sucursal_id: warehouseParam,
        notas: notas || undefined,
        items: selectedItems.map((i) => ({
          sku: i.sku,
          cantidad: cantidades[i.sku] ?? i.cantidad_sugerida,
          precio_unitario: costoUnitario(i),
        })),
      });
      toast.success('Pre-orden creada correctamente');
      setPreOrderOpen(false);
      setSelected(new Set());
      refetch();
    } catch {
      toast.error('Error al crear la pre-orden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecalcular = async () => {
    if (!token) return;
    setRecalculating(true);
    try {
      await recalcularCompras(token);
      toast.success('Recálculo iniciado. Los datos se actualizarán en unos minutos.');
    } catch {
      toast.error('Error al iniciar el recálculo.');
    }
    setTimeout(() => setRecalculating(false), 30_000);
  };

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      await exportarCompraSugerida(token, { sucursal_id: warehouseParam, prioridad: prioridadFilter ?? undefined });
      toast.success('Archivo descargado correctamente.');
    } catch {
      toast.error('Error al generar el archivo.');
    } finally {
      setExporting(false);
    }
  };

  const selectCls =
    'h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-sm appearance-none focus:ring-2 focus:ring-ring focus:outline-none cursor-pointer';

  const allCheckedState: boolean | 'indeterminate' =
    filteredItems.length > 0 && selected.size === filteredItems.length
      ? true
      : selected.size > 0
      ? 'indeterminate'
      : false;

  return (
    <div className="space-y-5">
      {/* ─── Integrated header card ─── */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {/* Title row + actions */}
        <div className="p-5 flex items-start justify-between gap-6 flex-wrap border-b">
          <div>
            <h1 className="text-2xl font-bold">Compra Sugerida</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-64 inline-block" />
              ) : (
                <>Actualizado {lastUpdatedText}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {currentUser.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                disabled={recalculating}
                onClick={handleRecalcular}
              >
                <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculando…' : 'Recalcular'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={handleExport}
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-spin' : ''}`} />
              {exporting ? 'Generando…' : 'Exportar'}
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={() => setPreOrderOpen(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              Generar pre-orden
              {selected.size > 0 && (
                <span className="ml-1 bg-white/20 text-white rounded-full text-xs px-1.5 py-0.5">
                  {selected.size}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-b">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-10" />
                </div>
              </div>
            ))
          ) : (
            <>
              <KPIStripCell
                icon={<AlertTriangle className="w-[18px] h-[18px]" />}
                iconBg="bg-destructive/10"
                iconColor="text-destructive"
                label="Urgente"
                value={resumen.urgente}
                hint="< 7 días de stock"
                active={prioridadFilter === 'urgente'}
                onClick={() =>
                  setPrioridadFilter((p) => (p === 'urgente' ? null : 'urgente'))
                }
              />
              <KPIStripCell
                icon={<Clock className="w-[18px] h-[18px]" />}
                iconBg="bg-yellow-100 dark:bg-yellow-900/30"
                iconColor="text-yellow-600 dark:text-yellow-400"
                label="Normal"
                value={resumen.normal}
                hint="7–14 días"
                active={prioridadFilter === 'normal'}
                onClick={() =>
                  setPrioridadFilter((p) => (p === 'normal' ? null : 'normal'))
                }
              />
              <KPIStripCell
                icon={<CheckCircle2 className="w-[18px] h-[18px]" />}
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600 dark:text-green-400"
                label="Opcional"
                value={resumen.opcional}
                hint="> 14 días"
                active={prioridadFilter === 'opcional'}
                onClick={() =>
                  setPrioridadFilter((p) => (p === 'opcional' ? null : 'opcional'))
                }
              />
              <KPIStripCell
                icon={<DollarSign className="w-[18px] h-[18px]" />}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                label="Costo sugerido"
                value={formatCurrency(totalCosto)}
                hint={`${totalPiezas} piezas · ${items.length} SKUs`}
              />
            </>
          )}
        </div>

        {/* Filters strip */}
        <div className="p-4 flex flex-wrap items-center gap-3 bg-muted/40">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Filtros
          </span>

          <div className="relative">
            <select
              value={lineaFilter}
              onChange={(e) => setLineaFilter(e.target.value)}
              className={selectCls}
            >
              <option value="all">Todas las líneas</option>
              {lineas.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground" />
          </div>

          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className={selectCls}
            >
              <option value="prioridad">Orden: Prioridad</option>
              <option value="cobertura">Orden: Menor cobertura</option>
              <option value="total">Orden: Mayor costo</option>
              <option value="sku">Orden: SKU</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground" />
          </div>

          {(prioridadFilter || lineaFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPrioridadFilter(null);
                setLineaFilter('all');
              }}
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </Button>
          )}

          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredItems.length}</span> de{' '}
            {items.length} productos
          </span>
        </div>
      </div>

      {/* ─── Main table ─── */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">
              No hay productos que necesiten reabastecimiento
            </p>
            <p className="text-sm mt-1">
              Ajusta los filtros o espera al próximo recálculo
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={allCheckedState}
                      onCheckedChange={toggleAll}
                      aria-label="Seleccionar todo"
                    />
                  </th>
                  <th className="px-2 py-3 w-6" />
                  <th className="px-2 py-3 text-left">SKU / Producto</th>
                  <th className="px-3 py-3 text-right">Stock</th>
                  <th className="px-3 py-3 text-right">Días cob.</th>
                  <th className="px-3 py-3 text-right">Venta/sem</th>
                  <th className="px-3 py-3 text-center">Prioridad</th>
                  <th className="px-3 py-3 text-right">P. compra</th>
                  <th className="px-3 py-3 text-center w-24">Cant.</th>
                  <th className="px-3 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => {
                  const isSel = selected.has(item.sku);
                  const isExp = expanded.has(item.sku);
                  const cant = cantidades[item.sku] ?? 0;
                  const velocidadSemanal = item.promedio_diario * 7;
                  return (
                    <tr
                      key={item.sku}
                      className={`hover:bg-muted/40 transition-colors ${isSel ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleSku(item.sku)}
                          aria-label={`Seleccionar ${item.nombre}`}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => toggleExpand(item.sku)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isExp ? 'rotate-90' : ''}`}
                          />
                        </button>
                      </td>
                      <td className="px-2 py-3" colSpan={isExp ? undefined : undefined}>
                        <div className="font-medium text-sm leading-tight">
                          {item.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{item.sku}</span>
                          <span>·</span>
                          <span>{item.marca}</span>
                          <span>·</span>
                          <span>{item.categoria}</span>
                        </div>
                        {isExp && (
                          <div className="mt-0">
                            {/* expanded panel rendered inline below via separate tr */}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div
                          className={`font-mono text-sm tabular-nums ${
                            item.stock_actual <= item.stock_minimo
                              ? 'text-destructive font-semibold'
                              : ''
                          }`}
                        >
                          {item.stock_actual}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          mín {item.stock_minimo}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                        <span
                          className={
                            item.dias_cobertura < 7
                              ? 'text-destructive font-semibold'
                              : item.dias_cobertura < 14
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-muted-foreground'
                          }
                        >
                          {Math.round(item.dias_cobertura)}d
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                        {velocidadSemanal.toFixed(1)}
                        <span className="text-[10px] text-muted-foreground ml-1">u/s</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <PrioridadBadge prioridad={item.prioridad as Prioridad} />
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular-nums">
                        {formatCurrency(costoUnitario(item))}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            min={0}
                            value={cant}
                            onChange={(e) =>
                              updateCantidad(item.sku, parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-8 text-sm text-center rounded border border-input font-mono tabular-nums focus:ring-2 focus:ring-ring focus:outline-none bg-background"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-sm font-semibold">
                        {formatCurrency(cant * costoUnitario(item))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Expanded detail panels — rendered outside table rows to avoid invalid HTML */}
            {filteredItems.some((i) => expanded.has(i.sku)) && (
              <div className="border-t">
                {filteredItems
                  .filter((i) => expanded.has(i.sku))
                  .map((item) => (
                    <ItemDetailPanel key={`detail-${item.sku}`} item={item} />
                  ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ─── Floating selection bar ─── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-foreground text-background rounded-xl shadow-2xl px-5 py-3 flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <div className="font-semibold">{selected.size} productos</div>
                <div className="text-xs opacity-70 font-mono">
                  {selectedUnits} piezas · {formatCurrency(selectedCost)}
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity"
            >
              Limpiar
            </button>
            <Button size="sm" onClick={() => setPreOrderOpen(true)}>
              <ShoppingCart className="w-4 h-4" />
              Generar pre-orden
            </Button>
          </div>
        </div>
      )}

      {/* ─── Pre-order modal ─── */}
      <PreOrderModal
        open={preOrderOpen}
        onClose={() => setPreOrderOpen(false)}
        items={selectedItems}
        cantidades={cantidades}
        onConfirm={handleSubmitPreOrder}
        submitting={submitting}
        onExportExcel={handleExport}
      />
    </div>
  );
}
