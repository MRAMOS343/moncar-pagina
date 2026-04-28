/**
 * Sanitiza strings para prevenir XSS.
 * Acepta valores nullish y devuelve "" para evitar crashes en call-sites no validados.
 */
export function sanitizeHtml(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza strings para URLs
 */
export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input);
    // Solo permitir http y https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '#';
    }
    return url.toString();
  } catch {
    return '#';
  }
}

/**
 * Sanitiza números de teléfono. Tolera nullish.
 */
export function sanitizePhone(input?: string | null): string {
  if (!input) return '';
  return input.replace(/[^\d\s\-\+\(\)]/g, '');
}
