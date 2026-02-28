

# Ventas: Eliminar "Nueva Venta" y rediseñar botón de reporte

## Cambios en `src/pages/VentasPage.tsx`

### 1. Eliminar botón "Nueva Venta"
- Eliminar el botón `handleCreateSale` y su handler completo (líneas 186-198)
- Eliminar el import de `Plus`
- Eliminar la acción "Crear Nueva Venta" del `EmptyState` (línea 471-474)

### 2. Rediseñar botón de exportación
- Reemplazar el botón simple "Exportar" por un grupo con:
  - Un `Select` para elegir el período del reporte: **1 Semana**, **1 Mes**, **3 Meses**, **Histórico**
  - Un `Button` "Descargar Reporte" que descarga el CSV del período seleccionado
- El período del reporte es **independiente** del filtro de la tabla — permite descargar un rango diferente al que se está viendo
- Estado nuevo: `reportPeriod` con valores `'7d' | '1m' | '3m' | 'all'`
- Al hacer click en "Descargar Reporte", calcula las fechas `from`/`to` según el período seleccionado y llama a la API para obtener esos datos, luego exporta a CSV

### 3. Lógica de descarga
- Como el reporte puede abarcar un rango diferente al de la tabla, se hará un fetch directo con `fetchSales()` del servicio (no de los datos ya cargados en la tabla)
- Estado de loading mientras se descarga (`isDownloading`)
- Toast de éxito/error al completar

