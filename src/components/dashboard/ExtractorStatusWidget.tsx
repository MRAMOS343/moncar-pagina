import { Wifi, WifiOff, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExtractorStatus, type ExtractorStatusItem } from "@/hooks/useExtractorStatus";
import type { User } from "@/types";

interface Props {
  currentUser: User;
}

function formatTiempo(segundos: number | null): string {
  if (segundos === null) return "desconocido";
  if (segundos < 60) return `hace ${segundos} segundos`;
  if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} minutos`;
  return `hace ${Math.floor(segundos / 3600)} horas`;
}

const estadoBadgeVariant: Record<string, "success" | "warning" | "destructive"> = {
  OK: "success",
  LAG: "warning",
  OFFLINE: "destructive",
};

const estadoLabel: Record<string, string> = {
  OK: "Sincronizado",
  LAG: "Con atraso",
  OFFLINE: "Fuera de línea",
};

function StatusRow({ item }: { item: ExtractorStatusItem }) {
  const tipo = item.tipo === "ventas" ? "Ventas" : "Cancelaciones";
  const tiempo = formatTiempo(item.ultimo_reporte_hace_segundos);

  let descripcion: string;
  if (item.estado === "OK") {
    descripcion = `Sincronizado — ${tiempo}`;
  } else if (item.estado === "LAG") {
    descripcion = `Atraso: ${item.lag ?? "?"} pendientes — ${tiempo}`;
  } else {
    const minutos = item.ultimo_reporte_hace_segundos !== null
      ? Math.round(item.ultimo_reporte_hace_segundos / 60)
      : null;
    descripcion = `Sin reporte desde hace ${minutos ?? "?"} minutos — último cursor: #${item.cursor ?? "desconocido"}`;
  }

  return (
    <div className="flex flex-col gap-1 py-2 border-b last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              item.estado === "OK"
                ? "bg-success"
                : item.estado === "LAG"
                  ? "bg-warning"
                  : "bg-destructive"
            }`}
          />
          <span className="text-sm font-medium">{tipo}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={estadoBadgeVariant[item.estado]}>
            {estadoLabel[item.estado]}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground pl-4">{descripcion}</p>
      {item.last_error && item.estado !== "OK" && (
        <div className="flex items-center gap-1 pl-4 text-xs text-destructive">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{item.last_error}</span>
        </div>
      )}
    </div>
  );
}

export function ExtractorStatusWidget({ currentUser }: Props) {
  const role = currentUser?.role;
  const canView = role === "admin" || role === "gerente";

  if (!canView) return null;

  const { data, isLoading, isError, error } = useExtractorStatus();

  const is404 =
    isError && ((error as { status?: number })?.status === 404);

  return (
    <Card className="animate-fade-in card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : isError ? (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          Sincronización POS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        )}

        {is404 && (
          <p className="text-sm text-muted-foreground">
            Módulo de monitoreo no disponible.
          </p>
        )}

        {isError && !is404 && (
          <p className="text-sm text-muted-foreground">
            Estado no disponible.
          </p>
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sin datos del extractor todavía.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div>
            {data.map((item) => (
              <StatusRow key={`${item.source}-${item.tipo}`} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
