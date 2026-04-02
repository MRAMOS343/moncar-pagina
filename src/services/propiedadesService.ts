import { apiRequest } from './apiClient';
import type {
  Propiedad, Contrato, Pago, SolicitudMantenimiento,
  TipoPropiedad, EstadoPropiedad, EstadoPago,
  PrioridadMantenimiento, EstadoMantenimiento,
} from '@/types/propiedades';

function getToken() {
  return localStorage.getItem('moncar_token');
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapPropiedad(r: any): Propiedad {
  return {
    id: r.propiedad_id,
    nombre: r.nombre ?? '',
    tipo: (r.tipo as TipoPropiedad) ?? 'casa',
    estado: (r.estado as EstadoPropiedad) ?? 'disponible',
    direccion: r.direccion_linea1 ?? '',
    metrosCuadrados: Number(r.metros_cuadrados) || 0,
    habitaciones: Number(r.habitaciones) || 0,
    banos: Number(r.banos) || 0,
    estacionamientos: Number(r.estacionamientos) || 0,
    costoMensual: Number(r.costo_mensual) || 0,
    descripcion: r.notas ?? '',
    fotos: [],
    createdAt: r.created_at ?? '',
  };
}

function mapContrato(r: any): Contrato {
  return {
    id: r.contrato_id,
    propiedadId: r.propiedad_id,
    arrendatarioNombre: r.arrendatario_nombre ?? '',
    arrendatarioContacto: r.arrendatario_telefono ?? '',
    arrendatarioEmail: r.arrendatario_email ?? '',
    arrendatarioRFC: r.arrendatario_rfc ?? '',
    arrendatarioIdentificacion: r.arrendatario_identificacion ?? '',
    fechaInicio: r.fecha_inicio ?? '',
    fechaFin: r.fecha_fin ?? '',
    montoMensual: Number(r.renta_mensual) || 0,
    diaPago: Number(r.dia_pago) || 1,
    deposito: Number(r.deposito_garantia) || 0,
    condicionesEspeciales: r.terminos ?? '',
    activo: Boolean(r.activo),
    createdAt: r.created_at ?? '',
  };
}

function mapPago(r: any): Pago {
  // periodo viene como "YYYY-MM-DD", lo devolvemos como "YYYY-MM"
  const mesCorrespondiente = r.periodo
    ? String(r.periodo).slice(0, 7)
    : '';
  return {
    id: r.pago_id,
    contratoId: r.contrato_id,
    propiedadId: r.propiedad_id,
    mesCorrespondiente,
    montoEsperado: Number(r.monto_esperado) || 0,
    montoPagado: Number(r.monto_pagado) || 0,
    fechaEsperada: r.fecha_vencimiento ?? '',
    fechaPago: r.fecha_pago_real ?? null,
    estado: (r.estado as EstadoPago) ?? 'pendiente',
    comprobante: r.referencia ?? null,
    notas: r.notas ?? '',
    createdAt: r.created_at ?? '',
  };
}

function mapMantenimiento(r: any): SolicitudMantenimiento {
  return {
    id: r.solicitud_id,
    propiedadId: r.propiedad_id,
    titulo: r.titulo ?? '',
    descripcion: r.descripcion ?? '',
    prioridad: (r.prioridad as PrioridadMantenimiento) ?? 'media',
    estado: (r.estado as EstadoMantenimiento) ?? 'pendiente',
    costoEstimado: Number(r.costo_estimado) || 0,
    costoReal: r.costo_real != null ? Number(r.costo_real) : null,
    proveedor: r.proveedor ?? '',
    fechaSolicitud: r.fecha_solicitud ?? '',
    fechaResolucion: r.fecha_resolucion ?? null,
  };
}

// ── Propiedades ──────────────────────────────────────────────────────────────

export async function fetchPropiedades(): Promise<Propiedad[]> {
  const res = await apiRequest<{ items: any[] }>('/api/v1/rentas/propiedades', {
    token: getToken(),
  });
  return res.items.map(mapPropiedad);
}

export async function createPropiedad(data: Omit<Propiedad, 'id' | 'createdAt'>): Promise<string> {
  const res = await apiRequest<{ ok: boolean; propiedad_id: string }>(
    '/api/v1/rentas/propiedades',
    {
      method: 'POST',
      token: getToken(),
      body: {
        nombre: data.nombre,
        tipo: data.tipo,
        estado: data.estado,
        direccion_linea1: data.direccion,
        metros_cuadrados: data.metrosCuadrados || null,
        habitaciones: data.habitaciones || null,
        banos: data.banos || null,
        estacionamientos: data.estacionamientos || null,
        costo_mensual: data.costoMensual || null,
        notas: data.descripcion,
      },
    }
  );
  return res.propiedad_id;
}

export async function updatePropiedad(id: string, data: Partial<Propiedad>): Promise<void> {
  await apiRequest('/api/v1/rentas/propiedades/' + id, {
    method: 'PATCH',
    token: getToken(),
    body: {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...(data.estado !== undefined && { estado: data.estado }),
      ...(data.direccion !== undefined && { direccion_linea1: data.direccion }),
      ...(data.metrosCuadrados !== undefined && { metros_cuadrados: data.metrosCuadrados || null }),
      ...(data.habitaciones !== undefined && { habitaciones: data.habitaciones || null }),
      ...(data.banos !== undefined && { banos: data.banos || null }),
      ...(data.estacionamientos !== undefined && { estacionamientos: data.estacionamientos || null }),
      ...(data.costoMensual !== undefined && { costo_mensual: data.costoMensual || null }),
      ...(data.descripcion !== undefined && { notas: data.descripcion }),
    },
  });
}

export async function deletePropiedad(id: string): Promise<void> {
  await apiRequest('/api/v1/rentas/propiedades/' + id, {
    method: 'DELETE',
    token: getToken(),
  });
}

// ── Contratos ─────────────────────────────────────────────────────────────────

export async function fetchContratos(): Promise<Contrato[]> {
  const res = await apiRequest<{ items: any[] }>('/api/v1/rentas/contratos', {
    token: getToken(),
  });
  return res.items.map(mapContrato);
}

export async function createContrato(data: Omit<Contrato, 'id' | 'createdAt'>): Promise<string> {
  const res = await apiRequest<{ ok: boolean; contrato_id: string }>(
    '/api/v1/rentas/contratos',
    {
      method: 'POST',
      token: getToken(),
      body: {
        propiedad_id: data.propiedadId,
        arrendatario_nombre: data.arrendatarioNombre,
        arrendatario_telefono: data.arrendatarioContacto,
        arrendatario_email: data.arrendatarioEmail,
        arrendatario_rfc: data.arrendatarioRFC,
        arrendatario_identificacion: data.arrendatarioIdentificacion,
        fecha_inicio: data.fechaInicio,
        fecha_fin: data.fechaFin || null,
        renta_mensual: data.montoMensual,
        dia_pago: data.diaPago,
        deposito_garantia: data.deposito,
        terminos: data.condicionesEspeciales,
        activo: data.activo,
      },
    }
  );
  return res.contrato_id;
}

export async function updateContrato(id: string, data: Partial<Contrato>): Promise<void> {
  await apiRequest('/api/v1/rentas/contratos/' + id, {
    method: 'PATCH',
    token: getToken(),
    body: {
      ...(data.arrendatarioNombre !== undefined && { arrendatario_nombre: data.arrendatarioNombre }),
      ...(data.arrendatarioContacto !== undefined && { arrendatario_telefono: data.arrendatarioContacto }),
      ...(data.arrendatarioEmail !== undefined && { arrendatario_email: data.arrendatarioEmail }),
      ...(data.arrendatarioRFC !== undefined && { arrendatario_rfc: data.arrendatarioRFC }),
      ...(data.arrendatarioIdentificacion !== undefined && { arrendatario_identificacion: data.arrendatarioIdentificacion }),
      ...(data.fechaInicio !== undefined && { fecha_inicio: data.fechaInicio }),
      ...(data.fechaFin !== undefined && { fecha_fin: data.fechaFin || null }),
      ...(data.montoMensual !== undefined && { renta_mensual: data.montoMensual }),
      ...(data.diaPago !== undefined && { dia_pago: data.diaPago }),
      ...(data.deposito !== undefined && { deposito_garantia: data.deposito }),
      ...(data.condicionesEspeciales !== undefined && { terminos: data.condicionesEspeciales }),
      ...(data.activo !== undefined && { activo: data.activo }),
    },
  });
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export async function fetchPagos(): Promise<Pago[]> {
  const res = await apiRequest<{ items: any[] }>('/api/v1/rentas/pagos', {
    token: getToken(),
  });
  return res.items.map(mapPago);
}

export async function createPago(data: Omit<Pago, 'id' | 'createdAt'>): Promise<string> {
  const res = await apiRequest<{ ok: boolean; pago_id: string }>(
    '/api/v1/rentas/pagos',
    {
      method: 'POST',
      token: getToken(),
      body: {
        contrato_id: data.contratoId,
        propiedad_id: data.propiedadId,
        periodo: data.mesCorrespondiente,
        fecha_vencimiento: data.fechaEsperada,
        monto_esperado: data.montoEsperado,
        monto_pagado: data.montoPagado,
        estado: data.estado,
        fecha_pago_real: data.fechaPago || null,
        referencia: data.comprobante || null,
        notas: data.notas,
      },
    }
  );
  return res.pago_id;
}

export async function updatePago(id: string, data: Partial<Pago>): Promise<void> {
  await apiRequest('/api/v1/rentas/pagos/' + id, {
    method: 'PATCH',
    token: getToken(),
    body: {
      ...(data.montoPagado !== undefined && { monto_pagado: data.montoPagado }),
      ...(data.estado !== undefined && { estado: data.estado }),
      ...(data.fechaPago !== undefined && { fecha_pago_real: data.fechaPago }),
      ...(data.comprobante !== undefined && { referencia: data.comprobante }),
      ...(data.notas !== undefined && { notas: data.notas }),
      ...(data.fechaEsperada !== undefined && { fecha_vencimiento: data.fechaEsperada }),
      ...(data.montoEsperado !== undefined && { monto_esperado: data.montoEsperado }),
    },
  });
}

// ── Mantenimiento ─────────────────────────────────────────────────────────────

export async function fetchMantenimiento(): Promise<SolicitudMantenimiento[]> {
  const res = await apiRequest<{ items: any[] }>('/api/v1/rentas/mantenimiento', {
    token: getToken(),
  });
  return res.items.map(mapMantenimiento);
}

export async function createMantenimiento(data: Omit<SolicitudMantenimiento, 'id'>): Promise<string> {
  const res = await apiRequest<{ ok: boolean; solicitud_id: string }>(
    '/api/v1/rentas/mantenimiento',
    {
      method: 'POST',
      token: getToken(),
      body: {
        propiedad_id: data.propiedadId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        estado: data.estado,
        costo_estimado: data.costoEstimado || null,
        costo_real: data.costoReal ?? null,
        proveedor: data.proveedor,
        fecha_solicitud: data.fechaSolicitud || null,
        fecha_resolucion: data.fechaResolucion ?? null,
      },
    }
  );
  return res.solicitud_id;
}

export async function updateMantenimiento(id: string, data: Partial<SolicitudMantenimiento>): Promise<void> {
  await apiRequest('/api/v1/rentas/mantenimiento/' + id, {
    method: 'PATCH',
    token: getToken(),
    body: {
      ...(data.titulo !== undefined && { titulo: data.titulo }),
      ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
      ...(data.prioridad !== undefined && { prioridad: data.prioridad }),
      ...(data.estado !== undefined && { estado: data.estado }),
      ...(data.costoEstimado !== undefined && { costo_estimado: data.costoEstimado }),
      ...(data.costoReal !== undefined && { costo_real: data.costoReal }),
      ...(data.proveedor !== undefined && { proveedor: data.proveedor }),
      ...(data.fechaResolucion !== undefined && { fecha_resolucion: data.fechaResolucion }),
    },
  });
}

export async function deleteMantenimiento(id: string): Promise<void> {
  await apiRequest('/api/v1/rentas/mantenimiento/' + id, {
    method: 'DELETE',
    token: getToken(),
  });
}
