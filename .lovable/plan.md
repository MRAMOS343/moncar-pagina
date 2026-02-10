

# Plan: Nueva Seccion - Administracion de Propiedades en Renta

## Resumen

Crear un modulo completo de administracion de propiedades en renta, accesible solo para usuarios con rol `admin`. Incluye gestion de propiedades, contratos, pagos, mantenimiento, documentos y notificaciones.

## Alcance de la Fase 1 (Implementacion Inicial)

Dado que es una funcionalidad extensa, se implementara en una primera fase funcional con datos mock, siguiendo el patron existente del proyecto (como EquiposPage, ProveedoresPage, etc.). Los endpoints de API se conectaran posteriormente.

### Lo que se construira ahora

| Modulo | Descripcion |
|--------|-------------|
| Pagina principal | Vista con tabs: Propiedades, Contratos, Pagos, Mantenimiento |
| Gestion de Propiedades | CRUD completo con modal de alta/edicion y detalle |
| Contratos | Registro vinculado a propiedad con datos del arrendatario |
| Control de Pagos | Lista de pagos mensuales con estados y carga de comprobantes |
| Mantenimiento | Registro de solicitudes y gastos por propiedad |
| Documentos | Seccion para notas y registro de comunicaciones |
| Restriccion de acceso | Solo visible para usuarios con rol `admin` |

---

## Estructura de Archivos Nuevos

```text
src/
  pages/
    PropiedadesPage.tsx              -- Pagina principal con tabs
  components/
    propiedades/
      PropertyCard.tsx               -- Tarjeta de propiedad en grid
      PropertyFormModal.tsx          -- Modal alta/edicion de propiedad
      PropertyDetailModal.tsx        -- Modal detalle completo
      ContractFormModal.tsx          -- Modal de contrato
      PaymentTable.tsx               -- Tabla de pagos con estados
      PaymentFormModal.tsx           -- Registrar pago / subir comprobante
      MaintenanceFormModal.tsx       -- Solicitud de mantenimiento
      PropertyFilters.tsx            -- Filtros (estado, tipo, busqueda)
  types/
    propiedades.ts                   -- Tipos TypeScript
  data/
    mockPropiedades.ts               -- Datos mock para prototipar
  hooks/
    usePropiedades.ts                -- Hook con datos mock (preparado para API)
```

---

## Modelo de Datos

### Propiedad

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | string | ID unico |
| direccion | string | Direccion completa |
| tipo | enum | casa, departamento, local_comercial, bodega, terreno, oficina |
| metrosCuadrados | number | Superficie |
| habitaciones | number | Numero de habitaciones (si aplica) |
| banos | number | Numero de banos |
| estacionamientos | number | Lugares de estacionamiento |
| estado | enum | disponible, rentada, mantenimiento |
| descripcion | string | Notas generales |
| fotos | string[] | URLs de imagenes |
| costoMensual | number | Renta mensual sugerida |
| createdAt | string | Fecha de registro |

### Contrato

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | string | ID unico |
| propiedadId | string | Referencia a propiedad |
| arrendatarioNombre | string | Nombre del inquilino |
| arrendatarioContacto | string | Telefono |
| arrendatarioEmail | string | Email |
| arrendatarioRFC | string | RFC (opcional) |
| arrendatarioIdentificacion | string | Tipo de ID |
| fechaInicio | string | Inicio del contrato |
| fechaFin | string | Fin del contrato |
| montoMensual | number | Renta mensual acordada |
| diaPago | number | Dia del mes para pago (1-31) |
| deposito | number | Deposito en garantia |
| condicionesEspeciales | string | Notas del contrato |
| activo | boolean | Si el contrato esta vigente |
| createdAt | string | Fecha de registro |

### Pago

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | string | ID unico |
| contratoId | string | Referencia a contrato |
| propiedadId | string | Referencia a propiedad |
| mesCorrespondiente | string | Mes que cubre (YYYY-MM) |
| montoEsperado | number | Monto esperado |
| montoPagado | number | Monto realmente pagado |
| fechaEsperada | string | Fecha limite de pago |
| fechaPago | string (null) | Fecha real de pago |
| estado | enum | pendiente, pagado, atrasado, parcial |
| comprobante | string (null) | URL del comprobante |
| notas | string | Observaciones |
| createdAt | string | Fecha de registro |

### Solicitud de Mantenimiento

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | string | ID unico |
| propiedadId | string | Referencia a propiedad |
| titulo | string | Descripcion breve |
| descripcion | string | Detalle del problema |
| prioridad | enum | baja, media, alta, urgente |
| estado | enum | pendiente, en_progreso, completado |
| costoEstimado | number | Costo estimado |
| costoReal | number (null) | Costo final |
| proveedor | string | Quien realiza el trabajo |
| fechaSolicitud | string | Cuando se reporto |
| fechaResolucion | string (null) | Cuando se resolvio |

---

## Diseno de la Pagina Principal

La pagina usara un layout con Tabs para organizar las secciones:

```text
+------------------------------------------------------------------+
|  Propiedades en Renta                                    [Solo Admin]
|  Administracion de inmuebles y contratos de arrendamiento         |
|                                                                    |
|  [Propiedades]  [Contratos]  [Pagos]  [Mantenimiento]            |
|  ─────────────────────────────────────────────────────            |
|                                                                    |
|  Tab Propiedades:                                                  |
|  [+ Nueva Propiedad]  [Buscar...]  [Filtro: Estado v]            |
|                                                                    |
|  +-------------+  +-------------+  +-------------+                |
|  | Casa Norte  |  | Local Centro|  | Depto Sur   |                |
|  | Rentada     |  | Disponible  |  | Mant.       |                |
|  | $12,000/mes |  | $8,500/mes  |  | $6,000/mes  |                |
|  | 3 hab 2 ban |  | 1 hab 1 ban |  | 2 hab 1 ban |                |
|  +-------------+  +-------------+  +-------------+                |
|                                                                    |
|  Tab Pagos:                                                        |
|  KPIs: [Total Cobrado] [Pendiente] [Atrasados] [Tasa Cobro]      |
|  Tabla: Propiedad | Mes | Esperado | Pagado | Estado | Acciones  |
+------------------------------------------------------------------+
```

---

## Restriccion de Acceso

### Sidebar (AppSidebar.tsx)
- Agregar item de navegacion "Propiedades" con icono `Building2`
- Solo visible cuando `currentUser?.role === 'admin'`

### Router (main.tsx)
- Nueva ruta `/dashboard/propiedades`
- Envuelta en componente `AdminRoute` que verifica el rol

### Componente AdminRoute
```typescript
// Reutiliza el patron de ProtectedRoute pero verifica rol admin
function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
```

---

## Archivos Existentes a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/main.tsx` | Agregar ruta `/dashboard/propiedades` con AdminRoute |
| `src/components/layout/AppSidebar.tsx` | Agregar item "Propiedades" condicional por rol |
| `src/pages/DashboardLayout.tsx` | Agregar label de ruta en `routeLabels` |
| `src/components/auth/ProtectedRoute.tsx` | Agregar componente `AdminRoute` exportado |

---

## Detalles Tecnicos

### Patron de Datos Mock
Se seguira el mismo patron que `mockData.ts` pero en archivo separado `mockPropiedades.ts` para mantener organizacion. El hook `usePropiedades` expondra los datos con la misma interfaz que usaran los futuros endpoints de API.

### Gestion de Comprobantes
En esta fase, la carga de comprobantes sera simulada (mock). Cuando se conecte al backend, se usara un servicio de almacenamiento externo (no base de datos) para guardar los archivos, almacenando solo la URL en la base de datos.

### KPIs del Tab de Pagos
- Total cobrado del mes actual
- Monto pendiente de cobro
- Numero de pagos atrasados
- Tasa de cobro (% pagos a tiempo)

### Funcionalidades por Tab

**Tab Propiedades**: Grid de tarjetas con foto, datos basicos, estado. Filtros por estado y tipo. CRUD completo.

**Tab Contratos**: Tabla con contratos activos/inactivos. Vinculados a propiedades. Datos del arrendatario. Alerta visual si el contrato esta proximo a vencer (30 dias).

**Tab Pagos**: Tabla con todos los pagos pendientes y realizados. Filtro por mes y estado. Boton para registrar pago y subir comprobante. Codigo de color por estado (verde=pagado, amarillo=pendiente, rojo=atrasado).

**Tab Mantenimiento**: Lista de solicitudes con prioridad y estado. Costo estimado vs real. Historial por propiedad.

