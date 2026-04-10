import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export function useCotizacionPdf() {
  const { token } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPdf = useCallback(async (cotizacionId: string, filename?: string) => {
    if (!token) {
      toast({ title: 'Error', description: 'Sesión no válida', variant: 'destructive' });
      return;
    }

    setIsDownloading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/cotizaciones/${cotizacionId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `cotizacion_${cotizacionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      toast({ title: 'Error al descargar PDF', description: 'Intenta de nuevo más tarde.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  }, [token]);

  return { downloadPdf, isDownloading };
}
