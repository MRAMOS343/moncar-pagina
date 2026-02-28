

## Diagnosis

The frontend code in `salesReportService.ts` and `VentasPage.tsx` is correctly wired to call `GET /api/v1/sales/report` and handle the binary blob. The backend is confirmed working (HTTP 200, 87KB Excel). Since a CSV is still being downloaded, the issue is likely one of:

1. **CORS blocking `Content-Disposition` header** -- if the browser can't read the header, the filename defaults to `.xlsx`, so this alone wouldn't cause CSV
2. **The response is actually HTML/text** (e.g., a CORS error page or redirect) being saved as a file
3. **An old cached version** of the code is running

## Plan

### Step 1: Add debug logging to `salesReportService.ts`

Add `console.log` statements to capture the actual response metadata before downloading, so we can see in the browser console exactly what's happening:

```typescript
export async function downloadSalesReport(token: string, params: ReportParams): Promise<void> {
  const query = new URLSearchParams({ from: params.from });
  if (params.to) query.set("to", params.to);
  if (params.sucursal_id) query.set("sucursal_id", params.sucursal_id);

  const url = `${API_BASE_URL}/api/v1/sales/report?${query}`;
  console.log('[SalesReport] Fetching:', url);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('[SalesReport] Status:', res.status);
  console.log('[SalesReport] Content-Type:', res.headers.get('Content-Type'));
  console.log('[SalesReport] Content-Disposition:', res.headers.get('Content-Disposition'));

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error ?? `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  console.log('[SalesReport] Blob type:', blob.type, 'size:', blob.size);

  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? "reporte_ventas.xlsx";
  console.log('[SalesReport] Filename:', filename);

  // ... rest of download logic unchanged
}
```

This will reveal:
- Whether the URL is correct (`api.grupomonzalvo.mx` vs `localhost:4000`)
- Whether the response Content-Type is `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel) or `text/csv`
- Whether the blob actually contains Excel data
- Whether the filename is being extracted correctly

This is a single-file change to `src/services/salesReportService.ts`. Once the user triggers the download and checks the browser console, we'll know exactly what's wrong.

