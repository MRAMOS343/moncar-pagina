

# Complementar descarga de reportes: Presets + Mes específico

## Resumen

Agregar al selector de descarga de reportes un modo dual: los **presets rápidos existentes** (1 Semana, 1 Mes, 3 Meses, Histórico) se mantienen y siguen usando `from/to`, y se agrega una nueva opción **"Mes específico"** que usa el parámetro `month` del backend.

## Cambios

### 1. `src/services/salesReportService.ts`
- Ampliar `ReportParams`: agregar `month?: string` (YYYY-MM)
- Si `month` está presente, enviar solo `month` (sin `from`/`to`)
- Si no, mantener lógica actual con `from`/`to`

### 2. `src/pages/VentasPage.tsx` — UI del selector (líneas 278-305)
- Agregar al Select existente un separador visual y la opción `"month"` → "Mes específico"
- Cuando `reportPeriod === 'month'`, mostrar un segundo Select con la lista de meses (desde Enero 2024 hasta el mes actual), formato visual "Marzo 2026", valor interno "2026-03"
- Agregar leyenda contextual:
  - Mes actual → "Del 01 al día de hoy"
  - Mes cerrado → "Mes completo"

### 3. `src/pages/VentasPage.tsx` — Handler (líneas 191-223)
- Si `reportPeriod === 'month'`, llamar `downloadSalesReport` con `{ month: selectedMonth }`
- Si es preset (7d, 1m, 3m, all), mantener lógica actual con `from`

### 4. Estado nuevo
- `selectedMonth: string` — inicializado al mes actual en formato YYYY-MM

### Flujo del selector
```text
┌─────────────────────┐  ┌──────────────────┐
│ [1 Semana       ▾]  │  │ [Descargar]      │
│  1 Semana           │  └──────────────────┘
│  1 Mes              │
│  3 Meses            │
│  Histórico          │
│  ────────────────   │
│  Mes específico     │
└─────────────────────┘

Si "Mes específico":
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────┐
│ [Mes específico ▾]  │  │ [Marzo 2026  ▾]  │  │ [Descargar]  │
└─────────────────────┘  └──────────────────┘  └──────────────┘
                          "Del 01 al día de hoy"
```

