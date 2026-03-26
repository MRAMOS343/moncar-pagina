

# Fix: Cotizaciones redirige al login por falta de token

## Causa raíz

`cotizacionService.ts` no envía el token JWT en ninguna de sus llamadas a `apiRequest`. Cuando la página de cotizaciones carga y llama a `fetchCotizaciones`, el backend responde con 401. El `apiClient` detecta el 401, dispara el evento `auth:expired`, que limpia la sesión y redirige al login.

## Solución

Agregar una función `getToken()` (igual que en `vehiculoService.ts`) y pasar el token en todas las llamadas de `cotizacionService.ts`.

### Cambio en `src/services/cotizacionService.ts`

1. Agregar helper `getToken()` que lee de `localStorage.getItem('moncar_token')`
2. Pasar `token: getToken()` en las 5 llamadas a `apiRequest`:
   - `fetchCotizaciones` → GET
   - `createCotizacion` → POST
   - `updateCotizacionEstado` → PATCH
   - `deleteCotizacion` → DELETE
   - `duplicateCotizacion` → POST

3. **Nota adicional**: `createCotizacion` actualmente pasa `body: JSON.stringify(data)` — esto es incorrecto porque `apiRequest` ya hace `JSON.stringify(body)` internamente, resultando en doble serialización. Cambiar a `body: data`. Lo mismo para `updateCotizacionEstado`.

