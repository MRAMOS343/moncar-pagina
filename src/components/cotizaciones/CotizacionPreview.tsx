import type { Cotizacion } from '@/types/cotizaciones';
import logoMoncar from '@/assets/logo-moncar.jpeg';

interface Props {
  cotizacion: Cotizacion;
}

export function CotizacionPreview({ cotizacion }: Props) {
  const fmt = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  const clienteLabel = cotizacion.cliente_nombre || cotizacion.cliente || '—';

  return (
    <div id="cotizacion-print-root" className="bg-white text-foreground p-8 max-w-[800px] mx-auto shadow-lg rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
        <img src={logoMoncar} alt="Grupo Moncar" className="h-16 object-contain" />
        <div className="text-right">
          <h1 className="text-2xl font-bold text-primary tracking-wide">COTIZACIÓN</h1>
          <p className="text-sm text-gray-600 mt-1">{cotizacion.folio}</p>
        </div>
      </div>

      {/* Client data block */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
        <div><span className="font-semibold">Cliente:</span> {clienteLabel}</div>
        <div><span className="font-semibold">Vendedor:</span> {cotizacion.vendedorNombre}</div>
        {cotizacion.cliente_empresa && (
          <div><span className="font-semibold">Empresa:</span> {cotizacion.cliente_empresa}</div>
        )}
        <div><span className="font-semibold">Fecha:</span> {formatFecha(cotizacion.fecha)}</div>
        {cotizacion.cliente_telefono && (
          <div><span className="font-semibold">Teléfono:</span> {cotizacion.cliente_telefono}</div>
        )}
        <div><span className="font-semibold">No. Cotización:</span> {cotizacion.folio}</div>
        {cotizacion.cliente_email && (
          <div><span className="font-semibold">Email:</span> {cotizacion.cliente_email}</div>
        )}
        <div><span className="font-semibold">Sucursal:</span> {cotizacion.sucursal}</div>
      </div>

      {/* Table */}
      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="py-2 px-3 text-left w-20">Cantidad</th>
            <th className="py-2 px-3 text-left">Descripción</th>
            <th className="py-2 px-3 text-left w-20">Pieza</th>
            <th className="py-2 px-3 text-right w-32">Precio Unitario</th>
            <th className="py-2 px-3 text-right w-28">Total</th>
          </tr>
        </thead>
        <tbody>
          {cotizacion.items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-muted/40' : 'bg-background'}>
              <td className="py-2 px-3">{item.cantidad}</td>
              <td className="py-2 px-3">{item.descripcion}</td>
              <td className="py-2 px-3">{item.pieza}</td>
              <td className="py-2 px-3 text-right">{fmt(item.precioUnitario)}</td>
              <td className="py-2 px-3 text-right font-medium">{fmt(item.total)}</td>
            </tr>
          ))}
          {cotizacion.items.length < 8 &&
            Array.from({ length: 8 - cotizacion.items.length }).map((_, i) => (
              <tr key={`empty-${i}`} className={((cotizacion.items.length + i) % 2 === 0) ? 'bg-muted/40' : 'bg-background'}>
                <td className="py-2 px-3">&nbsp;</td>
                <td className="py-2 px-3"></td>
                <td className="py-2 px-3"></td>
                <td className="py-2 px-3"></td>
                <td className="py-2 px-3"></td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{fmt(cotizacion.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (16%):</span>
            <span>{fmt(cotizacion.iva)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t-2 border-primary pt-2 mt-2">
            <span>Total:</span>
            <span>{fmt(cotizacion.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 text-xs text-muted-foreground text-center space-y-1">
        <p className="font-semibold">RFC: MON25091344C9</p>
        <p>Dirección Poniente #1234, Colonia San Rafael, Ciudad, Estado, CP 02000</p>
        <p>Tel: (123) 456-7890 | Atención a clientes: 01 800 123 4567</p>
        <p>contacto@grupomoncar.com | www.grupomoncar.com</p>
      </div>
    </div>
  );
}
