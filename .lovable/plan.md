
Contexto y diagnóstico (por qué “parece caching”, pero en realidad es otra cosa)
- En tu app hay 2 lugares que muestran “Ventas Totales / Ticket Promedio / Transacciones”:
  1) VentasPage: usa el hook useVentasKPIs (ya lo ampliamos a 5,000 registros).
  2) DashboardPage (ruta actual /dashboard): NO usa useVentasKPIs. Calcula los KPIs a partir de useDashboardSales + dashboardKpiService.

Hallazgo clave en el código
- useDashboardSales (src/hooks/useDashboardSales.ts) tiene límites “para carga rápida”:
  - PAGE_SIZE = 500
  - MAX_PAGES = 5
  - MAX_ITEMS = 2500
- Si en el periodo (últimos 30 días) hay más de 2,500 ventas (muy común cuando estás en “Todas las sucursales”), el hook se corta, marca truncated=true, y el Dashboard calcula KPIs con datos incompletos → por eso los valores salen menores.
- Además, useDashboardSales usa staleTime = 5 min y placeholderData = keepPreviousData:
  - Esto puede dar sensación de “caching” (ves datos anteriores mientras recarga, o no refetch inmediato), pero NO arregla el problema de fondo si se está truncando la data.

Objetivo del cambio
- Que el Dashboard muestre KPIs correctos (no menores) y que, si por razones de performance se llega a truncar, el usuario lo vea claramente con un aviso y acción de “Actualizar”.

Solución propuesta (en 2 capas)

Capa A: Evitar truncado en Dashboard (principal causa de valores menores)
1) Aumentar límites en src/hooks/useDashboardSales.ts
   - Cambiar a un techo similar al de KPIs, o superior para “all”:
     - MAX_PAGES: 5 → 10 o 20
     - MAX_ITEMS: 2500 → 5000 o 10000
     - PAGE_SIZE: mantener 500 (bien para reducir llamadas)
   - Motivo: el Dashboard usa ese mismo dataset para KPIs + tendencia + pie + ventas recientes; si está incompleto, todo eso queda subestimado.

2) Mantener el flag truncated pero con mensaje visible en UI
   - Ya se setea truncated=true cuando se alcanza el límite.
   - Lo que falta es: DashboardPage ignora ese flag y no informa nada.

Capa B: Reducir el “efecto caching” percibido (sin perder performance)
3) Ajustar comportamiento de React Query para Dashboard
   - En useDashboardSales, reemplazar el hardcode por QUERY_CONFIG.DASHBOARD (src/constants/queryConfig.ts) y agregar:
     - refetchOnMount: 'always' (o al menos true)
     - refetchOnWindowFocus: true
   - Alternativa (si quieres máxima frescura): staleTime: 0, pero esto incrementa llamadas.
   - Mantener o quitar keepPreviousData:
     - Recomendación: mantenerlo, pero acompañarlo de un indicador “Actualizando…” para que no parezca que “se quedó con datos viejos”.

4) Botón explícito “Actualizar” en DashboardPage
   - Agregar un botón (por ejemplo junto a “Nueva Venta / Agregar Producto”) que llame refetch() del query de useDashboardSales.
   - Esto da control total al usuario y elimina dudas sobre caching.

Cambios concretos por archivo

1) src/hooks/useDashboardSales.ts
- Subir límites:
  - MAX_ITEMS y MAX_PAGES
- React Query:
  - Añadir refetchOnMount / refetchOnWindowFocus
  - Opcional: usar QUERY_CONFIG.DASHBOARD para centralizar.
- Mantener el retorno DashboardSalesResult (items/truncated/pageCount/totalFetched).

2) src/pages/DashboardPage.tsx
- Leer salesResult.truncated y salesResult.totalFetched.
- Mostrar un aviso visible cuando truncated=true, por ejemplo debajo de los KPIs o en la cabecera:
  - “Aviso: el dashboard solo cargó 5,000 ventas (límite). Los KPIs podrían ser menores. Presiona Actualizar o reduce el período/sucursal.”
- Agregar botón “Actualizar” que ejecute refetch() del hook useDashboardSales.
- (Opcional recomendado) Mostrar estado “Actualizando…” usando isFetching (React Query) para que el usuario entienda que está recargando.

Validación (cómo sabremos que quedó bien)
- Caso 1: Sucursal “moncar”
  - Revisar que KPIs coincidan con lo esperado.
  - Confirmar que truncated=false o, si true, que el mensaje aparezca.
- Caso 2: “Todas las sucursales”
  - Confirmar que los KPIs ya no estén “cortados” (menores).
  - Si hay muchísimas ventas en 30 días y aún se llega al límite, verificar que:
    - truncated=true
    - se muestra el aviso y el totalFetched
- Confirmar en Network que se hacen más páginas cuando antes se quedaba corto (más requests /sales con cursor).

Riesgos y trade-offs
- Subir MAX_ITEMS/MAX_PAGES incrementa llamadas a /sales y puede hacer el Dashboard más lento en “Todas las sucursales”.
- Mitigación:
  - Mantener PAGE_SIZE=500.
  - Mantener cache (staleTime) pero con botón de “Actualizar”.
  - Mostrar mensaje de truncado para transparencia si aún no alcanzamos todo.

Notas adicionales (no bloqueantes)
- Hay un warning de Recharts sobre refs en DashboardPage. No es la causa de KPIs incorrectos, pero se puede arreglar después (mejora de limpieza/estabilidad).

Entregable final
- Dashboard con KPIs correctos (o con aviso claro si se alcanza límite) y botón de “Actualizar” para eliminar dudas sobre caching.
