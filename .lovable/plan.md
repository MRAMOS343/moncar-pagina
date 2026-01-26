

# Plan: Selector Global de Período para KPIs

## Objetivo
Agregar un selector de período compacto justo arriba de los KPIs (Ventas Totales, Ticket Promedio, Transacciones) que permita al usuario cambiar rápidamente el rango de fechas para los indicadores.

## Diseño Visual

```text
┌─────────────────────────────────────────────────────────┐
│  Ventas                                                 │
│  Registro de ventas en Todas las Sucursales             │
│                                                         │
│  Período:  [7 días ▼]                    ← NUEVO        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │Ventas Totales│ │Ticket Promedio││ Transacciones│    │
│  │  $1,234,567  │ │    $1,500    ││     823      │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  [Gráfico de tendencia]                                 │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

### 1. `src/pages/VentasPage.tsx`

**Cambios principales:**
- Agregar un nuevo estado `kpiPeriod` para controlar el período de los KPIs independientemente
- Insertar un selector `Select` compacto arriba del grid de KPIs
- Mantener el `dateRange` existente para la tabla (opcional: sincronizarlos o mantenerlos separados)
- Agregar etiqueta descriptiva del período seleccionado

**Ubicación del selector:**
- Entre el header de la página y el grid de KPIs (después de línea 277, antes de línea 279)
- Diseño inline: "Período: [Dropdown]" alineado a la izquierda

**Opciones del dropdown:**
- "Hoy" (1d)
- "Últimos 7 días" (7d)
- "Últimos 30 días" (30d)
- "Últimos 90 días" (90d)

---

## Decisión de Diseño: ¿Sincronizar con tabla?

**Opción A: Selector independiente para KPIs**
- El período de KPIs es separado del período de la tabla
- Más flexibilidad pero puede confundir al usuario

**Opción B: Un solo selector que afecta todo** (Recomendado)
- Mover el selector actual de la sección de filtros a arriba de los KPIs
- El mismo período aplica a KPIs, gráfico y tabla
- Interfaz más simple y coherente

Implementaré la **Opción B**: un único selector global que se posiciona arriba de los KPIs y controla todo el dashboard de ventas.

---

## Implementación Técnica

### Cambios en `VentasPage.tsx`

**1. Agregar nuevo bloque de selector (línea ~279)**

```tsx
{/* Selector de período global */}
<div className="flex items-center gap-3">
  <span className="text-sm font-medium text-muted-foreground">Período:</span>
  <Select value={dateRange} onValueChange={setDateRange}>
    <SelectTrigger className="w-[180px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1d">Hoy</SelectItem>
      <SelectItem value="7d">Últimos 7 días</SelectItem>
      <SelectItem value="30d">Últimos 30 días</SelectItem>
      <SelectItem value="90d">Últimos 90 días</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**2. Actualizar `fromDate` para manejar "1d" (Hoy)**

```tsx
const fromDate = useMemo(() => {
  const now = new Date();
  switch (dateRange) {
    case '1d':
      return format(now, 'yyyy-MM-dd'); // Solo hoy
    case '7d':
      return format(subDays(now, 7), 'yyyy-MM-dd');
    case '30d':
      return format(subDays(now, 30), 'yyyy-MM-dd');
    case '90d':
      return format(subDays(now, 90), 'yyyy-MM-dd');
    default:
      return format(subDays(now, 30), 'yyyy-MM-dd');
  }
}, [dateRange]);
```

**3. Simplificar sección de filtros**
- Remover el selector de período de la Card de Filtros
- Mantener solo el switch "Incluir canceladas" en los filtros

---

## Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/VentasPage.tsx` | Agregar selector global arriba de KPIs, agregar opción "Hoy", simplificar filtros |

## Resultado Esperado
- El usuario verá un selector compacto "Período: [dropdown]" justo arriba de los tres KPIs
- Al cambiar el período, se actualizarán los KPIs, el gráfico de tendencia y la tabla de ventas
- La sección de filtros quedará más limpia, solo con el switch de canceladas

