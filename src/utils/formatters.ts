/**
 * Utilidades de formateo reutilizables
 */

/**
 * Convierte string/number a number de forma segura
 * Útil para valores que vienen como string desde Postgres (numeric)
 * @param value - Valor a convertir
 * @param fieldName - Nombre del campo (opcional, para logging en dev)
 */
export function toNumber(value: string | number | undefined | null, fieldName?: string): number {
  if (value === undefined || value === null) {
    // Log en dev para detectar datos nulos inesperados
    if (import.meta.env.DEV && fieldName) {
      console.warn(`[toNumber] Campo '${fieldName}' es nulo, usando 0`);
    }
    return 0;
  }
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatea un número como moneda mexicana
 * Acepta string o number (convierte automáticamente)
 */
export function formatCurrency(value: number | string): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(num);
}

/**
 * Formatea un número como porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formatea un valor según su tipo
 */
export function formatValue(
  value: number | string, 
  format?: 'currency' | 'percentage' | 'number'
): string {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'number':
      return formatNumber(value);
    default:
      return String(value);
  }
}

/**
 * Formatea una fecha ISO evitando problemas de timezone.
 * Extrae componentes directamente del string sin crear objeto Date con UTC.
 * 
 * @param isoDate - Fecha en formato ISO (ej: "2026-01-30T00:00:00.000Z")
 * @param format - Formato de salida: 'short' (30/01), 'medium' (30/01/2026), 'full' (30 de enero de 2026)
 * @returns Fecha formateada en español
 */
export function formatDateFromISO(
  isoDate: string | null | undefined, 
  format: 'short' | 'medium' | 'full' = 'medium'
): string {
  if (!isoDate) return '---';
  
  // Extraer YYYY-MM-DD directamente del string (antes de la T)
  const datePart = isoDate.split('T')[0];
  const [year, month, day] = datePart.split('-');
  
  if (!year || !month || !day) return '---';
  
  switch (format) {
    case 'short':
      return `${day}/${month}`;
    case 'medium':
      return `${day}/${month}/${year}`;
    case 'full':
      // Crear Date con hora local del mediodía para evitar shift
      const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
      return date.toLocaleDateString('es-MX', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Formatea una cantidad con máximo 1 decimal
 * Si es entero, no muestra decimales
 */
export function formatQuantity(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return num % 1 === 0 
    ? num.toLocaleString('es-MX') 
    : num.toLocaleString('es-MX', { maximumFractionDigits: 1 });
}
