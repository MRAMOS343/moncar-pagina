
# Plan: Corregir Problema de Timezone en Fechas de Ventas

## Problema Identificado

El campo `usu_fecha` viene de la API como `"2026-01-30T00:00:00.000Z"` (UTC). Cuando el código hace:

```typescript
new Date("2026-01-30T00:00:00.000Z").toLocaleDateString('es-MX')
```

En la zona horaria de Mexico (UTC-6), JavaScript resta 6 horas y convierte:
- `2026-01-30T00:00:00 UTC` → `2026-01-29T18:00:00 Mexico` → Muestra **29/1/2026**

## Solución

Crear una función utilitaria que extraiga la fecha directamente del string ISO sin interpretación de timezone, y usarla en todos los lugares afectados.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/utils/formatters.ts` | Agregar función `formatDateFromISO` que evita timezone shift |
| `src/components/modals/SaleDetailModal.tsx` | Usar la nueva función en vez de `new Date().toLocaleDateString()` |
| `src/pages/VentasPage.tsx` | Usar la nueva función para el gráfico de tendencia |
| `src/pages/DashboardPage.tsx` | Usar la nueva función en ventas recientes |

## Detalles Técnicos

### 1. Nueva función en `src/utils/formatters.ts`

```typescript
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
```

### 2. Actualizar `SaleDetailModal.tsx` (línea 87-89)

```typescript
// Antes:
{data.venta.usu_fecha 
  ? `${new Date(data.venta.usu_fecha).toLocaleDateString('es-MX')} ${data.venta.usu_hora || ''}`
  : '---'}

// Después:
{data.venta.usu_fecha 
  ? `${formatDateFromISO(data.venta.usu_fecha)} ${data.venta.usu_hora || ''}`
  : '---'}
```

### 3. Actualizar `VentasPage.tsx` (línea 171-173)

```typescript
// Antes:
.map(([date, value]) => ({
  date: format(new Date(date), 'dd/MM', { locale: es }),
  value
}));

// Después - Formatear directamente sin crear Date:
.map(([date, value]) => {
  const [year, month, day] = date.split('-');
  return {
    date: `${day}/${month}`,
    value
  };
});
```

### 4. Actualizar `DashboardPage.tsx` (línea 338-342)

```typescript
// Antes:
{venta.usu_fecha 
  ? new Date(venta.usu_fecha).toLocaleDateString('es-MX') 
  : '---'
} {venta.usu_hora || ''}

// Después:
{formatDateFromISO(venta.usu_fecha)} {venta.usu_hora || ''}
```

## Resultado Esperado

| Ubicación | Antes (con bug) | Después (corregido) |
|-----------|-----------------|---------------------|
| Modal Detalle | 29/1/2026 13:40:11 | 30/01/2026 13:40:11 |
| Gráfico Tendencia | Termina en 29/01 | Termina en 30/01 |
| Ventas Recientes | 29/1/2026 | 30/01/2026 |

## Por qué esta solución funciona

```text
Dato de API: "2026-01-30T00:00:00.000Z"
                    ↓
         split('T')[0] = "2026-01-30"
                    ↓
         split('-') = ["2026", "01", "30"]
                    ↓
         Formatear: "30/01/2026"

✓ Sin conversión a Date = Sin problema de timezone
✓ La fecha que el usuario registró es la que se muestra
```
