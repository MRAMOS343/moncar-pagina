const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface ReportParams {
  from: string;
  to?: string;
  sucursal_id?: string;
}

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

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
