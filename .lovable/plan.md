

# Conectar descarga de reporte Excel desde el backend

## Contexto
El backend ya tiene `GET /api/v1/sales/report` que genera un Excel (.xlsx). El frontend actualmente descarga CSV haciendo fetch paginado local. Hay que reemplazar esa lógica para que llame al nuevo endpoint y descargue el binario.

## Cambios

### 1. Crear `src/services/salesReportService.ts`
- Función `downloadSalesReport(token, params: { from, to?, sucursal_id? })` que:
  - Hace `fetch` GET al endpoint `/sales/report` con query params y Authorization header
  - Si respuesta no es ok, parsea JSON de error y lanza
  - Convierte respuesta a `blob()`
  - Extrae filename del header `Content-Disposition`
  - Crea link temporal y dispara descarga

### 2. Modificar `src/pages/VentasPage.tsx`
- Reemplazar `handleDownloadReport`: en vez de paginar con `fetchSales` + `exportToCSV`, llamar a `downloadSalesReport`
- Eliminar imports no usados: `exportToCSV`, `fetchSales`, `SaleListItem` (si solo se usaba aquí para el reporte)
- Mantener la lógica de calcular `fromDate` según `reportPeriod` y el estado `isDownloading`

