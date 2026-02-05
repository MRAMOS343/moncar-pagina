

# Plan: Agregar Selector de Período al Dashboard

## Resumen

Agregar un selector de período al Dashboard, similar al de la página de Ventas, permitiendo ver datos de Hoy, 7 días, 30 días, 90 días o histórico completo.

## Cambios a Realizar

### Archivo: `src/pages/DashboardPage.tsx`

| Cambio | Descripción |
|--------|-------------|
| Nuevo estado | `const [dateRange, setDateRange] = useState('30d')` |
| Nuevo selector | Select con opciones: Hoy, 7D, 30D, 90D, Histórico |
| Cálculo dinámico de `from` | Usar `subDays` basado en la selección |
| Actualizar títulos | Mostrar el período seleccionado en descripciones |

## Opciones de Período

| Valor | Etiqueta | Días hacia atrás |
|-------|----------|------------------|
| `1d` | Hoy | 0 |
| `7d` | Últimos 7 días | 7 |
| `30d` | Últimos 30 días | 30 |
| `90d` | Últimos 90 días | 90 |
| `365d` | Último año | 365 |
| `all` | Histórico completo | Sin límite (omitir `from`) |

## Código a Agregar

### 1. Nuevo estado y cálculo de fecha

```typescript
const [dateRange, setDateRange] = useState<string>('30d');

const fromDate = useMemo(() => {
  if (dateRange === 'all') return undefined; // Sin límite
  const now = new Date();
  switch (dateRange) {
    case '1d': return format(now, 'yyyy-MM-dd');
    case '7d': return format(subDays(now, 7), 'yyyy-MM-dd');
    case '30d': return format(subDays(now, 30), 'yyyy-MM-dd');
    case '90d': return format(subDays(now, 90), 'yyyy-MM-dd');
    case '365d': return format(subDays(now, 365), 'yyyy-MM-dd');
    default: return format(subDays(now, 30), 'yyyy-MM-dd');
  }
}, [dateRange]);

const periodLabel = useMemo(() => {
  switch (dateRange) {
    case '1d': return 'Hoy';
    case '7d': return 'últimos 7 días';
    case '30d': return 'últimos 30 días';
    case '90d': return 'últimos 90 días';
    case '365d': return 'último año';
    case 'all': return 'histórico completo';
    default: return 'últimos 30 días';
  }
}, [dateRange]);
```

### 2. Actualizar llamada a useDashboardSales

```typescript
const { data: salesResult, isLoading, isFetching, refetch } = useDashboardSales({
  from: fromDate, // Ahora es dinámico (puede ser undefined para "all")
  sucursal_id: currentWarehouse === 'all' ? undefined : currentWarehouse,
});
```

### 3. UI del selector (junto al botón Actualizar)

```typescript
<div className="flex gap-2 items-center">
  <Select value={dateRange} onValueChange={setDateRange}>
    <SelectTrigger className="w-[180px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1d">Hoy</SelectItem>
      <SelectItem value="7d">Últimos 7 días</SelectItem>
      <SelectItem value="30d">Últimos 30 días</SelectItem>
      <SelectItem value="90d">Últimos 90 días</SelectItem>
      <SelectItem value="365d">Último año</SelectItem>
      <SelectItem value="all">Histórico completo</SelectItem>
    </SelectContent>
  </Select>
  
  <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
    Actualizar
  </Button>
  {/* ... otros botones ... */}
</div>
```

### 4. Actualizar hook useDashboardSales

Modificar para soportar `from: undefined` (histórico completo):

```typescript
// En useDashboardSales.ts
interface DashboardSalesParams {
  from?: string; // Ahora opcional
  sucursal_id?: string;
}

// En queryKey
queryKey: ["dashboard-sales", params.from ?? "all", params.sucursal_id ?? "all"],

// En fetchSales call
from: params.from, // undefined = sin filtro de fecha
```

## Flujo Visual

```text
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                   │
│  Resumen general del sistema - Sucursal Norte               │
│                                                              │
│  ┌─────────────────┐  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Últimos 30 días ▼│  │Actualizar│ │Nueva Vta │ │ +Prod   │ │
│  └─────────────────┘  └──────────┘ └──────────┘ └─────────┘ │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ $337,515 │ │    928   │ │  $363.70 │ │    12    │        │
│  │  Ventas  │ │Transacc. │ │  Ticket  │ │Canceladas│        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

- Al seleccionar "Últimos 90 días", los KPIs mostrarán ~$337,515 y ~928 transacciones
- Al seleccionar "Histórico completo", se cargarán todos los datos disponibles (con advertencia si son muchos)
- El título de la gráfica de tendencia se actualizará dinámicamente según el período

