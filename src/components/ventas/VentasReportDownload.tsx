import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { downloadSalesReport } from '@/services/salesReportService';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelpers';
import { logger } from '@/utils/logger';

interface Props {
  currentWarehouse: string;
}

export function VentasReportDownload({ currentWarehouse }: Props) {
  const [reportPeriod, setReportPeriod] = useState<string>('1m');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [isDownloading, setIsDownloading] = useState(false);

  // Generar lista de meses desde Enero 2024 hasta mes actual
  const availableMonths = useMemo(() => {
    const months: { value: string; label: string; isCurrent: boolean }[] = [];
    const now = new Date();
    const currentYM = format(now, 'yyyy-MM');
    let cursor = new Date(2024, 0, 1);
    while (cursor <= now) {
      const value = format(cursor, 'yyyy-MM');
      const label = format(cursor, 'MMMM yyyy', { locale: es });
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      months.push({ value, label: capitalizedLabel, isCurrent: value === currentYM });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return months.reverse();
  }, []);

  // Leyenda contextual del mes seleccionado
  const monthHint = useMemo(() => {
    const currentYM = format(new Date(), 'yyyy-MM');
    if (selectedMonth === currentYM) return 'Del 01 al día de hoy';
    return 'Mes completo';
  }, [selectedMonth]);

  const handleDownloadReport = useCallback(async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('moncar_token');
      if (!token) {
        showErrorToast("Error", "Sesión no válida. Inicia sesión nuevamente.");
        return;
      }

      const sucursal_id = currentWarehouse === 'all' ? undefined : currentWarehouse;

      if (reportPeriod === 'month') {
        await downloadSalesReport(token, { month: selectedMonth, sucursal_id });
      } else {
        const now = new Date();
        let reportFrom: string;
        switch (reportPeriod) {
          case '7d': reportFrom = format(subDays(now, 7), 'yyyy-MM-dd'); break;
          case '1m': reportFrom = format(subDays(now, 30), 'yyyy-MM-dd'); break;
          case '3m': reportFrom = format(subDays(now, 90), 'yyyy-MM-dd'); break;
          case 'all': reportFrom = '2020-01-01'; break;
          default: reportFrom = format(subDays(now, 30), 'yyyy-MM-dd');
        }
        await downloadSalesReport(token, { from: reportFrom, sucursal_id });
      }

      showSuccessToast("Reporte descargado", "El archivo Excel se descargó correctamente.");
      logger.info('Reporte de ventas descargado', { period: reportPeriod, month: selectedMonth });
    } catch (err: any) {
      showErrorToast("Error al descargar", err?.message || "No se pudo generar el reporte.");
      logger.error('Error descargando reporte de ventas', err);
    } finally {
      setIsDownloading(false);
    }
  }, [reportPeriod, selectedMonth, currentWarehouse]);

  return (
    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
      <Select value={reportPeriod} onValueChange={setReportPeriod}>
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">1 Semana</SelectItem>
          <SelectItem value="1m">1 Mes</SelectItem>
          <SelectItem value="3m">3 Meses</SelectItem>
          <SelectItem value="all">Histórico</SelectItem>
          <SelectSeparator />
          <SelectItem value="month">Mes específico</SelectItem>
        </SelectContent>
      </Select>

      {reportPeriod === 'month' && (
        <div className="flex flex-col gap-0.5">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[260px]">
              {availableMonths.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground pl-1">{monthHint}</span>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadReport}
        disabled={isDownloading}
        className="btn-hover touch-target"
        aria-label="Descargar reporte de ventas"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 sm:mr-2" />
        )}
        <span className="hidden sm:inline">Descargar Reporte</span>
      </Button>
    </div>
  );
}
