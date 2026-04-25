import { useState } from 'react';
import { Settings, Send, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDiagnosticoAlertas, useEnviarPrueba } from '@/hooks/useVehiculosAPI';
import { TIPO_DOC_LABELS } from '@/types/vehiculos';
import type { PruebaAlertaResult } from '@/types/vehiculos';

function formatVigencia(v: string): string {
  const d = new Date(v + 'T12:00:00');
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AlertasConfigPage() {
  const { data: docs = [], isLoading, isError, refetch } = useDiagnosticoAlertas();
  const enviarPrueba = useEnviarPrueba();
  const [resultado, setResultado] = useState<PruebaAlertaResult | null>(null);
  const [errorPrueba, setErrorPrueba] = useState<string | null>(null);

  const handleEnviarPrueba = async () => {
    setResultado(null);
    setErrorPrueba(null);
    try {
      const res = await enviarPrueba.mutateAsync();
      setResultado(res);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Error desconocido';
      setErrorPrueba(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Configuración de Alertas</h1>
      </div>

      {/* Sección 1: Estado actual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado actual del sistema</CardTitle>
          <CardDescription>
            Documentos que calificarían para recibir una alerta hoy, según los umbrales y alertas activas de cada unidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>Error al cargar el diagnóstico.</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : docs.length === 0 && !isError ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin documentos por vencer en los umbrales configurados actualmente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Ruta</th>
                    <th className="pb-2 pr-4 font-medium">Unidad</th>
                    <th className="pb-2 pr-4 font-medium">Tipo</th>
                    <th className="pb-2 pr-4 font-medium">Documento</th>
                    <th className="pb-2 pr-4 font-medium">Vence</th>
                    <th className="pb-2 pr-4 font-medium">Días</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.documentoId} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{doc.rutaNombre}</td>
                      <td className="py-2 pr-4">
                        Unidad {doc.unidadNumero}{doc.placa ? ` · ${doc.placa}` : ''}
                      </td>
                      <td className="py-2 pr-4">{TIPO_DOC_LABELS[doc.tipo] ?? doc.tipo}</td>
                      <td className="py-2 pr-4">{doc.documentoNombre}</td>
                      <td className="py-2 pr-4">{formatVigencia(doc.vigenciaHasta)}</td>
                      <td className="py-2 pr-4">
                        <span className={`font-semibold ${doc.diasRestantes <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                          {doc.diasRestantes === 0 ? 'Hoy' : `${doc.diasRestantes}d`}
                        </span>
                      </td>
                      <td className="py-2">
                        {doc.yaNotificado ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Notificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Pendiente
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección 2: Prueba de envío */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prueba de envío</CardTitle>
          <CardDescription>
            Envía un correo de diagnóstico a tu correo para verificar que el sistema de alertas funciona correctamente.
            Este correo no afecta el historial de notificaciones reales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleEnviarPrueba}
            disabled={enviarPrueba.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {enviarPrueba.isPending ? 'Enviando...' : 'Enviar correo de prueba'}
          </Button>

          {resultado && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Correo enviado exitosamente a <strong>{resultado.enviadoA}</strong>.
                {resultado.totalDocs > 0
                  ? ` Incluye ${resultado.totalDocs} documento${resultado.totalDocs === 1 ? '' : 's'} en el diagnóstico.`
                  : ' No hay documentos por vencer actualmente — el correo indica que el sistema está limpio.'}
              </AlertDescription>
            </Alert>
          )}

          {errorPrueba && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {errorPrueba === 'USER_NO_EMAIL'
                  ? 'Tu cuenta no tiene un correo registrado. Contacta al administrador del sistema.'
                  : `Error al enviar el correo de prueba: ${errorPrueba}`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
