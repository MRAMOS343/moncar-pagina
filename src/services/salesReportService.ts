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

  const res = await fetch(`${API_BASE_URL}/api/v1/sales/report?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error ?? `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? "reporte_ventas.xlsx";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
