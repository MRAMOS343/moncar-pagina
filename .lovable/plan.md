
Objetivo: corregir el recorte de la gráfica “Tendencia de Ventas” en Dashboard para que los picos altos se vean completos.

Diagnóstico (según código + captura):
1) En `src/pages/DashboardPage.tsx` la línea usa `type="monotone"`. Con saltos bruscos (ej. 0 → pico alto → 0), esa interpolación puede generar curvas que “se pasan” del rango visible y terminan recortadas arriba.
2) El eje Y está en auto (`<YAxis />`) sin margen superior explícito. Cuando hay picos cercanos al tope, el dominio puede quedar muy justo.
3) `LazyLineChart` ya tiene `margin.top = 10` (`src/components/charts/LazyLineChart.tsx`), pero eso no corrige recortes por dominio/interpolación.

Plan de implementación:
1) Endurecer los datos numéricos del chart en Dashboard:
   - En `tendenciaChartData`, convertir `existing.total` y `existing.num_ventas` con `Number(...)` para evitar comportamientos raros si llegan strings del backend.
2) Definir dominio Y con “headroom”:
   - Calcular `maxValue` desde `tendenciaChartData`.
   - Calcular `yDomainMax` con buffer (p. ej. +12% y redondeo a cientos/miles).
   - Aplicar en `YAxis` como `domain={[0, yDomainMax]}`.
3) Evitar overshoot visual:
   - Cambiar la línea en Dashboard de `type="monotone"` a `type="linear"` (o alternativa segura equivalente sin overshoot).
4) Ajuste fino de espacio superior:
   - Pasar `margin` al `LazyLineChart` desde Dashboard para aumentar top padding en ese gráfico (ej. `top: 20–24`) sin afectar otros charts.
5) Verificación funcional:
   - Probar selector de `7 / 15 / 30 días`.
   - Probar con sucursal específica y “Todas las sucursales”.
   - Confirmar: no se corta arriba, los puntos/tooltip siguen correctos y el eje Y refleja correctamente el máximo.

Resultado esperado:
- La curva ya no se “corta” en la parte superior.
- Los picos quedan totalmente visibles incluso con días de venta muy altos.
- Se mantiene el diseño actual del dashboard, solo mejorando legibilidad y estabilidad visual.
