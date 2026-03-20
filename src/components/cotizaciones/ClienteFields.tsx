import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, Building2 } from 'lucide-react';

export interface ClienteData {
  nombre: string;
  telefono: string;
  email: string;
  empresa: string;
}

export interface ClienteErrors {
  nombre?: string;
  telefono?: string;
  email?: string;
  empresa?: string;
  contacto?: string;
}

interface Props {
  data: ClienteData;
  errors: ClienteErrors;
  onChange: (field: keyof ClienteData, value: string) => void;
}

export function ClienteFields({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Datos del cliente
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-1.5">
          <Label htmlFor="cliente-nombre" className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Nombre
          </Label>
          <Input
            id="cliente-nombre"
            value={data.nombre}
            onChange={e => onChange('nombre', e.target.value)}
            placeholder="Nombre del cliente (opcional)"
          />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
        </div>

        {/* Empresa */}
        <div className="space-y-1.5">
          <Label htmlFor="cliente-empresa" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Empresa
          </Label>
          <Input
            id="cliente-empresa"
            value={data.empresa}
            onChange={e => onChange('empresa', e.target.value)}
            placeholder="Empresa (opcional)"
          />
          {errors.empresa && <p className="text-xs text-destructive">{errors.empresa}</p>}
        </div>

        {/* Teléfono */}
        <div className="space-y-1.5">
          <Label htmlFor="cliente-telefono" className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Teléfono
          </Label>
          <Input
            id="cliente-telefono"
            type="tel"
            value={data.telefono}
            onChange={e => onChange('telefono', e.target.value)}
            placeholder="Teléfono de contacto"
          />
          {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="cliente-email" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email
          </Label>
          <Input
            id="cliente-email"
            type="email"
            value={data.email}
            onChange={e => onChange('email', e.target.value)}
            placeholder="correo@ejemplo.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      {errors.contacto && (
        <p className="text-xs text-destructive font-medium">{errors.contacto}</p>
      )}
    </div>
  );
}
