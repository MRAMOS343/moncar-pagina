
# Simplificar pagina de Vehiculos y mejorar KPI de "Por Vencer"

## Cambio 1: Eliminar tabs de Mantenimiento y Gastos

Quitar completamente las tabs y dejar solo el contenido de Flotilla sin wrapper de Tabs. Esto implica:

- Eliminar el componente `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Eliminar todo el markup de las tabs "mantenimiento" y "gastos" (lineas 140-248)
- Eliminar los modals de `MaintenanceVehFormModal` y `ExpenseVehFormModal` (lineas 252-268)
- Eliminar estados relacionados: `maintFormOpen`, `editingMaint`, `expenseFormOpen`
- Eliminar imports no usados: `Plus`, `Wrench`, `Trash2`, `Table*`, `AlertDialog*`, `MaintenanceVehFormModal`, `ExpenseVehFormModal`, `Badge` (si ya no se usa), `MantenimientoVehiculo`
- El contenido de la tab "flotilla" (buscador + lista de rutas) queda directamente en la pagina sin tabs

## Cambio 2: Reemplazar KPI "Por Vencer" con selector de plazo

Reemplazar la tarjeta estatica "Por Vencer (30d)" por una tarjeta interactiva con un `Select` que permita elegir entre 3 plazos: **7 dias**, **1 mes**, **2 meses**.

- Agregar estado `plazoVencer` con valores `'7d' | '1m' | '2m'`, default `'1m'`
- El KPI mostrara el conteo segun el plazo seleccionado
- Debajo de los KPIs, cuando haya documentos por vencer en el plazo seleccionado, mostrar una seccion expandible/lista que muestre:
  - Nombre de la unidad (ej: "Unidad 04 — ABC-123")
  - Documentos que vencen en ese plazo con su fecha de vigencia
  - Agrupados por unidad para facil lectura

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/VehiculosPage.tsx` | Eliminar tabs/mantenimiento/gastos, agregar selector de plazo en KPI y lista de docs por vencer |
