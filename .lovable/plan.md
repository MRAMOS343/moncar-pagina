

# Implementar flujo de invitacion y gestion de usuarios

## Resumen

Crear 3 elementos principales:
1. Pagina publica `/invitacion` para activar cuenta con token
2. Componente `SetPasswordForm` con indicador de fortaleza
3. Seccion admin en Configuracion para crear usuarios e invitarlos

Todo usando los componentes UI existentes (Card, Input, Label, Button, Select, Alert, Progress) y el patron visual del LoginForm.

---

## Cambio 1: Crear servicio de invitacion

**Archivo nuevo**: `src/services/invitacionService.ts`

- `validateInvitation(token)` → GET `/auth/invitation/:token` (sin auth)
- `setPassword(token, password)` → POST `/auth/set-password` (sin auth)
- `createUsuario(data, authToken)` → POST `/admin/usuarios` (con auth)

Usa `apiRequest` del `apiClient.ts` existente.

## Cambio 2: Crear componente SetPasswordForm

**Archivo nuevo**: `src/components/auth/SetPasswordForm.tsx`

- Formulario con campos password y confirm usando Input/Label/Button existentes
- Barra de fortaleza usando el componente Progress de la UI
- Colores: rojo (debil), amarillo (medio), verde (fuerte)
- Validacion: minimo 8 caracteres, passwords coinciden
- Estilo consistente con LoginForm (space-y-4, Labels, etc.)

## Cambio 3: Crear pagina de invitacion

**Archivo nuevo**: `src/pages/InvitacionPage.tsx`

- Layout centrado identico al LoginForm (`min-h-screen flex items-center justify-center bg-background`)
- Card con logo Moncar igual que login
- Estados: loading (spinner), valid (formulario), invalid (Alert destructive), success (mensaje + redirect a /login)
- Usa `SetPasswordForm` para el paso de crear password
- Redirect automatico a `/login?activated=true` tras exito

## Cambio 4: Crear componente de crear usuario (admin)

**Archivo nuevo**: `src/components/admin/NuevoUsuarioForm.tsx`

- Formulario con: nombre, correo, rol (Select con roles del sistema), sucursal (Select con useSucursales)
- Validacion con Zod
- Al enviar: POST a `/admin/usuarios`, muestra toast de exito/error
- Usa los mismos patrones de Card/Label/Input/Button/Select que ConfiguracionPage

## Cambio 5: Agregar tab "Usuarios" en ConfiguracionPage

**Archivo**: `src/pages/ConfiguracionPage.tsx`

- Agregar nueva tab "Usuarios" visible solo para admin
- Contenido: `NuevoUsuarioForm` + lista de usuarios existentes usando `useUsuarios()`
- Icono: `UserPlus` de lucide

## Cambio 6: Agregar ruta /invitacion al router

**Archivo**: `src/main.tsx`

- Agregar ruta publica (sin ProtectedRoute): `{ path: "invitacion", element: <S><InvitacionPage /></S> }`
- Agregar lazy import de InvitacionPage

## Cambio 7: Mostrar mensaje de activacion en LoginPage

**Archivo**: `src/pages/LoginPage.tsx`

- Leer query param `?activated=true`
- Si presente, mostrar Alert de exito: "Cuenta activada. Ahora puedes iniciar sesion."

---

## Archivos a modificar/crear

| Archivo | Accion |
|---------|--------|
| `src/services/invitacionService.ts` | Crear - endpoints de invitacion |
| `src/components/auth/SetPasswordForm.tsx` | Crear - formulario con strength bar |
| `src/pages/InvitacionPage.tsx` | Crear - pagina publica de activacion |
| `src/components/admin/NuevoUsuarioForm.tsx` | Crear - formulario admin crear usuario |
| `src/pages/ConfiguracionPage.tsx` | Modificar - agregar tab Usuarios |
| `src/main.tsx` | Modificar - agregar ruta /invitacion |
| `src/pages/LoginPage.tsx` | Modificar - mensaje activacion exitosa |

