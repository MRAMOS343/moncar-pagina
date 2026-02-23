

# Plan Maestro: Funcionalidades Pendientes por Prioridad

A continuacion se presenta cada area pendiente, la mejor forma de desarrollarla, y como puedo ayudarte desde Lovable (sin Supabase).

---

## 1. Ruta rota en DashboardPage (Bug - Correccion inmediata)

**Problema**: `DashboardPage.tsx` linea 130 navega a `/dashboard/ventas` en lugar de `/refaccionarias/ventas`.

**Solucion**: Cambiar la ruta a `/refaccionarias/ventas`.

**Puedo hacerlo yo**: Si, directamente. Es un cambio de una linea.

---

## 2. Modulo de Vehiculos (Prioridad Alta)

**Estado actual**: Pagina placeholder sin funcionalidad.

**Mejor enfoque**:

```text
Backend (tu)                          Frontend (yo)
-----------                          ----------------
1. Tabla "vehiculos" en Postgres     1. Tipos TypeScript
   (placa, marca, modelo, anio,      2. Services (apiClient)
    color, km, estado, seguro_vig,   3. Hooks (useVehiculos, useMutations)
    verificacion_vig)                4. UI: Grid/Tabla con tabs
                                     5. Modales: crear, editar, detalle
2. Tabla "vehiculo_documentos"       6. Documentos con vigencia
   (tipo, vigencia, archivo_url)        (alerta visual si vencido)
                                     
3. Tabla "vehiculo_mantenimiento"    7. Tab de mantenimiento
   (fecha, tipo, km, costo, notas)      con historial y proximo servicio
                                     
4. Tabla "vehiculo_gastos"           8. Tab de gastos con totales
   (fecha, tipo, monto, evidencia)      mensuales y graficos
                                     
5. Endpoints REST:                   
   GET/POST /vehiculos               
   GET/PATCH/DELETE /vehiculos/:id   
   GET/POST /vehiculos/:id/docs      
   GET/POST /vehiculos/:id/mant      
   GET/POST /vehiculos/:id/gastos    
```

**Patron a seguir**: El modulo de Propiedades (`usePropiedades`, `PropiedadesPage`) ya tiene exactamente esta estructura con tabs, modales CRUD y filtros. Lo replico con los mismos patrones.

**Puedo hacer yo**:
- Toda la UI: pagina con tabs (Flotilla, Mantenimiento, Gastos)
- Tipos, services, hooks conectados a tu API
- Modales de crear/editar vehiculo, subir documentos, registrar gastos
- Alertas de documentos por vencer
- Exportacion de datos

**Tu necesitas hacer**:
- Las tablas en Postgres y los endpoints REST

---

## 3. Creacion de Ventas (Prioridad Alta)

**Estado actual**: Boton "Nueva Venta" solo muestra un toast de "proximamente".

**Mejor enfoque**:

```text
Flujo de la venta:
  1. Seleccionar sucursal (si aplica)
  2. Buscar y agregar productos al carrito
  3. Ajustar cantidades y descuentos por linea
  4. Seleccionar metodo de pago
  5. Confirmar y enviar al backend
  6. Recibir folio y mostrar resumen
```

**Arquitectura recomendada**:
- **Hook `useSaleForm`**: Ya existe parcialmente. Manejar estado del carrito, calculos de subtotal/IVA/total
- **Componente `SaleModal`**: Ya existe la estructura basica. Necesita conectarse a la API
- **Endpoint backend**: `POST /sales` que reciba `{ sucursal_id, items: [{sku, qty, precio_unitario, descuento}], metodo_pago }`
- **Validaciones**: Stock disponible (backend), campos requeridos (frontend con Zod)

**Puedo hacer yo**:
- El modal completo de creacion de venta con busqueda de productos
- Calculo en tiempo real de subtotal, IVA, total
- Validacion con Zod
- Conexion al endpoint POST /sales
- Actualizacion automatica de la tabla de ventas despues de crear

**Tu necesitas hacer**:
- El endpoint `POST /sales` en Express
- Validacion de stock en el backend
- Generacion de folio

---

## 4. Prediccion de Ventas con datos reales (Prioridad Media)

**Estado actual**: Genera datos con `Math.random()`. No se conecta a ningun servicio.

**Mejor enfoque (sin ML complejo)**:

```text
Opcion A: Forecast simple en el backend
  - Media movil ponderada de las ultimas N semanas
  - Calculo de estacionalidad basica (mes a mes)
  - Intervalo de confianza basado en desviacion estandar
  
Opcion B: Servicio externo de forecast
  - Amazon Forecast, Google Cloud AI, o Prophet (Python)
  - Mas preciso pero mas complejo de implementar
```

**Recomendacion**: Opcion A para empezar. Un endpoint `GET /forecast?sku=XXX&warehouse=YYY&weeks=8` que devuelva historico + pronostico calculado con media movil. Es suficiente para una empresa mediana.

**Puedo hacer yo**:
- Conectar la pagina de Prediccion al endpoint real
- Mostrar datos historicos reales en lugar de sinteticos
- Mantener la misma UI de graficos con historico vs pronostico
- Quitar el alert de "datos sinteticos" cuando se conecte

**Tu necesitas hacer**:
- Endpoint `GET /forecast` con logica de media movil ponderada
- Query SQL que agrupe ventas historicas por semana/producto/sucursal

---

## 5. Compra Sugerida con datos reales (Prioridad Media)

**Estado actual**: Usa `Math.random()` para la demanda esperada (linea 49 de ComprasPage).

**Mejor enfoque**:

```text
Backend endpoint: GET /purchase-suggestions?warehouse=XXX&lead_time=7&safety_pct=20
  
Respuesta:
  - Lista de productos con stock actual, punto de reorden,
    demanda promedio semanal (calculada de ventas reales),
    cantidad sugerida, costo estimado
```

**Puedo hacer yo**:
- Conectar ComprasPage al endpoint real
- Quitar el alert de "datos simulados"
- Mantener la configuracion de lead time/safety stock como parametros
- Agregar la exportacion real a CSV/Excel

**Tu necesitas hacer**:
- Endpoint que calcule demanda real desde tabla de ventas
- Query: `AVG(qty) por semana por producto` de los ultimos 90 dias

---

## 6. Exportacion a Excel (Prioridad Media)

**Estado actual**: Solo CSV basico desde el frontend.

**Mejor enfoque** (como ya discutimos):

```text
Backend: GET /reports/ventas?from=X&to=Y&sucursal=Z
  - Genera .xlsx con ExcelJS
  - Hoja 1: KPIs resumen
  - Hoja 2: Detalle de ventas
  - Hoja 3: Desglose por sucursal
  - Headers: Content-Type application/vnd.openxmlformats...
  - Frontend descarga el blob directamente
```

**Puedo hacer yo**:
- Cambiar el boton "Exportar" para llamar al endpoint y descargar el archivo
- Agregar indicador de carga durante la generacion
- Aplicar el mismo patron a Inventario y Compras

**Tu necesitas hacer**:
- Instalar ExcelJS en el backend
- Implementar el endpoint `/reports/ventas`
- Formatear columnas (moneda, fechas, porcentajes)

---

## 7. Persistencia de Propiedades (Prioridad Media)

**Estado actual**: `usePropiedades.ts` usa `useState` con datos mock. Todo se pierde al refrescar.

**Mejor enfoque**:

```text
Backend:
  Tablas: propiedades, contratos, pagos, mantenimiento, documentos_propiedad
  Endpoints CRUD para cada entidad

Frontend (yo):
  1. Crear propiedadesService.ts (como salesService.ts)
  2. Crear hooks con React Query (como useSales.ts)
  3. Reemplazar useState por useQuery/useMutation
  4. Mantener exactamente la misma UI
```

**Puedo hacer yo**:
- Todo el refactor del frontend: services, hooks con React Query, cache invalidation
- Misma UI, solo cambia la fuente de datos

**Tu necesitas hacer**:
- Tablas y endpoints REST en el backend

---

## 8. Persistencia de Proveedores (Prioridad Media)

**Estado actual**: Usa `useState` con datos de `DataContext` (mock).

**Mismo patron que Propiedades**:
- Service + hooks React Query
- CRUD completo contra API

**Puedo hacer yo**: Service, hooks, conexion a API
**Tu necesitas hacer**: Tabla `proveedores` y endpoints CRUD

---

## 9. Soporte/Tickets con backend (Prioridad Baja)

**Estado actual**: Persiste en `localStorage` unicamente.

**Mejor enfoque**:
- Endpoint `GET/POST /tickets`, `PATCH /tickets/:id`
- Endpoint `GET/POST /tickets/:id/comments`
- React Query para sincronizacion

**Puedo hacer yo**: Service, hooks, conexion. La UI ya esta completa.
**Tu necesitas hacer**: Tablas y endpoints (ya tienes tabla de soporte en tu schema segun la memoria del proyecto).

---

## 10. Notificaciones dinamicas (Prioridad Baja)

**Estado actual**: `NotificationsPanel` usa datos mock estaticos.

**Mejor enfoque**:
- Endpoint `GET /notifications` que genere alertas basadas en reglas del negocio (stock bajo, documentos por vencer, pagos pendientes)
- O calcularlas en el frontend a partir de datos ya cargados (mas simple, sin endpoint extra)

**Puedo hacer yo**: Conectar el panel a datos reales ya existentes en la app (inventario, ventas) o a un endpoint dedicado.

---

## 11. Simulador de rol (Prioridad Baja)

**Estado actual**: Visible en todos los modulos y en produccion.

**Solucion**: Ocultarlo fuera de modo desarrollo (`import.meta.env.DEV`) y solo mostrarlo en el modulo de Refaccionarias.

**Puedo hacerlo yo**: Si, directamente. Es un cambio de condicion en el topbar.

---

## Resumen: Que puedo hacer yo vs que necesitas tu

| Area | Yo (Lovable) | Tu (Backend) |
|------|-------------|--------------|
| Bug ruta Dashboard | 100% | - |
| Vehiculos UI | 100% UI, types, services, hooks | Tablas + endpoints REST |
| Creacion de Ventas | Modal, validacion, conexion API | Endpoint POST /sales |
| Prediccion real | Conexion a API, graficos | Endpoint GET /forecast |
| Compra Sugerida real | Conexion a API | Endpoint con calculo de demanda |
| Excel export | Boton + descarga blob | ExcelJS endpoint |
| Propiedades backend | Refactor a React Query | Tablas + endpoints CRUD |
| Proveedores backend | Refactor a React Query | Tablas + endpoints CRUD |
| Tickets backend | Refactor a React Query | Endpoints CRUD |
| Notificaciones | 100% | Opcional: endpoint |
| Simulador de rol | 100% | - |

## Orden de implementacion sugerido

1. Bug ruta Dashboard + Simulador de rol (inmediato, 5 min)
2. Modulo de Vehiculos completo (UI)
3. Creacion de Ventas (cuando tengas el endpoint)
4. Propiedades -> React Query (cuando tengas endpoints)
5. Proveedores -> React Query (cuando tengas endpoints)
6. Prediccion y Compra Sugerida (cuando tengas endpoints de forecast)
7. Exportacion Excel (cuando tengas endpoint de reportes)
8. Tickets y Notificaciones

