/**
 * Devuelve el máximo de un array, o `fallback` si está vacío.
 * Evita el bug de `Math.max(...[])` → `-Infinity`.
 */
export const safeMax = (arr: number[], fallback = 0): number =>
  arr.length === 0 ? fallback : Math.max(...arr);

/**
 * Devuelve el mínimo de un array, o `fallback` si está vacío.
 */
export const safeMin = (arr: number[], fallback = 0): number =>
  arr.length === 0 ? fallback : Math.min(...arr);
