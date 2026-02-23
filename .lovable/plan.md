

# Analisis de Bugs y Plan de Optimizacion

## Parte 1: Bugs Detectados

### BUG 1 - Warning de ref en SidebarMenuButton (Consola)
**Severidad**: Baja (no rompe funcionalidad, pero genera warnings en consola)

El warning "Function components cannot be given refs" ocurre porque `SidebarMenuButton` usa `asChild` con `Slot`, y cuando tiene `tooltip`, envuelve el boton en `<TooltipTrigger asChild>`. El componente hijo (`NavLink` de react-router) es un function component que no soporta refs via `forwardRef`.

**Solucion**: Envolver el `NavLink` dentro de `AppSidebar.tsx` con un `<span>` o convertir la referencia para que `TooltipTrigger` no intente pasar un ref directamente al `NavLink`.

---

### BUG 2 - Modales de Vehiculos no resetean estado al reabrir
**Severidad**: Media

En `VehicleFormModal`, `MaintenanceVehFormModal`, `ExpenseVehFormModal` y `DocVehFormModal`, el `useState` se inicializa una sola vez con los valores del prop. Si el usuario abre el modal, lo cierra, y lo reabre (o cambia entre editar/crear), el formulario mantiene los datos anteriores porque React no reinicializa `useState` cuando los props cambian.

**Ejemplo concreto**: Si editas un vehiculo y luego haces clic en "Nuevo Vehiculo", el formulario mostrara los datos del vehiculo anterior.

**Solucion**: Agregar un `useEffect` que sincronice el estado del formulario cuando cambia el prop `vehiculo`/`mantenimiento`, o usar el patron `key={vehiculo?.id ?? 'new'}` en el componente para forzar un remount.

---

### BUG 3 - Eliminacion de gastos sin confirmacion
**Severidad**: Media

En `VehiculosPage.tsx`, el boton de eliminar gasto llama directamente a `deleteGasto(g.id)` sin ningun dialogo de confirmacion. Un clic accidental elimina el registro sin posibilidad de deshacer.

**Solucion**: Agregar un `AlertDialog` de confirmacion antes de ejecutar la eliminacion, igual que se hace en otros modulos.

---

### BUG 4 - Eliminacion de vehiculo sin limpieza de datos relacionados
**Severidad**: Media

En `useVehiculos.ts`, `deleteVehiculo` solo elimina el vehiculo del array, pero no elimina los documentos, mantenimientos ni gastos asociados. Esto deja datos huerfanos en memoria.

**Solucion**: Al eliminar un vehiculo, tambien filtrar documentos, mantenimientos y gastos que tengan ese `vehiculoId`.

---

### BUG 5 - DocVehFormModal no respeta defaults al reabrir desde detalle
**Severidad**: Baja

En `VehiculosPage.tsx`, `handleAddDocFromDetail` establece `docDefaultTipo` y `docDefaultVehId`, pero el `useState` dentro de `DocVehFormModal` solo lee estos valores en el montaje inicial. Si el modal ya fue montado previamente, los defaults no se aplican.

**Solucion**: Misma solucion que Bug 2 — usar `key` o `useEffect`.

---

### BUG 6 - `handleSaveProduct` en DashboardPage usa `setTimeout` simulado
**Severidad**: Baja (ya documentado en plan maestro)

Linea 138 de `DashboardPage.tsx` simula un guardado con `setTimeout(500ms)` sin llamar a ningun endpoint real.

---

## Parte 2: Optimizaciones de Carga

### OPT 1 - Lazy loading ya implementado correctamente
Las paginas ya usan `React.lazy()` en `main.tsx`. No se necesitan cambios aqui.

### OPT 2 - DataContext carga datos mock innecesariamente en modulos que no los usan
**Impacto**: Bajo-Medio

`DataContext` importa y carga `mockProducts`, `mockSales`, `mockInventory`, etc. en **todos** los modulos (Vehiculos, Propiedades), aunque solo se usan en Refaccionarias. Esto agrega peso al bundle y memoria innecesaria.

**Solucion**: Mover `DataProvider` para que solo envuelva el modulo de Refaccionarias en lugar de estar en `App.tsx` envolviendo toda la aplicacion. Esto reduce el scope de los datos mock y prepara la arquitectura para cuando se eliminen.

### OPT 3 - Modales de Vehiculos se renderizan siempre en el DOM
**Impacto**: Bajo

Los 5 modales del modulo de Vehiculos (`VehicleFormModal`, `VehicleDetailModal`, `MaintenanceVehFormModal`, `ExpenseVehFormModal`, `DocVehFormModal`) se renderizan en `VehiculosPage` permanentemente, aunque esten cerrados. Radix Dialog ya maneja esto internamente con `open`, pero los componentes hijos (formularios con `useState`) se inicializan innecesariamente.

**Solucion**: Renderizar condicionalmente con `{vehFormOpen && <VehicleFormModal ... />}` en lugar de depender solo del prop `open`. Esto tambien resuelve el Bug 2 automaticamente.

### OPT 4 - Bundle de iconos Lucide
**Impacto**: Bajo

Se importan iconos individuales correctamente (`import { Truck } from 'lucide-react'`), lo cual ya es tree-shakeable. No se necesitan cambios.

---

## Resumen de cambios propuestos

| # | Tipo | Cambio | Archivos |
|---|------|--------|----------|
| 1 | Bug | Envolver NavLink en span para evitar warning de ref | `AppSidebar.tsx` |
| 2 | Bug | Renderizar modales condicionalmente (resuelve reset de estado) | `VehiculosPage.tsx` |
| 3 | Bug | Agregar confirmacion antes de eliminar gastos | `VehiculosPage.tsx` |
| 4 | Bug | Limpiar datos huerfanos al eliminar vehiculo | `useVehiculos.ts` |
| 5 | Opt | Mover DataProvider al scope de Refaccionarias | `App.tsx`, `RefaccionariasLayout.tsx` |

## Detalle tecnico de implementacion

**Bug 1 - Ref warning**: En `AppSidebar.tsx` linea 75, cambiar el `NavLink` hijo de `SidebarMenuButton asChild` para envolverlo en un `<span>` que absorba el ref, o alternativamente no pasar tooltip cuando el sidebar esta expandido.

**Bug 2+3+5 - Modales**: En `VehiculosPage.tsx`, cambiar de:
```
<VehicleFormModal open={vehFormOpen} ... />
```
a:
```
{vehFormOpen && <VehicleFormModal open={vehFormOpen} ... />}
```
Esto fuerza un remount cada vez que se abre, reseteando el estado interno. Aplicar el mismo patron a los 5 modales.

**Bug 3 - Confirmacion**: Agregar un `AlertDialog` que pregunte "Estas seguro de eliminar este gasto?" antes de llamar a `deleteGasto`.

**Bug 4 - Datos huerfanos**: En `useVehiculos.ts`, modificar `deleteVehiculo` para tambien filtrar documentos, mantenimientos y gastos del vehiculo eliminado.

**Opt 5 - DataProvider scope**: Mover `<DataProvider>` de `App.tsx` a `RefaccionariasLayout.tsx`, ya que es el unico modulo que consume esos datos mock.

