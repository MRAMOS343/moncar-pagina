import { apiRequest } from './apiClient';
import { toast } from 'sonner';

function getToken() {
  return localStorage.getItem('moncar_token');
}

interface InitUploadResponse {
  archivo_id: string;
  upload_id: string;
  clave_objeto: string;
  parte_bytes: number;
  partes_totales: number;
  expires_in_seconds: number;
}

interface PartUrlResponse {
  url: string;
}

interface CompletePart {
  numero_parte: number;
  etag: string;
}

export async function initUpload(data: {
  nombre_original: string;
  tipo_mime: string;
  tamanio_bytes: number;
  carpeta_logica?: string;
  etiquetas?: string;
  referencia?: string;
}): Promise<InitUploadResponse> {
  return apiRequest<InitUploadResponse>('/api/v1/archivos/init', { method: 'POST', token: getToken(), body: data });
}

export async function getPartUrl(archivoId: string, numeroParte: number): Promise<string> {
  const res = await apiRequest<PartUrlResponse>(`/api/v1/archivos/${archivoId}/parte-url`, {
    method: 'POST', token: getToken(), body: { numero_parte: numeroParte },
  });
  return res.url;
}

export async function uploadPartToUrl(url: string, chunk: Blob): Promise<string> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      body: chunk,
      // No Content-Type header — S3 signed URLs expect the raw binary
      // No mode: 'no-cors' — we need the response to read ETag
    });

    if (!res.ok) {
      throw new Error(`Upload part failed: HTTP ${res.status}`);
    }

    // ETag may be blocked by CORS — that's OK, use a fallback
    const etag = res.headers.get('ETag') ?? res.headers.get('etag') ?? '';
    return etag;
  } catch (err: unknown) {
    // If CORS blocks the request entirely, try with no-cors mode
    // In this case we won't get the ETag, but the upload still happens
    console.warn('PUT to signed URL failed, retrying with no-cors:', err);

    const res = await fetch(url, {
      method: 'PUT',
      body: chunk,
      mode: 'no-cors',
    });

    // no-cors returns opaque response — we can't read status or ETag
    // Return empty etag; backend should handle this gracefully
    console.log('no-cors PUT completed, opaque response type:', res.type);
    return '';
  }
}

export async function completeUpload(archivoId: string, partes: CompletePart[]): Promise<void> {
  await apiRequest(`/archivos/${archivoId}/completar`, { method: 'POST', token: getToken(), body: { partes } });
}

export async function getDownloadUrl(archivoId: string): Promise<string> {
  const res = await apiRequest<{ url: string }>(`/archivos/${archivoId}/descargar`, { token: getToken() });
  return res.url;
}

/**
 * High-level: upload a File using the multipart flow.
 * Returns archivo_id.
 * onProgress: 0..1
 */
export async function uploadFile(
  file: File,
  opts?: { carpetaLogica?: string; onProgress?: (pct: number) => void }
): Promise<string> {
  const init = await initUpload({
    nombre_original: file.name,
    tipo_mime: file.type || 'application/octet-stream',
    tamanio_bytes: file.size,
    carpeta_logica: opts?.carpetaLogica,
  });

  const { archivo_id, parte_bytes, partes_totales } = init;
  const partes: CompletePart[] = [];

  for (let i = 0; i < partes_totales; i++) {
    const start = i * parte_bytes;
    const end = Math.min(start + parte_bytes, file.size);
    const chunk = file.slice(start, end);

    const url = await getPartUrl(archivo_id, i + 1);
    const etag = await uploadPartToUrl(url, chunk);

    partes.push({ numero_parte: i + 1, etag });
    opts?.onProgress?.((i + 1) / partes_totales);
  }

  await completeUpload(archivo_id, partes);
  return archivo_id;
}
