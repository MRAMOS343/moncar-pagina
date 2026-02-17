import { Truck } from "lucide-react";

export default function VehiculosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Truck className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Flotilla de Vehículos</h1>
      <p className="text-muted-foreground max-w-md">
        Próximamente: gestión de vehículos de transporte, mantenimiento, documentos y gastos.
      </p>
    </div>
  );
}
