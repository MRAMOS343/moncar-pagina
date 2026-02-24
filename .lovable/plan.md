

# Correcciones en Módulo de Vehículos

## Cambio 1: Eliminar KPIs de "Rutas Activas" y "Unidades Activas"

En `VehiculosPage.tsx`, eliminar las dos primeras tarjetas KPI (lineas 96-103) y cambiar el grid de 4 columnas a 2 columnas, dejando solo:
- Docs Vencidos
- Por Vencer (30d)

Tambien eliminar del calculo de `kpis` (lineas 48-60) las variables `totalRutas` y `totalUnidades` que ya no se necesitan.

## Cambio 2: Corregir warning de ref en sidebar

En `AppSidebar.tsx`, el `<span className="contents">` wrapper alrededor del `NavLink` no es suficiente para absorber el ref que `TooltipTrigger` intenta pasar. La solucion es usar un `<a>` nativo en lugar de `NavLink` cuando el sidebar esta colapsado (tooltip activo), o mover el wrapper para que sea un elemento que acepte refs (como un `div`).

La correccion mas limpia: cambiar el wrapper `<span className="contents">` por un `React.forwardRef` wrapper, o simplemente no usar `asChild` en `SidebarMenuButton` cuando hay tooltip, renderizando directamente el contenido del boton sin `NavLink` como hijo de `Slot`.

**Enfoque elegido**: Convertir el wrapper a un elemento que acepte refs nativamente. Un `<a>` funciona porque `NavLink` renderiza un `<a>`, asi que podemos usar un anchor con `onClick` que llame a `navigate()`, o mas simple: envolver en un `div` con `className="contents"` que si acepta refs.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/VehiculosPage.tsx` | Eliminar KPIs de rutas y unidades, ajustar grid |
| `src/components/layout/AppSidebar.tsx` | Corregir wrapper de NavLink para aceptar ref |

